import Decimal from "decimal.js";
import type { GWPReference } from "../constants/gwp";

// Result types
export interface GasEmissions {
  co2: Decimal; // kg
  ch4: Decimal; // kg
  n2o: Decimal; // kg
  hfc?: Decimal; // kg
  pfc?: Decimal; // kg
  sf6?: Decimal; // kg
  nf3?: Decimal; // kg
}

export interface EmissionResult {
  // Mass emissions by gas (kg)
  co2Mass: Decimal;
  ch4Mass: Decimal;
  n2oMass: Decimal;
  hfcMass?: Decimal;
  pfcMass?: Decimal;
  sf6Mass?: Decimal;
  nf3Mass?: Decimal;

  // CO2e (tonnes)
  co2Equivalent: Decimal;

  // Biogenic emissions (tonnes CO2)
  biogenicCo2: Decimal;

  // Carbon removals (negative, tonnes CO2)
  removals: Decimal;

  // Scope and category
  scope: number;
  category: string;

  // Whether gas is under Kyoto Protocol
  isKyotoGas: boolean;

  // Uncertainty (fraction, e.g., 0.05 = 5%)
  uncertainty?: Decimal;

  // Metadata
  calculatedAt: Date;
  gwpReference: GWPReference;
  factorsSnapshot?: Record<string, unknown>;
}

// Input data types
export interface StationaryCombustionInput {
  fuelType: string;
  quantity: Decimal; // in unit specified
  unit: string; // m³, L, kg, t, GJ
  year: number;
  month?: number;
  equipmentType?: string;
}

export interface MobileCombustionInput {
  fuelType: string;
  quantity: Decimal; // consumption or distance
  unit: string; // L, km
  vehicleType?: string;
  year: number;
}

export interface FugitiveEmissionsInput {
  gasType: string;
  quantity: Decimal; // kg of gas leaked/released
  year: number;
}

export interface ElectricityInput {
  consumption: Decimal; // kWh
  year: number;
  month?: number;
}

export interface FertilizerInput {
  fertilizerType: string;
  quantity: Decimal; // kg
  limestoneQuantity?: Decimal; // kg
  limestoneType?: "calcítico" | "dolomítico";
  year: number;
}

export interface ForestInput {
  species: string;
  clone?: string;
  age: number;
  area: Decimal; // hectares
  volume?: Decimal; // m³
  year: number;
  previousYearStock?: Decimal; // tCO2
}

export interface FireInput {
  forestType: "plantada" | "nativa";
  species?: string;
  age?: number;
  biome?: string;
  area: Decimal; // hectares
  severity: "rasteiro" | "copa";
  year: number;
}

export interface WasteInput {
  wasteType: string;
  quantity: Decimal; // kg
  treatmentType: "aterro" | "incineração" | "compostagem" | "biodigestão";
  year: number;
}

export interface EffluentInput {
  dboInput: Decimal; // kg DBO
  dboOutput: Decimal; // kg DBO
  treatmentType: string;
  year: number;
}

export interface AirTravelInput {
  origin: string;
  destination: string;
  distanceKm?: Decimal;
  numberOfTrips: number;
  year: number;
}

export interface MaritimeTransportInput {
  vesselType: string;
  distanceKm: Decimal;
  cargoTonnes: Decimal;
  year: number;
}

// Calculation context
export interface CalculationContext {
  gwpReference: GWPReference;
  year: number;
  organizationId: string;
  inventoryId: string;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
