// Emission factors for fertilizers and limestone
// Sources: IPCC 2006, IPCC 2019 Refinement

import { GWP } from "./gwp";

// Fertilizer emission factors (IPCC 2019, V.4, Ch.11)
export const FERTILIZER_FACTORS = {
  // Direct emissions from fertilizer application
  directEmissionFactor: 0.01, // kg N2O-N / kg N applied

  // Indirect emissions from volatilization
  volatilizationEmissionFactor: 0.01, // kg N2O-N / kg N volatilized
  volatilizationFraction: 0.11, // fraction of N volatilized

  // Indirect emissions from leaching/runoff
  leachingEmissionFactor: 0.011, // kg N2O-N / kg N leached
  leachingFraction: 0.24, // fraction of N leached

  // Molecular weight ratios
  n2oToN2Ratio: 44 / 28, // N2O / N2

  // Urea emission factor
  ureaEmissionFactorC: 0.2, // kg C / kg urea applied
  co2ToCRatio: 44 / 12, // CO2 / C
} as const;

// Limestone (calcário) emission factors
export const LIMESTONE_FACTORS = {
  // CO2 emission factors for limestone
  calciteEmissionFactorC: 0.12, // kg C / kg CaCO3 applied (calcário calcítico)
  dolomiteEmissionFactorC: 0.13, // kg C / kg CaCO3 applied (calcário dolomítico)
  co2ToCRatio: 44 / 12, // CO2 / C

  // CaCO3 equivalence factors (Alcarde & Rodella, 1996)
  caoEquivalence: 1.79, // CaO to CaCO3
  mgoEquivalence: 2.48, // MgO to CaCO3
} as const;

export interface FertilizerInput {
  fertilizerType: string;
  nitrogenContent: number; // % (0-1)
  isUrea: boolean;
  quantity: number; // kg
}

export interface LimestoneInput {
  type: "calcitic" | "dolomitic";
  caoContent: number; // % (0-1)
  mgoContent: number; // % (0-1)
  quantity: number; // kg
}

export interface FertilizerEmissionResult {
  // Emissions in kg
  co2Kg: number;
  n2oKg: number;
  // Emissions in tCO2e
  co2Tons: number;
  n2oTons: number;
  totalTCO2e: number;
  // Details
  nitrogenApplied: number; // kg N
  details: {
    directN2O: number;
    indirectN2OVolatilization: number;
    indirectN2OLeaching: number;
    ureaCO2?: number;
  };
}

export interface LimestoneEmissionResult {
  // Emissions in kg
  co2Kg: number;
  // Emissions in tCO2e
  totalTCO2e: number;
  // Details
  caco3Equivalent: number; // kg CaCO3
}

/**
 * Calculate N2O emissions from nitrogen fertilizer application
 * Following IPCC 2019, V.4, Ch.11 methodology
 */
export function calculateFertilizerEmissions(input: FertilizerInput): FertilizerEmissionResult {
  const { nitrogenContent, isUrea, quantity } = input;

  // Calculate nitrogen applied (kg N)
  const nitrogenApplied = quantity * nitrogenContent;

  // Direct N2O emissions
  const directN2ON = nitrogenApplied * FERTILIZER_FACTORS.directEmissionFactor;
  const directN2O = directN2ON * FERTILIZER_FACTORS.n2oToN2Ratio;

  // Indirect N2O from volatilization
  const volatilizedN = nitrogenApplied * FERTILIZER_FACTORS.volatilizationFraction;
  const indirectN2OVolN = volatilizedN * FERTILIZER_FACTORS.volatilizationEmissionFactor;
  const indirectN2OVol = indirectN2OVolN * FERTILIZER_FACTORS.n2oToN2Ratio;

  // Indirect N2O from leaching
  const leachedN = nitrogenApplied * FERTILIZER_FACTORS.leachingFraction;
  const indirectN2OLeachN = leachedN * FERTILIZER_FACTORS.leachingEmissionFactor;
  const indirectN2OLeach = indirectN2OLeachN * FERTILIZER_FACTORS.n2oToN2Ratio;

  // Total N2O (kg)
  const n2oKg = directN2O + indirectN2OVol + indirectN2OLeach;

  // CO2 from urea (if applicable)
  let ureaCO2 = 0;
  if (isUrea) {
    const carbonFromUrea = quantity * FERTILIZER_FACTORS.ureaEmissionFactorC;
    ureaCO2 = carbonFromUrea * FERTILIZER_FACTORS.co2ToCRatio;
  }

  // Convert to tons
  const co2Tons = ureaCO2 / 1000;
  const n2oTons = n2oKg / 1000;

  // Calculate tCO2e
  const totalTCO2e = co2Tons * GWP.CO2 + n2oTons * GWP.N2O;

  return {
    co2Kg: ureaCO2,
    n2oKg,
    co2Tons,
    n2oTons,
    totalTCO2e,
    nitrogenApplied,
    details: {
      directN2O,
      indirectN2OVolatilization: indirectN2OVol,
      indirectN2OLeaching: indirectN2OLeach,
      ureaCO2: isUrea ? ureaCO2 : undefined,
    },
  };
}

/**
 * Calculate CO2 emissions from limestone (calcário) application
 * Following IPCC 2006, V.4, Ch.11 methodology
 */
export function calculateLimestoneEmissions(input: LimestoneInput): LimestoneEmissionResult {
  const { type, caoContent, mgoContent, quantity } = input;

  // Calculate CaCO3 equivalent (kg)
  // %E CaCO3 = % CaO × 1.79 + % MgO × 2.48
  const caco3Equivalent = quantity * (
    caoContent * LIMESTONE_FACTORS.caoEquivalence +
    mgoContent * LIMESTONE_FACTORS.mgoEquivalence
  );

  // Calculate CO2 emissions based on limestone type
  const emissionFactorC = type === "calcitic"
    ? LIMESTONE_FACTORS.calciteEmissionFactorC
    : LIMESTONE_FACTORS.dolomiteEmissionFactorC;

  const carbonEmitted = caco3Equivalent * emissionFactorC;
  const co2Kg = carbonEmitted * LIMESTONE_FACTORS.co2ToCRatio;

  // Convert to tCO2e
  const totalTCO2e = co2Kg / 1000;

  return {
    co2Kg,
    totalTCO2e,
    caco3Equivalent,
  };
}

// Combined calculation factor for nitrogen fertilizers
// = EF_direct × (44/28) + EF_vol × frac_vol × (44/28) + EF_leach × frac_leach × (44/28)
export const COMBINED_N2O_FACTOR =
  FERTILIZER_FACTORS.directEmissionFactor * FERTILIZER_FACTORS.n2oToN2Ratio +
  FERTILIZER_FACTORS.volatilizationEmissionFactor * FERTILIZER_FACTORS.volatilizationFraction * FERTILIZER_FACTORS.n2oToN2Ratio +
  FERTILIZER_FACTORS.leachingEmissionFactor * FERTILIZER_FACTORS.leachingFraction * FERTILIZER_FACTORS.n2oToN2Ratio;
// ≈ 0.021591 kg N2O / kg N applied
