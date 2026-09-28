import type {
  ConstraintEvaluationResult,
  EvaluationContext,
  SimulationBottleneck,
  SimulationInput,
  SimulationMetric,
  SimulationResult,
  SimulationRunOptions,
} from "../types";
import { executeCalculation, round } from "./evaluator";

/**
 * Deterministic Simulation Engine for CivicOS.
 *
 * Guaranteed Properties:
 * 1. 100% Deterministic: identical inputs produce identical outputs.
 * 2. Zero Code Injection: no eval(), no Function constructor.
 * 3. Provenance Integrity: calculated outputs are tagged with provenance = "calculated".
 * 4. Constraint & Bottleneck Analysis: identifies limits and threshold boundaries.
 */
export class SimulationEngine {
  /**
   * Executes a simulation model run with provided inputs and optional scenario overrides.
   */
  public static run(options: SimulationRunOptions): SimulationResult {
    const { model, inputs = {}, scenarioOverrides = {} } = options;
    const validationErrors: string[] = [];
    const resolvedInputs: Record<string, SimulationInput> = {};
    const rawInputValues: Record<string, number | boolean> = {};
    const numericInputs: Record<string, number> = {};

    // 1. Resolve inputs with defaults & scenario overrides
    for (const inputDef of model.inputs) {
      const hasOverride = Object.prototype.hasOwnProperty.call(scenarioOverrides, inputDef.key);
      const hasUserValue = Object.prototype.hasOwnProperty.call(inputs, inputDef.key);

      let value: number | boolean;
      let provenance: "user_input" | "assumption";
      let isOverridden = false;

      if (hasOverride) {
        value = scenarioOverrides[inputDef.key];
        provenance = "user_input";
        isOverridden = true;
      } else if (hasUserValue) {
        value = inputs[inputDef.key];
        provenance = "user_input";
      } else {
        value = inputDef.defaultValue;
        provenance = "assumption";
      }

      // Type and range validation
      if (inputDef.type === "boolean") {
        if (typeof value !== "boolean") {
          validationErrors.push(`Input "${inputDef.key}" must be a boolean.`);
          value = Boolean(value);
        }
      } else {
        const numVal = Number(value);
        if (!Number.isFinite(numVal)) {
          validationErrors.push(
            `Input "${inputDef.key}" must be a valid number, received: ${String(value)}`
          );
          value = typeof inputDef.defaultValue === "number" ? inputDef.defaultValue : 0;
        } else {
          value = numVal;

          if (inputDef.min !== undefined && numVal < inputDef.min) {
            validationErrors.push(
              `Input "${inputDef.key}" (${numVal}) is below minimum allowed value of ${inputDef.min}.`
            );
          }
          if (inputDef.max !== undefined && numVal > inputDef.max) {
            validationErrors.push(
              `Input "${inputDef.key}" (${numVal}) exceeds maximum allowed value of ${inputDef.max}.`
            );
          }
        }
        numericInputs[inputDef.key] = value as number;
      }

      rawInputValues[inputDef.key] = value;
      resolvedInputs[inputDef.key] = {
        key: inputDef.key,
        label: inputDef.label,
        value,
        unit: inputDef.unit,
        provenance,
        isOverridden,
      };
    }

    // 2. Evaluate intermediate formulas sequentially
    const intermediateCalculations: Record<string, number> = {};
    for (const formula of model.formulas) {
      const result = executeCalculation(
        formula.calculate,
        numericInputs,
        intermediateCalculations
      );
      intermediateCalculations[formula.key] = result;
    }

    // 3. Assemble output metrics with strict provenance = "calculated"
    const metrics: Record<string, SimulationMetric> = {};
    const metricValues: Record<string, number | boolean | string> = {};

    for (const outDef of model.outputMetrics) {
      const rawVal = intermediateCalculations[outDef.formulaKey] ?? 0;
      const roundedVal = outDef.format === "integer" ? Math.round(rawVal) : round(rawVal, 2);

      metrics[outDef.key] = {
        key: outDef.key,
        label: outDef.label,
        description: outDef.description,
        value: roundedVal,
        unit: outDef.unit,
        provenance: "calculated",
        format: outDef.format ?? "number",
      };
      metricValues[outDef.key] = roundedVal;
    }

    // 4. Construct unified evaluation context
    const context: EvaluationContext = {
      inputs: rawInputValues,
      intermediate: intermediateCalculations,
      metrics: metricValues,
    };

    // 5. Evaluate constraints
    const constraints: ConstraintEvaluationResult[] = model.constraints.map((c) => {
      try {
        const evalResult = c.evaluate(context);
        return {
          constraintId: c.id,
          label: c.label,
          description: c.description,
          satisfied: evalResult.satisfied,
          severity: c.severity,
          message: evalResult.message,
        };
      } catch (err: unknown) {
        return {
          constraintId: c.id,
          label: c.label,
          description: c.description,
          satisfied: false,
          severity: c.severity,
          message: err instanceof Error ? err.message : "Error evaluating constraint",
        };
      }
    });

    // 6. Detect bottlenecks
    const bottlenecks: SimulationBottleneck[] = model.bottleneckRules
      .map((rule) => {
        try {
          const evalResult = rule.detect(context);
          return {
            id: rule.id,
            label: rule.label,
            description: rule.description,
            detected: evalResult.detected,
            severity: evalResult.severity ?? "medium",
            message: evalResult.message ?? rule.description,
            suggestedIntervention: rule.suggestedIntervention,
          };
        } catch (err: unknown) {
          return {
            id: rule.id,
            label: rule.label,
            description: rule.description,
            detected: false,
            severity: "low" as const,
            message: err instanceof Error ? err.message : "Error detecting bottleneck",
            suggestedIntervention: rule.suggestedIntervention,
          };
        }
      })
      .filter((b) => b.detected);

    // 7. Determine overall validity
    const hasViolation = constraints.some((c) => !c.satisfied && c.severity === "violation");
    const isValid = validationErrors.length === 0 && !hasViolation;

    return {
      modelId: model.id,
      modelVersion: model.version,
      timestamp: new Date().toISOString(),
      resolvedInputs,
      intermediateCalculations,
      metrics,
      constraints,
      bottlenecks,
      isValid,
      validationErrors,
    };
  }
}

export function runSimulation(options: SimulationRunOptions): SimulationResult {
  return SimulationEngine.run(options);
}
