import Decimal from "decimal.js";
import type { StationaryCombustionInput, EmissionResult } from "../types";
import { convertToCO2e, createEmptyResult, volumeToMass } from "../converters";
import {
  STATIONARY_COMBUSTION_FACTORS,
  getEmissionFactor,
} from "../../constants/emission-factors";
import { getFossilFraction } from "../../constants/biofuel-blends";
import { getGWP, type GWPReference } from "../../constants/gwp";

/**
 * Calculate emissions from stationary combustion
 */
export function calculateStationaryCombustion(
  input: StationaryCombustionInput,
  gwpReference: GWPReference = "AR5"
): EmissionResult {
  const result = createEmptyResult(
    1,
    "STATIONARY_COMBUSTION",
    gwpReference
  );

  const factor = getEmissionFactor(input.fuelType, "stationary");
  if (!factor) {
    console.warn(`No emission factor found for fuel: ${input.fuelType}`);
    return result;
  }

  // Get quantity in m³ or the appropriate unit
  let quantity = input.quantity;

  // Convert units if necessary
  if (input.unit.toLowerCase() === "l" || input.unit.toLowerCase() === "litro") {
    quantity = quantity.div(1000); // Convert to m³
  } else if (input.unit.toLowerCase() === "t" || input.unit.toLowerCase() === "ton") {
    // If in tonnes, we need to convert based on the fuel
    if (factor.density) {
      quantity = quantity.mul(1000).div(factor.density); // Convert to m³
    }
  } else if (input.unit.toLowerCase() === "kg") {
    if (factor.density) {
      quantity = quantity.div(factor.density); // Convert to m³
    }
  } else if (input.unit.toLowerCase() === "gj") {
    // Already in energy units, calculate directly
    const energyGJ = quantity;

    // Calculate emissions (ton CO2/GJ * GJ = ton)
    const co2Tonnes = energyGJ.mul(factor.co2);
    const ch4Tonnes = energyGJ.mul(factor.ch4);
    const n2oTonnes = energyGJ.mul(factor.n2o);

    // Get fossil/renewable fractions
    const fractions = getFossilFraction(input.fuelType, input.year);

    // Apply fossil fraction for anthropogenic emissions
    result.co2Mass = co2Tonnes.mul(fractions.fossil).mul(1000); // Convert to kg
    result.ch4Mass = ch4Tonnes.mul(1000);
    result.n2oMass = n2oTonnes.mul(1000);

    // Biogenic emissions
    result.biogenicCo2 = co2Tonnes.mul(fractions.renewable);

    // Calculate CO2e
    const gwpCH4 = getGWP("CH4", gwpReference);
    const gwpN2O = getGWP("N2O", gwpReference);

    result.co2Equivalent = result.co2Mass
      .div(1000)
      .plus(result.ch4Mass.div(1000).mul(gwpCH4))
      .plus(result.n2oMass.div(1000).mul(gwpN2O));

    result.factorsSnapshot = {
      emissionFactor: factor,
      fossilFraction: fractions.fossil,
      renewableFraction: fractions.renewable,
    };

    return result;
  }

  // Calculate energy content (GJ)
  const energyGJ = quantity.mul(factor.energyContent);

  // Calculate emissions (ton CO2/GJ * GJ = ton)
  const co2Tonnes = energyGJ.mul(factor.co2);
  const ch4Tonnes = energyGJ.mul(factor.ch4);
  const n2oTonnes = energyGJ.mul(factor.n2o);

  // Get fossil/renewable fractions
  const fractions = getFossilFraction(input.fuelType, input.year);

  // Apply fossil fraction for anthropogenic emissions
  result.co2Mass = co2Tonnes.mul(fractions.fossil).mul(1000); // Convert to kg
  result.ch4Mass = ch4Tonnes.mul(1000);
  result.n2oMass = n2oTonnes.mul(1000);

  // Biogenic emissions (in tonnes CO2)
  result.biogenicCo2 = co2Tonnes.mul(fractions.renewable);

  // Calculate CO2e
  const gwpCH4 = getGWP("CH4", gwpReference);
  const gwpN2O = getGWP("N2O", gwpReference);

  result.co2Equivalent = result.co2Mass
    .div(1000)
    .plus(result.ch4Mass.div(1000).mul(gwpCH4))
    .plus(result.n2oMass.div(1000).mul(gwpN2O));

  result.factorsSnapshot = {
    emissionFactor: factor,
    energyContent: factor.energyContent,
    fossilFraction: fractions.fossil,
    renewableFraction: fractions.renewable,
  };

  return result;
}

/**
 * Get all available fuel types for stationary combustion
 */
export function getStationaryFuelTypes(): string[] {
  return Object.keys(STATIONARY_COMBUSTION_FACTORS);
}

/**
 * Validate stationary combustion input
 */
export function validateStationaryInput(
  input: StationaryCombustionInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.fuelType) {
    errors.push("Tipo de combustível é obrigatório");
  } else if (!STATIONARY_COMBUSTION_FACTORS[input.fuelType]) {
    errors.push(`Tipo de combustível não reconhecido: ${input.fuelType}`);
  }

  if (!input.quantity || input.quantity.lte(0)) {
    errors.push("Quantidade deve ser maior que zero");
  }

  if (!input.unit) {
    errors.push("Unidade é obrigatória");
  }

  if (!input.year || input.year < 2000 || input.year > 2100) {
    errors.push("Ano inválido");
  }

  return { valid: errors.length === 0, errors };
}
