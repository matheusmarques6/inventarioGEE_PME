// Re-export all calculators
export * from "./stationary";
export * from "./mobile";
export * from "./fugitive";
export * from "./electricity";
export * from "./forest";

// Additional calculator implementations

import Decimal from "decimal.js";
import type {
  FertilizerInput,
  FireInput,
  WasteInput,
  EffluentInput,
  AirTravelInput,
  MaritimeTransportInput,
  EmissionResult
} from "../types";
import { createEmptyResult } from "../converters";
import { calculateFertilizerEmissions as calcFertilizer } from "../../constants/fertilizer-factors";
import { calculateFireEmissions as calcFire, getCombustionFactor, getPlantedForestBiomass, NATIVE_BIOMASS } from "../../constants/fire-factors";
import { calculateLandfillEmissions, calculateIncinerationEmissions, calculateEffluentEmissions } from "../../constants/waste-factors";
import { calculateAirTravelEmissions as calcAirTravel, calculateMaritimeEmissions as calcMaritime } from "../../constants/transport-factors";
import { getGWP, type GWPReference } from "../../constants/gwp";

/**
 * Calculate emissions from fertilizer application
 */
export function calculateFertilizerEmissions(
  input: FertilizerInput,
  gwpReference: GWPReference = "AR5"
): EmissionResult {
  const result = createEmptyResult(1, "AGRICULTURAL", gwpReference);

  const gwpN2O = getGWP("N2O", gwpReference);

  const emissions = calcFertilizer(
    input.fertilizerType,
    input.quantity.toNumber(),
    input.fertilizerType.toLowerCase().includes("ureia"),
    input.limestoneQuantity?.toNumber() || 0,
    input.limestoneType,
    gwpN2O
  );

  result.n2oMass = new Decimal(emissions.n2oTotal * 1000); // Convert t to kg
  result.co2Mass = new Decimal((emissions.co2Urea + emissions.co2Limestone) * 1000);
  result.co2Equivalent = new Decimal(emissions.co2eTotal);

  result.factorsSnapshot = {
    fertilizerType: input.fertilizerType,
    quantity: input.quantity.toNumber(),
    emissions,
  };

  return result;
}

/**
 * Calculate emissions from forest fires
 */
export function calculateFireEmissionsResult(
  input: FireInput,
  gwpReference: GWPReference = "AR5"
): EmissionResult {
  const result = createEmptyResult(1, "LULUCF", gwpReference);

  const gwpCH4 = getGWP("CH4", gwpReference);
  const gwpN2O = getGWP("N2O", gwpReference);

  // Get biomass per hectare
  let biomassPerHa: number;
  if (input.forestType === "plantada" && input.species && input.age) {
    biomassPerHa = getPlantedForestBiomass(input.species, input.age);
  } else if (input.biome) {
    biomassPerHa = NATIVE_BIOMASS[input.biome] || 100;
  } else {
    biomassPerHa = 100; // Default
  }

  // Get combustion factor
  const combustionFactor = getCombustionFactor(input.forestType, input.severity);

  const emissions = calcFire(
    input.area.toNumber(),
    biomassPerHa,
    combustionFactor,
    gwpCH4,
    gwpN2O
  );

  result.co2Mass = new Decimal(emissions.co2 * 1000); // t to kg
  result.ch4Mass = new Decimal(emissions.ch4 * 1000);
  result.n2oMass = new Decimal(emissions.n2o * 1000);
  result.co2Equivalent = new Decimal(emissions.co2e);
  result.biogenicCo2 = new Decimal(emissions.co2); // Fire emissions are biogenic

  result.factorsSnapshot = {
    forestType: input.forestType,
    species: input.species,
    age: input.age,
    biome: input.biome,
    biomassPerHa,
    combustionFactor,
    severity: input.severity,
    emissions,
  };

  return result;
}

/**
 * Calculate emissions from waste treatment
 */
