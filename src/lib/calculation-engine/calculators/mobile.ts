import Decimal from "decimal.js";
import type { MobileCombustionInput, EmissionResult } from "../types";
import { createEmptyResult } from "../converters";
import {
  MOBILE_COMBUSTION_FACTORS,
  VEHICLE_EFFICIENCY,
} from "../../constants/emission-factors";
import { getFossilFraction } from "../../constants/biofuel-blends";
import { getGWP, type GWPReference } from "../../constants/gwp";

/**
 * Calculate emissions from mobile combustion (vehicles)
 */
export function calculateMobileCombustion(
  input: MobileCombustionInput,
  gwpReference: GWPReference = "AR5"
): EmissionResult {
  const result = createEmptyResult(1, "MOBILE_COMBUSTION", gwpReference);

  const factor = MOBILE_COMBUSTION_FACTORS[input.fuelType];
  if (!factor) {
    console.warn(`No emission factor found for fuel: ${input.fuelType}`);
    return result;
  }

  // Calculate fuel consumption
  let consumptionM3: Decimal;

  if (
    input.unit.toLowerCase() === "km" &&
    input.vehicleType &&
    VEHICLE_EFFICIENCY[input.vehicleType]
  ) {
    // Calculate from distance using vehicle efficiency
    const efficiency = VEHICLE_EFFICIENCY[input.vehicleType]; // km/L
    const consumptionLiters = input.quantity.div(efficiency);
    consumptionM3 = consumptionLiters.div(1000);
  } else if (
    input.unit.toLowerCase() === "l" ||
    input.unit.toLowerCase() === "litro"
  ) {
    consumptionM3 = input.quantity.div(1000);
  } else if (input.unit.toLowerCase() === "m³" || input.unit.toLowerCase() === "m3") {
    consumptionM3 = input.quantity;
  } else {
    // Default to liters
    consumptionM3 = input.quantity.div(1000);
  }

  // Calculate energy content (GJ)
  const energyGJ = consumptionM3.mul(factor.energyContent);

  // Calculate emissions (ton/GJ * GJ = ton)
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
    vehicleType: input.vehicleType,
    vehicleEfficiency: input.vehicleType
      ? VEHICLE_EFFICIENCY[input.vehicleType]
      : null,
  };

  return result;
}

/**
 * Get all available fuel types for mobile combustion
 */
export function getMobileFuelTypes(): string[] {
  return Object.keys(MOBILE_COMBUSTION_FACTORS);
}

/**
 * Get all available vehicle types
 */
export function getVehicleTypes(): string[] {
  return Object.keys(VEHICLE_EFFICIENCY);
}

/**
 * Validate mobile combustion input
 */
export function validateMobileInput(
  input: MobileCombustionInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.fuelType) {
    errors.push("Tipo de combustível é obrigatório");
  } else if (!MOBILE_COMBUSTION_FACTORS[input.fuelType]) {
    errors.push(`Tipo de combustível não reconhecido: ${input.fuelType}`);
  }

  if (!input.quantity || input.quantity.lte(0)) {
    errors.push("Quantidade deve ser maior que zero");
  }

  if (!input.unit) {
    errors.push("Unidade é obrigatória");
  }

  // If unit is km, vehicle type is required
  if (input.unit.toLowerCase() === "km" && !input.vehicleType) {
    errors.push("Tipo de veículo é obrigatório quando a unidade é km");
  }

  if (
    input.vehicleType &&
    input.unit.toLowerCase() === "km" &&
    !VEHICLE_EFFICIENCY[input.vehicleType]
  ) {
    errors.push(`Tipo de veículo não reconhecido: ${input.vehicleType}`);
  }

  if (!input.year || input.year < 2000 || input.year > 2100) {
    errors.push("Ano inválido");
  }

  return { valid: errors.length === 0, errors };
}
