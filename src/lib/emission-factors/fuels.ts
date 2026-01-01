// Emission factors for fuels - Stationary and Mobile Combustion
// Sources: IPCC 2006, BEN 2022, GHG Protocol Brazil

export interface FuelEmissionFactor {
  name: string;
  nameEn: string;
  ipccName: string;
  type: "fossil" | "renewable";
  // Energy content in GJ/m³ (or GJ/ton for solids)
  energyContent: number;
  energyUnit: "GJ/m3" | "GJ/ton" | "GJ/kg";
  // Emission factors in ton/GJ
  co2: number;       // ton CO2/GJ
  ch4: number;       // ton CH4/GJ
  n2o: number;       // ton N2O/GJ
  // Density in kg/m³ (for liquids) or kg/m³ (for gases)
  density?: number;
  // Default unit for input
  defaultUnit: "litros" | "m3" | "kg" | "ton";
  source: string;
}

// Stationary combustion emission factors
export const STATIONARY_FUELS: Record<string, FuelEmissionFactor> = {
  "Óleo Diesel": {
    name: "Óleo Diesel",
    nameEn: "Diesel Oil",
    ipccName: "Gas/Diesel Oil",
    type: "fossil",
    energyContent: 35.5, // GJ/m³
    energyUnit: "GJ/m3",
    co2: 0.0741,
    ch4: 0.000003,
    n2o: 0.000001,
    density: 840,
    defaultUnit: "litros",
    source: "IPCC (2006);V2;Ch 2; Table 2.3",
  },
  "Gasolina Automotiva": {
    name: "Gasolina Automotiva",
    nameEn: "Motor Gasoline",
    ipccName: "Motor Gasoline",
    type: "fossil",
    energyContent: 32.24, // GJ/m³
    energyUnit: "GJ/m3",
    co2: 0.0693,
    ch4: 0.000003,
    n2o: 0.000001,
    density: 742,
    defaultUnit: "litros",
    source: "IPCC (2006);V2;Ch 2; Table 2.3",
  },
  "GLP": {
    name: "GLP",
    nameEn: "LPG",
    ipccName: "Liquified Petroleum Gases",
    type: "fossil",
    energyContent: 25.58, // GJ/m³
    energyUnit: "GJ/m3",
    co2: 0.0631,
    ch4: 0.000001,
    n2o: 0.0,
    density: 552,
    defaultUnit: "kg",
    source: "IPCC (2006);V2;Ch 2; Table 2.3",
  },
  "Gás Natural": {
    name: "Gás Natural",
    nameEn: "Natural Gas",
    ipccName: "Natural Gas",
    type: "fossil",
    energyContent: 0.04158, // GJ/m³
    energyUnit: "GJ/m3",
    co2: 0.0561,
    ch4: 0.000001,
    n2o: 0.0,
    density: 0.74,
    defaultUnit: "m3",
    source: "IPCC (2006);V2;Ch 2; Table 2.3",
  },
  "Gás Natural Seco": {
    name: "Gás Natural Seco",
    nameEn: "Dry Natural Gas",
    ipccName: "Natural Gas",
    type: "fossil",
    energyContent: 0.03684, // GJ/m³
    energyUnit: "GJ/m3",
    co2: 0.0561,
    ch4: 0.000001,
    n2o: 0.0,
    density: 0.74,
    defaultUnit: "m3",
    source: "BEN 2022 + IPCC (2006)",
  },
  "Gás Natural Úmido": {
    name: "Gás Natural Úmido",
    nameEn: "Humid Natural Gas",
    ipccName: "Natural Gas",
    type: "fossil",
    energyContent: 0.04158, // GJ/m³
    energyUnit: "GJ/m3",
    co2: 0.0561,
    ch4: 0.000001,
    n2o: 0.0,
    density: 0.74,
    defaultUnit: "m3",
    source: "BEN 2022 + IPCC (2006)",
  },
  "Óleo Combustível": {
    name: "Óleo Combustível",
    nameEn: "Fuel Oil",
    ipccName: "Residual Fuel Oil",
    type: "fossil",
    energyContent: 40.07, // GJ/m³
    energyUnit: "GJ/m3",
    co2: 0.0774,
    ch4: 0.000003,
    n2o: 0.000001,
    density: 1000,
    defaultUnit: "litros",
    source: "IPCC (2006);V2;Ch 2; Table 2.3",
  },
  "Querosene": {
    name: "Querosene",
    nameEn: "Kerosene",
    ipccName: "Other Kerosene",
    type: "fossil",
    energyContent: 34.42, // GJ/m³
    energyUnit: "GJ/m3",
    co2: 0.0719,
    ch4: 0.000003,
    n2o: 0.000001,
    density: 799,
    defaultUnit: "litros",
    source: "IPCC (2006);V2;Ch 2; Table 2.3",
  },
  "Querosene de Aviação": {
    name: "Querosene de Aviação",
    nameEn: "Jet Fuel",
    ipccName: "Jet Fuel",
    type: "fossil",
    energyContent: 34.42, // GJ/m³
    energyUnit: "GJ/m3",
    co2: 0.0719,
    ch4: 0.000003,
    n2o: 0.000001,
    density: 799,
    defaultUnit: "litros",
    source: "IPCC (2006);V2;Ch 2; Table 2.3",
  },
  "Coque de Petróleo": {
    name: "Coque de Petróleo",
    nameEn: "Petroleum Coke",
    ipccName: "Petroleum Coke",
    type: "fossil",
    energyContent: 36.51, // GJ/ton
    energyUnit: "GJ/ton",
    co2: 0.0971,
    ch4: 0.000003,
    n2o: 0.000001,
    density: 1040,
    defaultUnit: "ton",
    source: "IPCC (2006);V2;Ch 2; Table 2.3",
  },
  "Carvão Mineral": {
    name: "Carvão Mineral",
    nameEn: "Coal",
    ipccName: "Other Bituminous Coal",
    type: "fossil",
    energyContent: 25.8, // GJ/ton
    energyUnit: "GJ/ton",
    co2: 0.0946,
    ch4: 0.00001,
    n2o: 0.0000015,
    defaultUnit: "ton",
    source: "IPCC (2006);V2;Ch 2; Table 2.3",
  },
  "Outros Energéticos de Petróleo": {
    name: "Outros Energéticos de Petróleo",
    nameEn: "Other Petroleum Products",
    ipccName: "Other Petroleum Products",
    type: "fossil",
    energyContent: 36.84, // GJ/m³
    energyUnit: "GJ/m3",
    co2: 0.0733,
    ch4: 0.000003,
    n2o: 0.000001,
    density: 864,
    defaultUnit: "kg",
    source: "IPCC (2006);V2;Ch 2; Table 2.3",
  },
  "Lubrificantes": {
    name: "Lubrificantes",
    nameEn: "Lubricating Oil",
    ipccName: "Lubricating Oil",
    type: "fossil",
    energyContent: 36.43, // GJ/m³
    energyUnit: "GJ/m3",
    co2: 0.014667,
    ch4: 0.0,
    n2o: 0.0,
    density: 875,
    defaultUnit: "litros",
    source: "IPCC (2006);V3;Ch 5",
  },
  "Graxas": {
    name: "Graxas",
    nameEn: "Grease",
    ipccName: "Grease",
    type: "fossil",
    energyContent: 36.43, // GJ/m³
    energyUnit: "GJ/m3",
    co2: 0.003667,
    ch4: 0.0,
    n2o: 0.0,
    density: 875,
    defaultUnit: "kg",
    source: "IPCC (2006);V3;Ch 5",
  },
  // Renewable fuels
  "Álcool Etílico Anidro": {
    name: "Álcool Etílico Anidro",
    nameEn: "Anhydrous Alcohol",
    ipccName: "Other Liquid Biofuels",
    type: "renewable",
    energyContent: 22.36, // GJ/m³
    energyUnit: "GJ/m3",
    co2: 0.0796,
    ch4: 0.000003,
    n2o: 0.000001,
    density: 791,
    defaultUnit: "litros",
    source: "IPCC (2006);V2;Ch 2; Table 2.3",
  },
  "Álcool Etílico Hidratado": {
    name: "Álcool Etílico Hidratado",
    nameEn: "Hydrated Alcohol",
    ipccName: "Other Liquid Biofuels",
    type: "renewable",
    energyContent: 21.35, // GJ/m³
    energyUnit: "GJ/m3",
    co2: 0.0796,
    ch4: 0.000003,
    n2o: 0.000001,
    density: 809,
    defaultUnit: "litros",
    source: "IPCC (2006);V2;Ch 2; Table 2.3",
  },
  "Etanol": {
    name: "Etanol",
    nameEn: "Ethanol",
    ipccName: "Other Liquid Biofuels",
    type: "renewable",
    energyContent: 21.35, // GJ/m³
    energyUnit: "GJ/m3",
    co2: 0.0796,
    ch4: 0.000003,
    n2o: 0.000001,
    density: 809,
    defaultUnit: "litros",
    source: "IPCC (2006);V2;Ch 2; Table 2.3",
  },
  "Biodiesel": {
    name: "Biodiesel",
    nameEn: "Biodiesel (B100)",
    ipccName: "Biodiesels",
    type: "renewable",
    energyContent: 33.14, // GJ/m³
    energyUnit: "GJ/m3",
    co2: 0.0708,
    ch4: 0.000003,
    n2o: 0.000001,
    density: 880,
    defaultUnit: "litros",
    source: "IPCC (2006);V2;Ch 2; Table 2.3",
  },
  "Biomassa": {
    name: "Biomassa",
    nameEn: "Biomass",
    ipccName: "Other Primary Solid Biomass",
    type: "renewable",
    energyContent: 3.138, // GJ/ton
    energyUnit: "GJ/ton",
    co2: 0.1,
    ch4: 0.00003,
    n2o: 0.000004,
    density: 250,
    defaultUnit: "ton",
    source: "IPCC (2006);V2;Ch 2; Table 2.3",
  },
  "Lenha": {
    name: "Lenha",
    nameEn: "Firewood",
    ipccName: "Other Primary Solid Biomass",
    type: "renewable",
    energyContent: 5.0622, // GJ/ton (lenha comercial)
    energyUnit: "GJ/ton",
    co2: 0.1,
    ch4: 0.0003,
    n2o: 0.000004,
    density: 390,
    defaultUnit: "ton",
    source: "IPCC (2006);V2;Ch 2; Table 2.3",
  },
  "Carvão Vegetal": {
    name: "Carvão Vegetal",
    nameEn: "Charcoal",
    ipccName: "Charcoal",
    type: "renewable",
    energyContent: 6.76, // GJ/ton
    energyUnit: "GJ/ton",
    co2: 0.1,
    ch4: 0.0002,
    n2o: 0.000001,
    density: 250,
    defaultUnit: "ton",
    source: "IPCC (2006);V2;Ch 2; Table 2.3",
  },
  "Lixívia": {
    name: "Lixívia",
    nameEn: "Black Liquor",
    ipccName: "Sulphite lyes (Black Liquor)",
    type: "renewable",
    energyContent: 13.04, // GJ/m³
    energyUnit: "GJ/m3",
    co2: 0.0953,
    ch4: 0.000003,
    n2o: 0.000002,
    density: 1090,
    defaultUnit: "ton",
    source: "IPCC (2006);V2;Ch 2; Table 2.3",
  },
};

