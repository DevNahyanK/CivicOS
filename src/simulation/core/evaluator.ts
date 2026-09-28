import type { CalculationFunction } from "../types";

/**
 * Safe, deterministic calculation utilities.
 * Strictly guarantees NO eval() and NO new Function() usage.
 */

export function safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
  if (denominator === 0 || !Number.isFinite(denominator) || !Number.isFinite(numerator)) {
    return fallback;
  }
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : fallback;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function round(value: number, decimals: number = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Safe expression AST types for declarative formula representation.
 */
export type SafeExpression =
  | { type: "literal"; value: number }
  | { type: "variable"; name: string }
  | { type: "add"; left: SafeExpression; right: SafeExpression }
  | { type: "subtract"; left: SafeExpression; right: SafeExpression }
  | { type: "multiply"; left: SafeExpression; right: SafeExpression }
  | { type: "divide"; left: SafeExpression; right: SafeExpression; fallback?: number }
  | { type: "min"; expressions: SafeExpression[] }
  | { type: "max"; expressions: SafeExpression[] }
  | { type: "clamp"; expression: SafeExpression; min: number; max: number };

/**
 * Evaluates a declarative safe AST without any code execution or string eval.
 */
export function evaluateSafeExpression(
  expr: SafeExpression,
  variables: Record<string, number>
): number {
  switch (expr.type) {
    case "literal":
      return expr.value;

    case "variable": {
      const val = variables[expr.name];
      if (typeof val !== "number" || !Number.isFinite(val)) {
        throw new Error(`Variable "${expr.name}" not found or not a valid number`);
      }
      return val;
    }

    case "add":
      return (
        evaluateSafeExpression(expr.left, variables) +
        evaluateSafeExpression(expr.right, variables)
      );

    case "subtract":
      return (
        evaluateSafeExpression(expr.left, variables) -
        evaluateSafeExpression(expr.right, variables)
      );

    case "multiply":
      return (
        evaluateSafeExpression(expr.left, variables) *
        evaluateSafeExpression(expr.right, variables)
      );

    case "divide": {
      const left = evaluateSafeExpression(expr.left, variables);
      const right = evaluateSafeExpression(expr.right, variables);
      return safeDivide(left, right, expr.fallback ?? 0);
    }

    case "min": {
      if (expr.expressions.length === 0) return 0;
      const values = expr.expressions.map((e) => evaluateSafeExpression(e, variables));
      return Math.min(...values);
    }

    case "max": {
      if (expr.expressions.length === 0) return 0;
      const values = expr.expressions.map((e) => evaluateSafeExpression(e, variables));
      return Math.max(...values);
    }

    case "clamp": {
      const val = evaluateSafeExpression(expr.expression, variables);
      return clamp(val, expr.min, expr.max);
    }

    default: {
      const exhaustiveCheck: never = expr;
      throw new Error(`Unsupported expression type: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
}

/**
 * Executes an explicitly registered deterministic calculation function.
 */
export function executeCalculation(
  fn: CalculationFunction,
  inputs: Record<string, number>,
  intermediate: Record<string, number>
): number {
  const result = fn(inputs, intermediate);
  if (!Number.isFinite(result)) {
    return 0;
  }
  return round(result, 4);
}
