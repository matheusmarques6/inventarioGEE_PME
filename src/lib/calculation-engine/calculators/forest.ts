import Decimal from "decimal.js";
import type { ForestInput, EmissionResult } from "../types";
import { createEmptyResult } from "../converters";
import {
  FOREST_CONSTANTS,
  getWoodDensity,
  BIOMASS_BY_AGE,
} from "../../constants/forest-factors";
import type { GWPReference } from "../../constants/gwp";

/**
 * Calculate carbon stock in planted forest
 */
export function calculateForestCarbonStock(
  species: string,
  clone: string | undefined,
  age: number,
  area: Decimal, // hectares
  volume?: Decimal // m³ (optional, if available)
): {
  biomassAboveGround: Decimal; // t m.s.
  biomassTotal: Decimal; // t m.s.
  carbonStock: Decimal; // tC
  co2Stock: Decimal; // tCO2
} {
  const speciesKey = species.toLowerCase().includes("pinus")
    ? "pinus"
    : "eucalipto";

  // Get BEF
  const bef =
    FOREST_CONSTANTS.bef[speciesKey as keyof typeof FOREST_CONSTANTS.bef] ||
    FOREST_CONSTANTS.bef.default;

  // Get root ratio
  const rootRatio = FOREST_CONSTANTS.rootRatio.default;

  // Get carbon fraction
  const cf = FOREST_CONSTANTS.carbonFraction;

  // Get C to CO2 conversion
  const cToCO2 = FOREST_CONSTANTS.cToCO2;

  let biomassAboveGround: Decimal;

  if (volume && volume.gt(0)) {
    // Calculate from volume
    const cloneKey = clone || `DEFAULT_${speciesKey.toUpperCase()}`;
    const density = getWoodDensity(cloneKey, age);

    // Trunk biomass = Volume × Density
    const trunkBiomass = volume.mul(density);

    // Above ground biomass = Trunk × BEF
    biomassAboveGround = trunkBiomass.mul(bef);
  } else {
    // Use default biomass by age
    const biomassByAge = BIOMASS_BY_AGE[speciesKey];
    if (biomassByAge) {
      // Find closest age
      const ages = Object.keys(biomassByAge).map(Number);
      const closestAge = ages.reduce((prev, curr) =>
        Math.abs(curr - age) < Math.abs(prev - age) ? curr : prev
      );
      const biomassPerHa = biomassByAge[closestAge] || 100;
      biomassAboveGround = area.mul(biomassPerHa);
    } else {
      // Default estimate
      biomassAboveGround = area.mul(100);
    }
  }

  // Total biomass (above + below ground)
  const biomassTotal = biomassAboveGround.mul(1 + rootRatio);

  // Carbon stock
  const carbonStock = biomassTotal.mul(cf);

  // CO2 equivalent
  const co2Stock = carbonStock.mul(cToCO2);

  return {
    biomassAboveGround,
    biomassTotal,
    carbonStock,
    co2Stock,
  };
}

/**
 * Calculate forest removals (carbon sequestration)
 * Removals = Current year stock - Previous year stock
 */
export function calculateForestRemovals(
  input: ForestInput,
  gwpReference: GWPReference = "AR5"
): EmissionResult {
  const result = createEmptyResult(1, "LULUCF", gwpReference);

  // Calculate current year stock
  const currentStock = calculateForestCarbonStock(
    input.species,
    input.clone,
    input.age,
    input.area,
    input.volume
  );

  // If previous year stock is provided, calculate removals
  if (input.previousYearStock) {
    const removals = currentStock.co2Stock.minus(input.previousYearStock);

    // Negative removals = carbon sequestration
    result.removals = removals.neg();

    // If positive (stock decreased), it's an emission
    if (removals.gt(0)) {
      result.co2Mass = removals.mul(1000); // kg
      result.co2Equivalent = removals;
      result.biogenicCo2 = removals;
    }
  } else {
    // Calculate removals based on annual increment
    // Simplified: assume 5% annual increment for eucalyptus, 3% for pinus
    const speciesKey = input.species.toLowerCase().includes("pinus")
      ? "pinus"
      : "eucalipto";
    const incrementRate = speciesKey === "eucalipto" ? 0.05 : 0.03;

    // Previous stock estimated
    const previousStock = currentStock.co2Stock.div(1 + incrementRate);
    const removals = currentStock.co2Stock.minus(previousStock);

    result.removals = removals.neg(); // Negative = sequestration
  }

  result.factorsSnapshot = {
    species: input.species,
    clone: input.clone,
    age: input.age,
    area: input.area.toNumber(),
    volume: input.volume?.toNumber(),
    currentStock: currentStock,
    bef:
      FOREST_CONSTANTS.bef[
        input.species.toLowerCase().includes("pinus")
          ? "pinus"
          : ("eucalipto" as keyof typeof FOREST_CONSTANTS.bef)
      ],
    rootRatio: FOREST_CONSTANTS.rootRatio.default,
    carbonFraction: FOREST_CONSTANTS.carbonFraction,
  };

  return result;
}

/**
 * Validate forest input
 */
export function validateForestInput(
  input: ForestInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.species) {
    errors.push("Espécie é obrigatória");
  }

  if (input.age < 0 || input.age > 100) {
    errors.push("Idade deve estar entre 0 e 100 anos");
  }

  if (!input.area || input.area.lte(0)) {
    errors.push("Área deve ser maior que zero");
  }

  if (input.volume && input.volume.lt(0)) {
    errors.push("Volume não pode ser negativo");
  }

  if (!input.year || input.year < 2000 || input.year > 2100) {
    errors.push("Ano inválido");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get available forest species
 */
export function getForestSpecies(): string[] {
  return ["Eucalipto", "Pinus", "Acácia", "Teca"];
}

/**
 * Get available clones for a species
 */
export function getForestClones(species: string): string[] {
  if (species.toLowerCase().includes("eucal")) {
    return ["EUGR", "EURG", "EUUG", "EUSA", "EUDU"];
  }
  if (species.toLowerCase().includes("pinus")) {
    return ["PITA", "PCVH", "PIMX"];
  }
  return [];
}
