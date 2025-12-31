import Decimal from "decimal.js";
import type { ElectricityInput, EmissionResult } from "../types";
import { createEmptyResult } from "../converters";
import { getGridFactor } from "../../constants/grid-factors";
import type { GWPReference } from "../../constants/gwp";

/**
 * Calculate emissions from purchased electricity (Scope 2)
 */
export function calculateElectricityEmissions(
  input: ElectricityInput,
  gwpReference: GWPReference = "AR5"
): EmissionResult {
  const result = createEmptyResult(2, "PURCHASED_ELECTRICITY", gwpReference);

  // Get grid emission factor (tCO2/MWh)
  const gridFactor = getGridFactor(input.year, input.month);

  // Convert kWh to MWh
  const consumptionMWh = input.consumption.div(1000);

  // Calculate emissions (tCO2/MWh * MWh = tCO2)
  const co2Tonnes = consumptionMWh.mul(gridFactor);

  // Store results
  result.co2Mass = co2Tonnes.mul(1000); // Convert to kg
  result.co2Equivalent = co2Tonnes;

  // Grid electricity emissions are anthropogenic (not biogenic)
  result.biogenicCo2 = new Decimal(0);

  result.factorsSnapshot = {
    gridFactor,
    year: input.year,
    month: input.month,
    consumptionMWh: consumptionMWh.toNumber(),
    source: "MCTI/SIRENE",
  };

  return result;
}

/**
 * Calculate emissions for multiple months
 */
export function calculateAnnualElectricityEmissions(
  monthlyConsumption: Record<number, Decimal>, // month (1-12) -> kWh
  year: number,
  gwpReference: GWPReference = "AR5"
): EmissionResult {
  const result = createEmptyResult(2, "PURCHASED_ELECTRICITY", gwpReference);

  const monthlyResults: { month: number; co2: number; factor: number }[] = [];

  for (const [month, consumption] of Object.entries(monthlyConsumption)) {
    const monthNum = parseInt(month);
    const monthResult = calculateElectricityEmissions(
      { consumption, year, month: monthNum },
      gwpReference
    );

    result.co2Mass = result.co2Mass.plus(monthResult.co2Mass);
    result.co2Equivalent = result.co2Equivalent.plus(monthResult.co2Equivalent);

    monthlyResults.push({
      month: monthNum,
      co2: monthResult.co2Equivalent.toNumber(),
      factor: getGridFactor(year, monthNum),
    });
  }

  result.factorsSnapshot = {
    year,
    monthlyResults,
    source: "MCTI/SIRENE",
  };

  return result;
}

/**
 * Validate electricity input
 */
export function validateElectricityInput(
  input: ElectricityInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.consumption || input.consumption.lt(0)) {
    errors.push("Consumo deve ser maior ou igual a zero");
  }

  if (!input.year || input.year < 2000 || input.year > 2100) {
    errors.push("Ano inválido");
  }

  if (input.month !== undefined && (input.month < 1 || input.month > 12)) {
    errors.push("Mês deve estar entre 1 e 12");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get available grid factor years
 */
export function getAvailableGridYears(): number[] {
  // Based on GRID_EMISSION_FACTORS in grid-factors.ts
  return [2018, 2019, 2020, 2021, 2022, 2023, 2024];
}
