/**
 * GEE Inventory Calculation Engine
 *
 * This module provides the core calculation functionality for greenhouse gas emissions
 * following IPCC guidelines and GHG Protocol methodology.
 */

import Decimal from "decimal.js";
import type {
  EmissionResult,
  CalculationContext,
  StationaryCombustionInput,
  MobileCombustionInput,
  FugitiveEmissionsInput,
  ElectricityInput,
  FertilizerInput,
  ForestInput,
  FireInput,
  WasteInput,
  EffluentInput,
  AirTravelInput,
  MaritimeTransportInput,
} from "./types";
import { sumEmissionResults, createEmptyResult } from "./converters";
import {
  calculateStationaryCombustion,
  calculateMobileCombustion,
  calculateFugitiveEmissions,
  calculateElectricityEmissions,
  calculateForestRemovals,
  calculateFertilizerEmissions,
  calculateFireEmissionsResult,
  calculateWasteEmissions,
  calculateEffluentEmissionsResult,
  calculateAirTravelEmissionsResult,
  calculateMaritimeEmissionsResult,
} from "./calculators";
import type { GWPReference } from "../constants/gwp";

// Configure Decimal.js
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// Re-export types
export * from "./types";
export * from "./converters";
export * from "./calculators";

/**
 * Main calculation pipeline
 */
export class CalculationEngine {
  private context: CalculationContext;

  constructor(context: CalculationContext) {
    this.context = context;
  }

  /**
   * Calculate emissions for a single activity data record
   */
  calculateActivity(
    category: string,
    data: Record<string, unknown>
  ): EmissionResult {
    const gwpRef = this.context.gwpReference;

    switch (category) {
      case "STATIONARY_COMBUSTION":
        return calculateStationaryCombustion(
          data as unknown as StationaryCombustionInput,
          gwpRef
        );

      case "MOBILE_COMBUSTION":
        return calculateMobileCombustion(
          data as unknown as MobileCombustionInput,
          gwpRef
        );

      case "FUGITIVE_EMISSIONS":
        return calculateFugitiveEmissions(
          data as unknown as FugitiveEmissionsInput,
          gwpRef
        );

      case "PURCHASED_ELECTRICITY":
        return calculateElectricityEmissions(
          data as unknown as ElectricityInput,
          gwpRef
        );

      case "AGRICULTURAL":
        return calculateFertilizerEmissions(
          data as unknown as FertilizerInput,
          gwpRef
        );

      case "LULUCF":
        if (data.type === "fire" || data.fireType) {
          return calculateFireEmissionsResult(
            data as unknown as FireInput,
            gwpRef
          );
        }
        return calculateForestRemovals(
          data as unknown as ForestInput,
          gwpRef
        );

      case "WASTE_INTERNAL":
        if (data.dboInput || data.treatmentType?.toString().includes("efluent")) {
          return calculateEffluentEmissionsResult(
            data as unknown as EffluentInput,
            gwpRef
          );
        }
        return calculateWasteEmissions(
          data as unknown as WasteInput,
          gwpRef
        );

      case "WASTE_EXTERNAL":
        return calculateWasteEmissions(
          data as unknown as WasteInput,
          gwpRef
        );

      case "BUSINESS_TRAVEL":
        return calculateAirTravelEmissionsResult(
          data as unknown as AirTravelInput,
          gwpRef
        );

      case "DOWNSTREAM_TRANSPORT":
      case "UPSTREAM_TRANSPORT":
        return calculateMaritimeEmissionsResult(
          data as unknown as MaritimeTransportInput,
          gwpRef
        );

      default:
        console.warn(`Unknown category: ${category}`);
        return createEmptyResult(1, category, gwpRef);
    }
  }

  /**
   * Calculate emissions for multiple activities
   */
  calculateMultiple(
    activities: Array<{ category: string; data: Record<string, unknown> }>
  ): EmissionResult[] {
    return activities.map(({ category, data }) =>
      this.calculateActivity(category, data)
    );
  }

  /**
   * Calculate and aggregate emissions by scope
   */
  calculateByScope(
    activities: Array<{ category: string; data: Record<string, unknown> }>
  ): Record<number, EmissionResult[]> {
    const results = this.calculateMultiple(activities);

    const byScope: Record<number, EmissionResult[]> = {
      1: [],
      2: [],
      3: [],
    };

    for (const result of results) {
      if (byScope[result.scope]) {
        byScope[result.scope].push(result);
      }
    }

    return byScope;
  }

  /**
   * Get total emissions by scope
   */
  getTotalsByScope(
    results: Record<number, EmissionResult[]>
  ): Record<number, { total: Decimal; biogenic: Decimal; removals: Decimal }> {
    const totals: Record<
      number,
      { total: Decimal; biogenic: Decimal; removals: Decimal }
    > = {};

    for (const [scope, scopeResults] of Object.entries(results)) {
      const scopeNum = parseInt(scope);
      totals[scopeNum] = {
        total: scopeResults.reduce(
          (sum, r) => sum.plus(r.co2Equivalent),
          new Decimal(0)
        ),
        biogenic: scopeResults.reduce(
          (sum, r) => sum.plus(r.biogenicCo2),
          new Decimal(0)
        ),
        removals: scopeResults.reduce(
          (sum, r) => sum.plus(r.removals),
          new Decimal(0)
        ),
      };
    }

    return totals;
  }
}

/**
 * Create a new calculation engine instance
 */
export function createCalculationEngine(
  context: CalculationContext
): CalculationEngine {
  return new CalculationEngine(context);
}

/**
 * Quick calculation function for simple use cases
 */
export function quickCalculate(
  category: string,
  data: Record<string, unknown>,
  gwpReference: GWPReference = "AR5"
): EmissionResult {
  const engine = new CalculationEngine({
    gwpReference,
    year: new Date().getFullYear(),
    organizationId: "",
    inventoryId: "",
  });

  return engine.calculateActivity(category, data);
}