// Mobile combustion emission factors (Road Transportation)
export const MOBILE_FUELS_ROAD: Record<string, FuelEmissionFactor> = {
  "Gasolina Automotiva": {
    name: "Gasolina Automotiva",
    nameEn: "Motor Gasoline",
    ipccName: "Motor Gasoline - Low Mileage Light Duty Vehicle",
    type: "fossil",
    energyContent: 32.24,
    energyUnit: "GJ/m3",
    co2: 0.0693,
    ch4: 0.000004,
    n2o: 0.000006,
    density: 742,
    defaultUnit: "litros",
    source: "IPCC (2006);V2;Ch 3",
  },
  "Óleo Diesel": {
    name: "Óleo Diesel",
    nameEn: "Diesel Oil",
    ipccName: "Gas/Diesel Oil",
    type: "fossil",
    energyContent: 35.5,
    energyUnit: "GJ/m3",
    co2: 0.0741,
    ch4: 0.000004,
    n2o: 0.000004,
    density: 840,
    defaultUnit: "litros",
    source: "IPCC (2006);V2;Ch 3",
  },
  "GLP": {
    name: "GLP",
    nameEn: "LPG",
    ipccName: "Liquified Petroleum Gases",
    type: "fossil",
    energyContent: 25.58,
    energyUnit: "GJ/m3",
    co2: 0.0631,
    ch4: 0.000062,
    n2o: 0.0,
    density: 552,
    defaultUnit: "kg",
    source: "IPCC (2006);V2;Ch 3",
  },
  "Álcool Etílico Hidratado": {
    name: "Álcool Etílico Hidratado",
    nameEn: "Hydrated Ethanol",
    ipccName: "Other liquid biofuels - Ethanol, cars, Brazil",
    type: "renewable",
    energyContent: 21.35,
    energyUnit: "GJ/m3",
    co2: 0.0796,
    ch4: 0.000018,
    n2o: 0.000001,
    density: 809,
    defaultUnit: "litros",
    source: "IPCC (2006);V2;Ch 2 e Ch3",
  },
  "Etanol": {
    name: "Etanol",
    nameEn: "Ethanol",
    ipccName: "Other liquid biofuels - Ethanol, cars, Brazil",
    type: "renewable",
    energyContent: 21.35,
    energyUnit: "GJ/m3",
    co2: 0.0796,
    ch4: 0.000018,
    n2o: 0.000001,
    density: 809,
    defaultUnit: "litros",
    source: "IPCC (2006);V2;Ch 2 e Ch3",
  },
  "Biodiesel": {
    name: "Biodiesel",
    nameEn: "Biodiesel",
    ipccName: "Biodiesels",
    type: "renewable",
    energyContent: 33.14,
    energyUnit: "GJ/m3",
    co2: 0.0708,
    ch4: 0.000003,
    n2o: 0.000001,
    density: 880,
    defaultUnit: "litros",
    source: "IPCC (2006);V2;Ch 2",
  },
};

