/**
 * CivicOS Generic Deterministic Simulation Contracts
 *
 * Core architectural principle:
 * - Deterministic TypeScript execution
 * - Zero dynamic script execution (no eval, no Function)
 * - Clear provenance tracking: user_input | calculated | ai_suggestion | assumption
 */

export type Provenance = "user_input" | "calculated" | "ai_suggestion" | "assumption";

export type SimulationVariableType = "number" | "percentage" | "currency" | "integer" | "boolean";

export interface SimulationInputDefinition {
  key: string;
  label: string;
  description?: string;
  type: SimulationVariableType;
  defaultValue: number | boolean;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}

export type SimulationInputValues = Record<string, number | boolean>;

/**
 * Represents a single resolved input parameter with its applied value and source provenance.
 */
export interface SimulationInput {
  key: string;
  label: string;
  value: number | boolean;
  unit?: string;
  provenance: "user_input" | "assumption";
  isOverridden: boolean;
}

export interface SimulationAssumption {
  key: string;
  description: string;
  source?: string;
  provenance: "assumption";
}

export interface EvaluationContext {
  inputs: Record<string, number | boolean>;
  intermediate: Record<string, number>;
  metrics: Record<string, number | boolean | string>;
}

export interface ConstraintEvaluationResult {
  constraintId: string;
  label: string;
  description: string;
  satisfied: boolean;
  severity: "warning" | "violation";
  message?: string;
}

export interface SimulationConstraint {
  id: string;
  label: string;
  description: string;
  severity: "warning" | "violation";
  evaluate: (context: EvaluationContext) => { satisfied: boolean; message?: string };
}

export interface SimulationBottleneck {
  id: string;
  label: string;
  description: string;
  detected: boolean;
  severity: "low" | "medium" | "high";
  message: string;
  suggestedIntervention?: string;
}

export interface BottleneckRule {
  id: string;
  label: string;
  description: string;
  suggestedIntervention?: string;
  detect: (context: EvaluationContext) => {
    detected: boolean;
    message?: string;
    severity?: "low" | "medium" | "high";
  };
}

export interface SimulationMetric {
  key: string;
  label: string;
  description?: string;
  value: number | boolean | string;
  unit?: string;
  provenance: "calculated";
  format?: "number" | "currency" | "percentage" | "integer";
}

export type CalculationFunction = (
  inputs: Record<string, number>,
  intermediate: Record<string, number>
) => number;

export interface FormulaDefinition {
  key: string;
  label: string;
  description?: string;
  unit?: string;
  calculate: CalculationFunction;
}

export interface OutputMetricDefinition {
  key: string;
  label: string;
  description?: string;
  formulaKey: string;
  unit?: string;
  format?: "number" | "currency" | "percentage" | "integer";
}

export interface SimulationModelDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  inputs: SimulationInputDefinition[];
  assumptions: SimulationAssumption[];
  formulas: FormulaDefinition[];
  constraints: SimulationConstraint[];
  bottleneckRules: BottleneckRule[];
  outputMetrics: OutputMetricDefinition[];
}

export interface SimulationRunOptions {
  model: SimulationModelDefinition;
  inputs?: SimulationInputValues;
  scenarioOverrides?: SimulationInputValues;
}

export interface SimulationOutput {
  metrics: Record<string, SimulationMetric>;
  constraints: ConstraintEvaluationResult[];
  bottlenecks: SimulationBottleneck[];
}

export interface SimulationResult {
  modelId: string;
  modelVersion: string;
  timestamp: string;
  resolvedInputs: Record<string, SimulationInput>;
  intermediateCalculations: Record<string, number>;
  metrics: Record<string, SimulationMetric>;
  constraints: ConstraintEvaluationResult[];
  bottlenecks: SimulationBottleneck[];
  isValid: boolean;
  validationErrors: string[];
}
