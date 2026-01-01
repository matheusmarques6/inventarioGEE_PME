// Scope 1 Emissions Calculator
// Implements GHG Protocol methodology for direct emissions

import { GWP, getRefrigerantGWP, isKyotoGas } from "../emission-factors/gwp";
import { getFuel, FuelEmissionFactor, STATIONARY_FUELS, MOBILE_FUELS_ROAD } from "../emission-factors/fuels";
import {
  calculateFertilizerEmissions,
  calculateLimestoneEmissions,
  FertilizerInput,
  LimestoneInput,
} from "../emission-factors/fertilizers";

// =============================================================================
// TYPES
// =============================================================================

export interface CombustionInput {
  fuelName: string;
  quantity: number;
  unit: "litros" | "m3" | "kg" | "ton";
  ethanolPercentage?: number; // % ethanol in gasoline (0-1)
  biodieselPercentage?: number; // % biodiesel in diesel (0-1)
}

export interface CombustionResult {
  // Energy
  consumptionM3: number;
  energyGJ: number;
  // Emissions in kg
  co2Kg: number;
  co2BiogenicKg: number;
  ch4Kg: number;
  n2oKg: number;
  // Emissions in tCO2e
  totalTCO2e: number;
  biogenicTCO2e: number;
  // Fuel info
  fuelType: "fossil" | "renewable";
  fuelName: string;
}

export interface FugitiveInput {
  gasName: string;
  quantity: number; // kg
}

export interface FugitiveResult {
  // Emissions
  totalTCO2e: number;
  kyotoTCO2e: number;
  nonKyotoTCO2e: number;
  // Gas info
  gasName: string;
  gwp: number;
  isKyoto: boolean;
  family: string;
}

export interface Scope1Summary {
  stationary: {
    totalTCO2e: number;
    biogenicTCO2e: number;
  };
  mobile: {
    totalTCO2e: number;
    biogenicTCO2e: number;
  };
  fugitive: {
    totalTCO2e: number;
    kyotoTCO2e: number;
    nonKyotoTCO2e: number;
  };
  fertilizer: {
    totalTCO2e: number;
  };
  total: {
    totalTCO2e: number;
    biogenicTCO2e: number;
  };
}

// =============================================================================
// UNIT CONVERSION
// =============================================================================

/**
 * Convert fuel quantity to cubic meters (m³)
 */
export function convertToM3(
  quantity: number,
  unit: "litros" | "m3" | "kg" | "ton",
  density?: number // kg/m³
): number {
  switch (unit) {
    case "litros":
      return quantity / 1000;
    case "m3":
      return quantity;
    case "kg":
      if (!density) throw new Error("Density required for kg conversion");
      return quantity / density;
    case "ton":
      if (!density) throw new Error("Density required for ton conversion");
      return (quantity * 1000) / density;
    default:
      throw new Error(`Unknown unit: ${unit}`);
  }
}

/**
 * Convert fuel quantity to energy (GJ)
 */
export function convertToGJ(
  quantity: number,
  unit: "litros" | "m3" | "kg" | "ton",
  fuel: FuelEmissionFactor
): number {
  if (fuel.energyUnit === "GJ/m3") {
    const m3 = convertToM3(quantity, unit, fuel.density);
    return m3 * fuel.energyContent;
  } else if (fuel.energyUnit === "GJ/ton") {
    let tons: number;
    switch (unit) {
      case "ton":
        tons = quantity;
        break;
      case "kg":
        tons = quantity / 1000;
        break;
      case "litros":
        if (!fuel.density) throw new Error("Density required for liters conversion");
        tons = (quantity / 1000) * (fuel.density / 1000);
        break;
      case "m3":
        if (!fuel.density) throw new Error("Density required for m³ conversion");
        tons = quantity * fuel.density / 1000;
        break;
      default:
        throw new Error(`Unknown unit: ${unit}`);
    }
    return tons * fuel.energyContent;
  } else if (fuel.energyUnit === "GJ/kg") {
    let kg: number;
    switch (unit) {
      case "kg":
        kg = quantity;
        break;
      case "ton":
        kg = quantity * 1000;
        break;
      case "litros":
        if (!fuel.density) throw new Error("Density required for liters conversion");
        kg = (quantity / 1000) * fuel.density;
        break;
      case "m3":
        if (!fuel.density) throw new Error("Density required for m³ conversion");
        kg = quantity * fuel.density;
        break;
      default:
        throw new Error(`Unknown unit: ${unit}`);
    }
    return kg * fuel.energyContent;
  }

  throw new Error(`Unknown energy unit: ${fuel.energyUnit}`);
}

// =============================================================================
// STATIONARY COMBUSTION
// =============================================================================

/**
 * Calculate emissions from stationary combustion
 * Follows GHG Protocol / IPCC methodology
 */