// Mobile combustion emission factors (Off-Road - Agriculture/Forestry)
export const MOBILE_FUELS_OFFROAD: Record<string, FuelEmissionFactor> = {
  "Gasolina Automotiva": {
    name: "Gasolina Automotiva",
    nameEn: "Motor Gasoline",
    ipccName: "Motor Gasoline 4-stroke - Agriculture",
    type: "fossil",
    energyContent: 32.24,
    energyUnit: "GJ/m3",
    co2: 0.0693,
    ch4: 0.00008,
    n2o: 0.000002,
    density: 742,
    defaultUnit: "litros",
    source: "IPCC (2006);V2;Ch 3",
  },
  "Óleo Diesel": {
    name: "Óleo Diesel",
    nameEn: "Diesel Oil",
    ipccName: "Diesel - Forestry",
    type: "fossil",
    energyContent: 35.5,
    energyUnit: "GJ/m3",
    co2: 0.0741,
    ch4: 0.000004,
    n2o: 0.000029,
    density: 840,
    defaultUnit: "litros",
    source: "IPCC (2006);V2;Ch 3",
  },
  "Álcool Etílico Hidratado": {
    name: "Álcool Etílico Hidratado",
    nameEn: "Hydrated Ethanol",
    ipccName: "Other liquid biofuels - Ethanol, cars, Brazil",
    type: "renewable",
    energyContent: 21.35,
    energyUnit: "GJ/m3",
    co2: 0.0796,
    ch4: 0.000018,
    n2o: 0.000001,
    density: 809,
    defaultUnit: "litros",
    source: "IPCC (2006);V2;Ch 2 e Ch3",
  },
  "Biodiesel": {
    name: "Biodiesel",
    nameEn: "Biodiesel",
    ipccName: "Biodiesels",
    type: "renewable",
    energyContent: 33.14,
    energyUnit: "GJ/m3",
    co2: 0.0708,
    ch4: 0.000003,
    n2o: 0.000001,
    density: 880,
    defaultUnit: "litros",
    source: "IPCC (2006);V2;Ch 2",
  },
};

