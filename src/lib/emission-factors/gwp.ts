// Global Warming Potential (GWP) values - AR5 (IPCC 2021)
// Reference: IPCC AR6 WG1 Chapter 7, Table 7.15

export const GWP = {
  CO2: 1,
  CH4: 28,  // Methane
  N2O: 265, // Nitrous Oxide
} as const;

// GWP for refrigerant gases (HFCs, HCFCs, etc.)
export const GWP_REFRIGERANTS: Record<string, { gwp: number; family: string; formula?: string }> = {
  // HFCs (Kyoto Protocol)
  "HFC-23": { gwp: 12400, family: "HFC", formula: "CHF3" },
  "HFC-32": { gwp: 677, family: "HFC", formula: "CH2F2" },
  "HFC-41": { gwp: 116, family: "HFC", formula: "CH3F2" },
  "HFC-125": { gwp: 3170, family: "HFC", formula: "CHF2CF3" },
  "HFC-134": { gwp: 1120, family: "HFC", formula: "CHF2CHF2" },
  "HFC-134a": { gwp: 1300, family: "HFC", formula: "CH2FCF3" },
  "HFC-143": { gwp: 328, family: "HFC", formula: "CH2FCHF2" },
  "HFC-143a": { gwp: 4800, family: "HFC", formula: "CH3CF3" },
  "HFC-152": { gwp: 16, family: "HFC", formula: "CH2FCH2F" },
  "HFC-152a": { gwp: 138, family: "HFC", formula: "CH3CHF2" },
  "HFC-227ea": { gwp: 3350, family: "HFC", formula: "CF3CHFCF3" },
  "HFC-236fa": { gwp: 8060, family: "HFC", formula: "CF3CH2CF3" },
  "HFC-245fa": { gwp: 858, family: "HFC", formula: "CHF2CH2CF3" },
  "HFC-365mfc": { gwp: 804, family: "HFC", formula: "CF3CH2CF2CH3" },
  "HFC-43-10mee": { gwp: 1650, family: "HFC", formula: "CF3CHFCHFCF2CF3" },

  // HCFCs (Montreal Protocol - not Kyoto)
  "HCFC-22": { gwp: 1760, family: "HCFC", formula: "CHClF2" },
  "HCFC-123": { gwp: 79, family: "HCFC", formula: "CHCl2CF3" },
  "HCFC-124": { gwp: 527, family: "HCFC", formula: "CHClFCF3" },
  "HCFC-141b": { gwp: 782, family: "HCFC", formula: "CH3CCl2F" },
  "HCFC-142b": { gwp: 1980, family: "HCFC", formula: "CH3CClF2" },
  "HCFC-225ca": { gwp: 127, family: "HCFC", formula: "CHCl2CF2CF3" },
  "HCFC-225cb": { gwp: 525, family: "HCFC", formula: "CHClFCF2CClF2" },

  // CFCs (Montreal Protocol)
  "CFC-11": { gwp: 4660, family: "CFC", formula: "CCl3F" },
  "CFC-12": { gwp: 10200, family: "CFC", formula: "CCl2F2" },
  "CFC-113": { gwp: 5820, family: "CFC", formula: "CCl2FCClF2" },
  "CFC-114": { gwp: 8590, family: "CFC", formula: "CClF2CClF2" },
  "CFC-115": { gwp: 7670, family: "CFC", formula: "CClF2CF3" },

  // Blends/Mixtures (R-4xx series)
  "R-404A": { gwp: 3922, family: "HFC-Blend" },
  "R-407A": { gwp: 2107, family: "HFC-Blend" },
  "R-407C": { gwp: 1774, family: "HFC-Blend" },
  "R-410A": { gwp: 2088, family: "HFC-Blend" },
  "R-417A": { gwp: 2346, family: "HFC-Blend" },
  "R-422A": { gwp: 3143, family: "HFC-Blend" },
  "R-422D": { gwp: 2729, family: "HFC-Blend" },
  "R-438A": { gwp: 2265, family: "HFC-Blend" },
  "R-507A": { gwp: 3985, family: "HFC-Blend" },

  // Aliases
  "R-22": { gwp: 1760, family: "HCFC", formula: "CHClF2" },
  "R-32": { gwp: 677, family: "HFC", formula: "CH2F2" },
  "R-134a": { gwp: 1300, family: "HFC", formula: "CH2FCF3" },

  // PFCs
  "PFC-14": { gwp: 6630, family: "PFC", formula: "CF4" },
  "PFC-116": { gwp: 11100, family: "PFC", formula: "C2F6" },
  "PFC-218": { gwp: 8900, family: "PFC", formula: "C3F8" },
  "PFC-318": { gwp: 9540, family: "PFC", formula: "c-C4F8" },
  "PFC-3-1-10": { gwp: 9200, family: "PFC", formula: "C4F10" },
  "PFC-4-1-12": { gwp: 8550, family: "PFC", formula: "C5F12" },
  "PFC-5-1-14": { gwp: 7910, family: "PFC", formula: "C6F14" },

  // SF6
  "SF6": { gwp: 23500, family: "SF6", formula: "SF6" },

  // NF3
  "NF3": { gwp: 16100, family: "NF3", formula: "NF3" },
};

// Check if a gas is under Kyoto Protocol (HFCs, PFCs, SF6, NF3)
export function isKyotoGas(gasName: string): boolean {
  const gas = GWP_REFRIGERANTS[gasName];
  if (!gas) return false;
  return ["HFC", "HFC-Blend", "PFC", "SF6", "NF3"].includes(gas.family);
}

// Get GWP value for a refrigerant gas
export function getRefrigerantGWP(gasName: string): number {
  const normalized = gasName.toUpperCase().replace(/\s+/g, "").replace("R-", "R-").replace("R", "R-");

  // Try exact match first
  if (GWP_REFRIGERANTS[gasName]) {
    return GWP_REFRIGERANTS[gasName].gwp;
  }

  // Try with R- prefix
  if (GWP_REFRIGERANTS[`R-${gasName.replace(/^R-?/i, "")}`]) {
    return GWP_REFRIGERANTS[`R-${gasName.replace(/^R-?/i, "")}`].gwp;
  }

  // Try HFC prefix
  if (GWP_REFRIGERANTS[`HFC-${gasName.replace(/^HFC-?/i, "")}`]) {
    return GWP_REFRIGERANTS[`HFC-${gasName.replace(/^HFC-?/i, "")}`].gwp;
  }

  // Try HCFC prefix
  if (GWP_REFRIGERANTS[`HCFC-${gasName.replace(/^HCFC-?/i, "")}`]) {
    return GWP_REFRIGERANTS[`HCFC-${gasName.replace(/^HCFC-?/i, "")}`].gwp;
  }

  return 0;
}