export function calculateStationaryCombustion(input: CombustionInput): CombustionResult {
  const { fuelName, quantity, unit, ethanolPercentage = 0.27, biodieselPercentage = 0.14 } = input;

  const fuel = getFuel(fuelName, "stationary");
  if (!fuel) {
    throw new Error(`Fuel not found: ${fuelName}`);
  }

  // Convert to m³ for reference
  const consumptionM3 = convertToM3(quantity, unit, fuel.density);

  // Calculate energy content (GJ)
  const energyGJ = convertToGJ(quantity, unit, fuel);

  // For diesel with biodiesel blend
  let effectiveFossilFraction = 1;
  let effectiveBioFraction = 0;

  if (fuelName.toLowerCase().includes("diesel") && fuel.type === "fossil") {
    effectiveFossilFraction = 1 - biodieselPercentage;
    effectiveBioFraction = biodieselPercentage;
  }

  // For gasoline with ethanol blend
  if (fuelName.toLowerCase().includes("gasolina") && fuel.type === "fossil") {
    effectiveFossilFraction = 1 - ethanolPercentage;
    effectiveBioFraction = ethanolPercentage;
  }

  // Calculate emissions (in kg)
  // Fossil CO2
  const co2Kg = energyGJ * fuel.co2 * 1000 * effectiveFossilFraction;
  // Biogenic CO2 (from biofuel fraction)
  const co2BiogenicKg = energyGJ * fuel.co2 * 1000 * effectiveBioFraction;
  // CH4 and N2O (same for both fractions)
  const ch4Kg = energyGJ * fuel.ch4 * 1000;
  const n2oKg = energyGJ * fuel.n2o * 1000;

  // If fuel is renewable, all CO2 is biogenic
  let finalCO2 = co2Kg;
  let finalBiogenic = co2BiogenicKg;
  if (fuel.type === "renewable") {
    finalCO2 = 0;
    finalBiogenic = energyGJ * fuel.co2 * 1000;
  }

  // Calculate total CO2e (tons)
  const totalTCO2e =
    finalCO2 / 1000 * GWP.CO2 +
    ch4Kg / 1000 * GWP.CH4 +
    n2oKg / 1000 * GWP.N2O;

  const biogenicTCO2e = finalBiogenic / 1000;

  return {
    consumptionM3,
    energyGJ,
    co2Kg: finalCO2,
    co2BiogenicKg: finalBiogenic,
    ch4Kg,
    n2oKg,
    totalTCO2e,
    biogenicTCO2e,
    fuelType: fuel.type,
    fuelName: fuel.name,
  };
}

// =============================================================================
// MOBILE COMBUSTION
// =============================================================================

/**
 * Calculate emissions from mobile combustion (vehicles, machinery)
 */
export function calculateMobileCombustion(
  input: CombustionInput,
  vehicleType: "road" | "offroad" = "road"
): CombustionResult {
  const { fuelName, quantity, unit, ethanolPercentage = 0.27, biodieselPercentage = 0.14 } = input;

  const combustionType = vehicleType === "road" ? "mobile-road" : "mobile-offroad";
  const fuel = getFuel(fuelName, combustionType);

  if (!fuel) {
    // Fallback to stationary factors if not found in mobile
    return calculateStationaryCombustion(input);
  }

  // Convert to m³ for reference
  const consumptionM3 = convertToM3(quantity, unit, fuel.density);

  // Calculate energy content (GJ)
  const energyGJ = convertToGJ(quantity, unit, fuel);

  // Biofuel blend adjustment
  let effectiveFossilFraction = 1;
  let effectiveBioFraction = 0;

  if (fuelName.toLowerCase().includes("diesel") && fuel.type === "fossil") {
    effectiveFossilFraction = 1 - biodieselPercentage;
    effectiveBioFraction = biodieselPercentage;
  }

  if (fuelName.toLowerCase().includes("gasolina") && fuel.type === "fossil") {
    effectiveFossilFraction = 1 - ethanolPercentage;
    effectiveBioFraction = ethanolPercentage;
  }

  // Calculate emissions (in kg)
  const co2Kg = energyGJ * fuel.co2 * 1000 * effectiveFossilFraction;
  const co2BiogenicKg = energyGJ * fuel.co2 * 1000 * effectiveBioFraction;
  const ch4Kg = energyGJ * fuel.ch4 * 1000;
  const n2oKg = energyGJ * fuel.n2o * 1000;

  let finalCO2 = co2Kg;
  let finalBiogenic = co2BiogenicKg;
  if (fuel.type === "renewable") {
    finalCO2 = 0;
    finalBiogenic = energyGJ * fuel.co2 * 1000;
  }

  // Calculate total CO2e (tons)
  const totalTCO2e =
    finalCO2 / 1000 * GWP.CO2 +
    ch4Kg / 1000 * GWP.CH4 +
    n2oKg / 1000 * GWP.N2O;

  const biogenicTCO2e = finalBiogenic / 1000;

  return {
    consumptionM3,
    energyGJ,
    co2Kg: finalCO2,
    co2BiogenicKg: finalBiogenic,
    ch4Kg,
    n2oKg,
    totalTCO2e,
    biogenicTCO2e,
    fuelType: fuel.type,
    fuelName: fuel.name,
  };
}

