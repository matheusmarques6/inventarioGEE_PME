import Decimal from "decimal.js";
import type { FugitiveEmissionsInput, EmissionResult } from "../types";
import { createEmptyResult } from "../converters";
import {
  getGWP,
  isKyotoGas,
  REFRIGERANT_BLENDS,
  type GWPReference,
} from "../../constants/gwp";

/**
 * Calculate emissions from fugitive emissions (refrigerants)
 */
export function calculateFugitiveEmissions(
  input: FugitiveEmissionsInput,
  gwpReference: GWPReference = "AR5"
): EmissionResult {
  const result = createEmptyResult(1, "FUGITIVE_EMISSIONS", gwpReference);

  const gwp = getGWP(input.gasType, gwpReference);
  if (gwp === 0) {
    console.warn(`No GWP found for gas: ${input.gasType}`);
    return result;
  }

  // Quantity is already in kg
  const massKg = input.quantity;

  // Store in appropriate mass field based on gas type
  if (input.gasType.startsWith("HFC") || REFRIGERANT_BLENDS[input.gasType]) {
    result.hfcMass = massKg;
  } else if (input.gasType.startsWith("PFC")) {
    result.pfcMass = massKg;
  } else if (input.gasType === "SF6") {
    result.sf6Mass = massKg;
  } else if (input.gasType === "NF3") {
    result.nf3Mass = massKg;
  }

  // Calculate CO2e (kg * GWP / 1000 = tonnes)
  result.co2Equivalent = massKg.mul(gwp).div(1000);

  // Check if Kyoto gas
  result.isKyotoGas = isKyotoGas(input.gasType);

  result.factorsSnapshot = {
    gasType: input.gasType,
    gwp,
    gwpReference,
    massKg: massKg.toNumber(),
  };

  return result;
}

/**
 * Get GWP for a refrigerant blend
 */
export function getBlendGWP(
  blendName: string,
  gwpReference: GWPReference = "AR5"
): number {
  const blend = REFRIGERANT_BLENDS[blendName];
  if (!blend) {
    return getGWP(blendName, gwpReference);
  }

  let totalGWP = 0;
  for (const [component, fraction] of Object.entries(blend)) {
    const componentGWP = getGWP(component, gwpReference);
    totalGWP += componentGWP * fraction;
  }
  return Math.round(totalGWP);
}

/**
 * Get all available refrigerant types
 */
export function getRefrigerantTypes(): { name: string; gwpAR5: number }[] {
  const types: { name: string; gwpAR5: number }[] = [];

  // Add common HFCs
  const hfcs = [
    "HFC-23",
    "HFC-32",
    "HFC-125",
    "HFC-134a",
    "HFC-143a",
    "HFC-152a",
    "HFC-227ea",
    "HFC-245fa",
  ];

  for (const hfc of hfcs) {
    types.push({ name: hfc, gwpAR5: getGWP(hfc, "AR5") });
  }

  // Add blends
  for (const blendName of Object.keys(REFRIGERANT_BLENDS)) {
    types.push({ name: blendName, gwpAR5: getBlendGWP(blendName, "AR5") });
  }

  // Add other gases
  types.push({ name: "SF6", gwpAR5: getGWP("SF6", "AR5") });
  types.push({ name: "NF3", gwpAR5: getGWP("NF3", "AR5") });

  // Sort by name
  return types.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Validate fugitive emissions input
 */
export function validateFugitiveInput(
  input: FugitiveEmissionsInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.gasType) {
    errors.push("Tipo de gás é obrigatório");
  } else {
    const gwp = getGWP(input.gasType, "AR5");
    if (gwp === 0) {
      errors.push(`Tipo de gás não reconhecido: ${input.gasType}`);
    }
  }

  if (!input.quantity || input.quantity.lte(0)) {
    errors.push("Quantidade deve ser maior que zero");
  }

  if (!input.year || input.year < 2000 || input.year > 2100) {
    errors.push("Ano inválido");
  }

  return { valid: errors.length === 0, errors };
}