export function calculateWasteEmissions(
  input: WasteInput,
  gwpReference: GWPReference = "AR5"
): EmissionResult {
  const scope = input.treatmentType === "aterro" ? 3 : 1; // External landfill is Scope 3
  const category = scope === 1 ? "WASTE_INTERNAL" : "WASTE_EXTERNAL";
  const result = createEmptyResult(scope, category, gwpReference);

  const gwpCH4 = getGWP("CH4", gwpReference);
  const gwpN2O = getGWP("N2O", gwpReference);

  if (input.treatmentType === "aterro") {
    const emissions = calculateLandfillEmissions(
      input.wasteType,
      input.quantity.toNumber(),
      gwpCH4
    );
    result.ch4Mass = new Decimal(emissions.ch4 * 1000);
    result.co2Equivalent = new Decimal(emissions.co2e);
  } else if (input.treatmentType === "incineração") {
    const emissions = calculateIncinerationEmissions(
      input.wasteType,
      input.quantity.toNumber(),
      gwpCH4,
      gwpN2O
    );
    result.co2Mass = new Decimal(emissions.co2Fossil * 1000);
    result.ch4Mass = new Decimal(emissions.ch4 * 1000);
    result.n2oMass = new Decimal(emissions.n2o * 1000);
    result.co2Equivalent = new Decimal(emissions.co2e);
    result.biogenicCo2 = new Decimal(emissions.co2Bio);
  }

  result.factorsSnapshot = {
    wasteType: input.wasteType,
    treatmentType: input.treatmentType,
    quantity: input.quantity.toNumber(),
  };

  return result;
}

/**
 * Calculate emissions from effluent treatment
 */
export function calculateEffluentEmissionsResult(
  input: EffluentInput,
  gwpReference: GWPReference = "AR5"
): EmissionResult {
  const result = createEmptyResult(1, "WASTE_INTERNAL", gwpReference);

  const gwpCH4 = getGWP("CH4", gwpReference);

  const emissions = calculateEffluentEmissions(
    input.dboInput.toNumber(),
    input.dboOutput.toNumber(),
    input.treatmentType,
    gwpCH4
  );

  result.ch4Mass = new Decimal(emissions.ch4 * 1000);
  result.co2Equivalent = new Decimal(emissions.co2e);

  result.factorsSnapshot = {
    dboInput: input.dboInput.toNumber(),
    dboOutput: input.dboOutput.toNumber(),
    treatmentType: input.treatmentType,
  };

  return result;
}

/**
 * Calculate emissions from air travel
 */
export function calculateAirTravelEmissionsResult(
  input: AirTravelInput,
  gwpReference: GWPReference = "AR5"
): EmissionResult {
  const result = createEmptyResult(3, "BUSINESS_TRAVEL", gwpReference);

  const gwpCH4 = getGWP("CH4", gwpReference);
  const gwpN2O = getGWP("N2O", gwpReference);

  const distanceKm = input.distanceKm?.toNumber() || 1000; // Default if not provided

  const emissions = calcAirTravel(
    distanceKm,
    input.numberOfTrips,
    gwpCH4,
    gwpN2O
  );

  result.co2Mass = new Decimal(emissions.co2 * 1000);
  result.ch4Mass = new Decimal(emissions.ch4 * 1000);
  result.n2oMass = new Decimal(emissions.n2o * 1000);
  result.co2Equivalent = new Decimal(emissions.co2e);

  result.factorsSnapshot = {
    origin: input.origin,
    destination: input.destination,
    distanceKm,
    numberOfTrips: input.numberOfTrips,
  };

  return result;
}

/**
 * Calculate emissions from maritime transport
 */
export function calculateMaritimeEmissionsResult(
  input: MaritimeTransportInput,
  gwpReference: GWPReference = "AR5"
): EmissionResult {
  const result = createEmptyResult(3, "DOWNSTREAM_TRANSPORT", gwpReference);

  const gwpCH4 = getGWP("CH4", gwpReference);
  const gwpN2O = getGWP("N2O", gwpReference);

  const emissions = calcMaritime(
    input.distanceKm.toNumber(),
    input.cargoTonnes.toNumber(),
    input.vesselType,
    gwpCH4,
    gwpN2O
  );

  result.co2Mass = new Decimal(emissions.co2 * 1000);
  result.ch4Mass = new Decimal(emissions.ch4 * 1000);
  result.n2oMass = new Decimal(emissions.n2o * 1000);
  result.co2Equivalent = new Decimal(emissions.co2e);

  result.factorsSnapshot = {
    vesselType: input.vesselType,
    distanceKm: input.distanceKm.toNumber(),
    cargoTonnes: input.cargoTonnes.toNumber(),
  };

  return result;
}