// =============================================================================
// FUGITIVE EMISSIONS
// =============================================================================

/**
 * Calculate fugitive emissions from refrigerant gases
 */
export function calculateFugitiveEmissions(input: FugitiveInput): FugitiveResult {
  const { gasName, quantity } = input;

  const gwp = getRefrigerantGWP(gasName);
  const isKyoto = isKyotoGas(gasName);

  if (gwp === 0) {
    throw new Error(`Unknown refrigerant gas: ${gasName}`);
  }

  // Emissions = quantity (kg) × GWP / 1000 (to tCO2e)
  const totalTCO2e = (quantity * gwp) / 1000;

  // Separate Kyoto and non-Kyoto emissions
  const kyotoTCO2e = isKyoto ? totalTCO2e : 0;
  const nonKyotoTCO2e = isKyoto ? 0 : totalTCO2e;

  // Get gas family for reporting
  const gasInfo = { family: "Unknown" };
  // This would come from the GWP_REFRIGERANTS lookup

  return {
    totalTCO2e,
    kyotoTCO2e,
    nonKyotoTCO2e,
    gasName,
    gwp,
    isKyoto,
    family: gasInfo.family,
  };
}

// =============================================================================
// SCOPE 1 SUMMARY
// =============================================================================

/**
 * Calculate complete Scope 1 summary from all emission sources
 */
export function calculateScope1Summary(
  stationaryResults: CombustionResult[],
  mobileResults: CombustionResult[],
  fugitiveResults: FugitiveResult[],
  fertilizerResults: { totalTCO2e: number }[]
): Scope1Summary {
  // Stationary combustion totals
  const stationaryTotal = stationaryResults.reduce((acc, r) => acc + r.totalTCO2e, 0);
  const stationaryBiogenic = stationaryResults.reduce((acc, r) => acc + r.biogenicTCO2e, 0);

  // Mobile combustion totals
  const mobileTotal = mobileResults.reduce((acc, r) => acc + r.totalTCO2e, 0);
  const mobileBiogenic = mobileResults.reduce((acc, r) => acc + r.biogenicTCO2e, 0);

  // Fugitive emissions totals
  const fugitiveTotal = fugitiveResults.reduce((acc, r) => acc + r.totalTCO2e, 0);
  const fugitiveKyoto = fugitiveResults.reduce((acc, r) => acc + r.kyotoTCO2e, 0);
  const fugitiveNonKyoto = fugitiveResults.reduce((acc, r) => acc + r.nonKyotoTCO2e, 0);

  // Fertilizer totals
  const fertilizerTotal = fertilizerResults.reduce((acc, r) => acc + r.totalTCO2e, 0);

  // Grand totals
  const totalTCO2e = stationaryTotal + mobileTotal + fugitiveTotal + fertilizerTotal;
  const biogenicTCO2e = stationaryBiogenic + mobileBiogenic;

  return {
    stationary: {
      totalTCO2e: stationaryTotal,
      biogenicTCO2e: stationaryBiogenic,
    },
    mobile: {
      totalTCO2e: mobileTotal,
      biogenicTCO2e: mobileBiogenic,
    },
    fugitive: {
      totalTCO2e: fugitiveTotal,
      kyotoTCO2e: fugitiveKyoto,
      nonKyotoTCO2e: fugitiveNonKyoto,
    },
    fertilizer: {
      totalTCO2e: fertilizerTotal,
    },
    total: {
      totalTCO2e,
      biogenicTCO2e,
    },
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get list of available fuels for UI dropdown
 */
export function getAvailableFuelsForUI(): { value: string; label: string; type: string }[] {
  return Object.values(STATIONARY_FUELS).map((fuel) => ({
    value: fuel.name,
    label: fuel.name,
    type: fuel.type === "renewable" ? "Renovável" : "Fóssil",
  }));
}

/**
 * Get list of available refrigerant gases for UI dropdown
 */
export function getAvailableRefrigerantsForUI(): { value: string; label: string; gwp: number; family: string }[] {
  const { GWP_REFRIGERANTS } = require("../emission-factors/gwp");
  return Object.entries(GWP_REFRIGERANTS).map(([name, info]: [string, { gwp: number; family: string }]) => ({
    value: name,
    label: name,
    gwp: info.gwp,
    family: info.family,
  }));
}
