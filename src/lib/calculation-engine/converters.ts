import Decimal from "decimal.js";
import { getGWP, type GWPReference } from "../constants/gwp";
import type { GasEmissions, EmissionResult } from "./types";

// Configure Decimal.js for high precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Convert gas emissions to CO2 equivalent
 */
export function convertToCO2e(
  emissions: GasEmissions,
  gwpReference: GWPReference = "AR5"
): Decimal {
  const gwpCO2 = new Decimal(getGWP("CO2", gwpReference));
  const gwpCH4 = new Decimal(getGWP("CH4", gwpReference));
  const gwpN2O = new Decimal(getGWP("N2O", gwpReference));

  // Convert kg to tonnes and apply GWP
  const co2e = emissions.co2
    .div(1000)
    .mul(gwpCO2)
    .plus(emissions.ch4.div(1000).mul(gwpCH4))
    .plus(emissions.n2o.div(1000).mul(gwpN2O));

  // Add HFCs, PFCs, SF6, NF3 if present
  if (emissions.hfc) {
    co2e.plus(emissions.hfc.div(1000));
  }
  if (emissions.pfc) {
    co2e.plus(emissions.pfc.div(1000));
  }
  if (emissions.sf6) {
    const gwpSF6 = new Decimal(getGWP("SF6", gwpReference));
    co2e.plus(emissions.sf6.div(1000).mul(gwpSF6));
  }
  if (emissions.nf3) {
    const gwpNF3 = new Decimal(getGWP("NF3", gwpReference));
    co2e.plus(emissions.nf3.div(1000).mul(gwpNF3));
  }

  return co2e;
}

/**
 * Convert volume to mass using density
 */
export function volumeToMass(
  volume: Decimal,
  density: number, // kg/L or kg/m³
  volumeUnit: string
): Decimal {
  // Normalize to liters or m³
  let volumeInStandardUnit = volume;

  switch (volumeUnit.toLowerCase()) {
    case "ml":
      volumeInStandardUnit = volume.div(1000);
      break;
    case "l":
    case "litro":
    case "litros":
      volumeInStandardUnit = volume;
      break;
    case "m³":
    case "m3":
      volumeInStandardUnit = volume.mul(1000);
      break;
    case "gal":
    case "galão":
      volumeInStandardUnit = volume.mul(3.78541);
      break;
  }

  return volumeInStandardUnit.mul(density);
}

/**
 * Convert mass to energy content
 */
export function massToEnergy(
  mass: Decimal, // kg
  energyContent: number // GJ/kg or GJ/m³
): Decimal {
  return mass.mul(energyContent);
}

/**
 * Convert energy units
 */
export function convertEnergy(
  value: Decimal,
  fromUnit: string,
  toUnit: string = "GJ"
): Decimal {
  // Conversion factors to GJ
  const toGJ: Record<string, number> = {
    J: 1e-9,
    kJ: 1e-6,
    MJ: 1e-3,
    GJ: 1,
    TJ: 1000,
    kWh: 0.0036,
    MWh: 3.6,
    kcal: 4.184e-6,
    toe: 41.868,
    btu: 1.0551e-6,
  };

  const fromFactor = toGJ[fromUnit] || 1;
  const toFactor = toGJ[toUnit] || 1;

  return value.mul(fromFactor).div(toFactor);
}

/**
 * Convert distance units
 */
export function convertDistance(
  value: Decimal,
  fromUnit: string,
  toUnit: string = "km"
): Decimal {
  const toKm: Record<string, number> = {
    m: 0.001,
    km: 1,
    mi: 1.60934,
    nm: 1.852, // nautical miles
  };

  const fromFactor = toKm[fromUnit] || 1;
  const toFactor = toKm[toUnit] || 1;

  return value.mul(fromFactor).div(toFactor);
}

/**
 * Convert mass units
 */
export function convertMass(
  value: Decimal,
  fromUnit: string,
  toUnit: string = "kg"
): Decimal {
  const toKg: Record<string, number> = {
    g: 0.001,
    kg: 1,
    t: 1000,
    ton: 1000,
    lb: 0.453592,
    oz: 0.0283495,
  };

  const fromFactor = toKg[fromUnit.toLowerCase()] || 1;
  const toFactor = toKg[toUnit.toLowerCase()] || 1;

  return value.mul(fromFactor).div(toFactor);
}

/**
 * Convert area units
 */
export function convertArea(
  value: Decimal,
  fromUnit: string,
  toUnit: string = "ha"
): Decimal {
  const toHa: Record<string, number> = {
    m2: 0.0001,
    "m\u00B2": 0.0001,
    ha: 1,
    km2: 100,
    "km\u00B2": 100,
    acre: 0.404686,
    alq: 2.42, // alqueire paulista
  };

  const fromFactor = toHa[fromUnit] || 1;
  const toFactor = toHa[toUnit] || 1;

  return value.mul(fromFactor).div(toFactor);
}

/**
 * Create an empty emission result
 */
export function createEmptyResult(
  scope: number,
  category: string,
  gwpReference: GWPReference = "AR5"
): EmissionResult {
  return {
    co2Mass: new Decimal(0),
    ch4Mass: new Decimal(0),
    n2oMass: new Decimal(0),
    co2Equivalent: new Decimal(0),
    biogenicCo2: new Decimal(0),
    removals: new Decimal(0),
    scope,
    category,
    isKyotoGas: true,
    calculatedAt: new Date(),
    gwpReference,
  };
}

/**
 * Sum multiple emission results
 */
export function sumEmissionResults(
  results: EmissionResult[]
): Omit<EmissionResult, "scope" | "category" | "isKyotoGas" | "gwpReference"> {
  return results.reduce(
    (acc, result) => ({
      co2Mass: acc.co2Mass.plus(result.co2Mass),
      ch4Mass: acc.ch4Mass.plus(result.ch4Mass),
      n2oMass: acc.n2oMass.plus(result.n2oMass),
      hfcMass: acc.hfcMass?.plus(result.hfcMass || 0),
      pfcMass: acc.pfcMass?.plus(result.pfcMass || 0),
      sf6Mass: acc.sf6Mass?.plus(result.sf6Mass || 0),
      nf3Mass: acc.nf3Mass?.plus(result.nf3Mass || 0),
      co2Equivalent: acc.co2Equivalent.plus(result.co2Equivalent),
      biogenicCo2: acc.biogenicCo2.plus(result.biogenicCo2),
      removals: acc.removals.plus(result.removals),
      calculatedAt: new Date(),
    }),
    {
      co2Mass: new Decimal(0),
      ch4Mass: new Decimal(0),
      n2oMass: new Decimal(0),
      hfcMass: new Decimal(0),
      pfcMass: new Decimal(0),
      sf6Mass: new Decimal(0),
      nf3Mass: new Decimal(0),
      co2Equivalent: new Decimal(0),
      biogenicCo2: new Decimal(0),
      removals: new Decimal(0),
      calculatedAt: new Date(),
    }
  );
}