// Get fuel by name (case-insensitive, with common aliases)
export function getFuel(
  fuelName: string,
  combustionType: "stationary" | "mobile-road" | "mobile-offroad" = "stationary"
): FuelEmissionFactor | undefined {
  const normalizedName = fuelName.trim();

  // Common aliases
  const aliases: Record<string, string> = {
    "DIESEL": "Óleo Diesel",
    "GASOLINA": "Gasolina Automotiva",
    "ETANOL": "Álcool Etílico Hidratado",
    "GAS NATURAL": "Gás Natural",
    "GÁS NATURAL": "Gás Natural",
    "GAS GLP": "GLP",
    "GÁS GLP": "GLP",
  };

  const resolvedName = aliases[normalizedName.toUpperCase()] || normalizedName;

  const fuelSources = {
    "stationary": STATIONARY_FUELS,
    "mobile-road": MOBILE_FUELS_ROAD,
    "mobile-offroad": MOBILE_FUELS_OFFROAD,
  };

  const fuels = fuelSources[combustionType];

  // Try exact match
  if (fuels[resolvedName]) {
    return fuels[resolvedName];
  }

  // Try case-insensitive match
  const lowerName = resolvedName.toLowerCase();
  for (const [key, value] of Object.entries(fuels)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }

  return undefined;
}

// Get all available fuels for a combustion type
export function getAvailableFuels(
  combustionType: "stationary" | "mobile-road" | "mobile-offroad" = "stationary"
): FuelEmissionFactor[] {
  const fuelSources = {
    "stationary": STATIONARY_FUELS,
    "mobile-road": MOBILE_FUELS_ROAD,
    "mobile-offroad": MOBILE_FUELS_OFFROAD,
  };

  return Object.values(fuelSources[combustionType]);
}
