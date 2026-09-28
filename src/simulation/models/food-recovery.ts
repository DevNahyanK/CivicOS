import type { SimulationModelDefinition } from "../types";
import { safeDivide } from "../core/evaluator";

/**
 * Generic food-recovery and redistribution simulation model for CivicOS.
 *
 * Core Equation:
 *   restaurants × average surplus × collection efficiency = estimated food recovered
 *
 * Configurable parameters with fleet capacity bounds and meal yield projections.
 * Values are illustrative civic-planning estimates, not hardcoded statistics.
 */
export const foodRecoveryModelDefinition: SimulationModelDefinition = {
  id: "generic_food_recovery_v1",
  name: "Food Surplus Recovery & Redistribution Model",
  version: "1.0.0",
  description:
    "Generic deterministic simulation estimating surplus edible food diverted from commercial establishments, fleet capacity constraints, and potential meals delivered.",

  inputs: [
    {
      key: "participating_restaurants",
      label: "Participating Food Establishments",
      description: "Number of partner restaurants, bakeries, or markets donating edible surplus",
      type: "integer",
      defaultValue: 60,
      unit: "establishments",
      min: 1,
      max: 2000,
      step: 1,
    },
    {
      key: "daily_surplus_per_restaurant_kg",
      label: "Daily Surplus per Establishment",
      description: "Average edible unsold surplus generated daily per location",
      type: "number",
      defaultValue: 18.5,
      unit: "kg/day",
      min: 1,
      max: 200,
      step: 0.5,
    },
    {
      key: "collection_efficiency_pct",
      label: "Collection & Transport Efficiency",
      description: "Percentage of available surplus successfully collected and transported before spoilage",
      type: "percentage",
      defaultValue: 75,
      unit: "%",
      min: 0,
      max: 100,
      step: 1,
    },
    {
      key: "active_vehicles",
      label: "Active Recovery Vehicles",
      description: "Logistics fleet size deployed for daily collection runs",
      type: "integer",
      defaultValue: 3,
      unit: "vehicles",
      min: 1,
      max: 50,
      step: 1,
    },
    {
      key: "vehicle_capacity_kg",
      label: "Vehicle Daily Capacity",
      description: "Maximum payload volume each vehicle can transport per working shift",
      type: "number",
      defaultValue: 350,
      unit: "kg/vehicle",
      min: 50,
      max: 2500,
      step: 25,
    },
    {
      key: "meals_per_kg",
      label: "Meal Conversion Ratio",
      description: "Standardized estimate of portioned meals yielded per kilogram of recovered food",
      type: "number",
      defaultValue: 2.1,
      unit: "meals/kg",
      min: 0.5,
      max: 5.0,
      step: 0.1,
    },
  ],

  assumptions: [
    {
      key: "avg_surplus_uniformity",
      description: "Surplus volume is estimated as a daily average across all participating locations.",
      provenance: "assumption",
    },
    {
      key: "fleet_shift_single",
      description: "Vehicles are modeled on a single daily logistics collection shift.",
      provenance: "assumption",
    },
    {
      key: "standardized_meal_weight",
      description: "One meal portion is assumed to require approximately 0.45 to 0.5 kg of balanced food.",
      provenance: "assumption",
    },
  ],

  formulas: [
    {
      key: "daily_total_surplus_kg",
      label: "Total Daily Surplus Generated",
      unit: "kg",
      calculate: (inputs) =>
        inputs.participating_restaurants * inputs.daily_surplus_per_restaurant_kg,
    },
    {
      key: "total_fleet_capacity_kg",
      label: "Total Daily Fleet Transport Capacity",
      unit: "kg",
      calculate: (inputs) =>
        inputs.active_vehicles * inputs.vehicle_capacity_kg,
    },
    {
      key: "potential_collected_kg",
      label: "Potential Surplus Collected Before Logistics Cap",
      unit: "kg",
      calculate: (inputs, intermediate) =>
        intermediate.daily_total_surplus_kg * (inputs.collection_efficiency_pct / 100),
    },
    {
      key: "actual_recovered_food_kg",
      label: "Actual Recovered Food",
      unit: "kg",
      calculate: (_inputs, intermediate) =>
        Math.min(intermediate.potential_collected_kg, intermediate.total_fleet_capacity_kg),
    },
    {
      key: "meals_provided_daily",
      label: "Estimated Daily Meals Provided",
      unit: "meals",
      calculate: (inputs, intermediate) =>
        intermediate.actual_recovered_food_kg * inputs.meals_per_kg,
    },
    {
      key: "fleet_utilization_pct",
      label: "Fleet Capacity Utilization",
      unit: "%",
      calculate: (_inputs, intermediate) =>
        safeDivide(
          intermediate.potential_collected_kg,
          intermediate.total_fleet_capacity_kg,
          0
        ) * 100,
    },
  ],

  constraints: [
    {
      id: "fleet_capacity_limit",
      label: "Fleet Capacity Feasibility",
      description: "Validates whether potential food surplus exceeds total logistics fleet capacity",
      severity: "warning",
      evaluate: (context) => {
        const potential = Number(context.intermediate.potential_collected_kg ?? 0);
        const capacity = Number(context.intermediate.total_fleet_capacity_kg ?? 0);
        const satisfied = potential <= capacity;
        return {
          satisfied,
          message: satisfied
            ? undefined
            : `Potential collection (${Math.round(potential)} kg) exceeds vehicle fleet capacity (${Math.round(capacity)} kg); surplus is bottlenecked by transport logistics.`,
        };
      },
    },
    {
      id: "minimum_efficiency_threshold",
      label: "Operational Efficiency Viability",
      description: "Collection efficiency must meet the minimum viable operational threshold of 5%",
      severity: "violation",
      evaluate: (context) => {
        const efficiency = Number(context.inputs.collection_efficiency_pct ?? 0);
        const satisfied = efficiency >= 5;
        return {
          satisfied,
          message: satisfied
            ? undefined
            : `Collection efficiency (${efficiency}%) is below the minimum viable threshold of 5%.`,
        };
      },
    },
  ],

  bottleneckRules: [
    {
      id: "logistics_fleet_saturation",
      label: "Logistics Vehicle Fleet Bottleneck",
      description: "Potential collected food surplus approaches or exceeds fleet vehicle transport capacity",
      suggestedIntervention:
        "Deploy additional collection vans, introduce evening multi-shift routing, or partner with commercial cold-chain carriers.",
      detect: (context) => {
        const utilization = Number(context.intermediate.fleet_utilization_pct ?? 0);
        const detected = utilization >= 90;
        return {
          detected,
          severity: utilization > 100 ? "high" : "medium",
          message: `Fleet utilization is at ${Math.round(utilization)}% of maximum daily capacity.`,
        };
      },
    },
    {
      id: "low_donor_density",
      label: "Low Donor Network Density",
      description: "Fewer than 15 food providers are enrolled, limiting geographical routing efficiency",
      suggestedIntervention:
        "Launch an institutional food-donor onboarding drive and offer municipal tax/civic recognition certificates.",
      detect: (context) => {
        const count = Number(context.inputs.participating_restaurants ?? 0);
        const detected = count < 15;
        return {
          detected,
          severity: "low",
          message: `Only ${count} establishments enrolled; critical mass for efficient neighborhood clustering is not yet achieved.`,
        };
      },
    },
  ],

  outputMetrics: [
    {
      key: "actual_recovered_food_kg",
      label: "Estimated Daily Food Recovered",
      description: "Total edible food successfully collected and delivered per day",
      formulaKey: "actual_recovered_food_kg",
      unit: "kg/day",
      format: "number",
    },
    {
      key: "meals_provided_daily",
      label: "Projected Daily Meals Provided",
      description: "Estimated individual meal portions distributed to community feeding centers",
      formulaKey: "meals_provided_daily",
      unit: "meals/day",
      format: "integer",
    },
    {
      key: "fleet_utilization_pct",
      label: "Fleet Capacity Utilization",
      description: "Ratio of potential surplus volume to available vehicle transport capacity",
      formulaKey: "fleet_utilization_pct",
      unit: "%",
      format: "percentage",
    },
    {
      key: "daily_total_surplus_kg",
      label: "Total Commercial Surplus Generated",
      description: "Baseline unsold food generated across participating network",
      formulaKey: "daily_total_surplus_kg",
      unit: "kg/day",
      format: "number",
    },
  ],
};
