// =====================================================
// PERCENTUAIS DE BIOCOMBUSTÍVEIS
// Fonte: ANP/CNPE
// =====================================================

export interface BiofuelBlend {
  year: number;
  ethanolInGasoline: number; // Fração de etanol anidro na gasolina C
  biodieselInDiesel: number; // Fração de biodiesel no diesel B
}

// Percentual de etanol anidro na gasolina por ano
export const ETHANOL_BLEND: Record<number, number> = {
  2008: 0.25,
  2009: 0.25,
  2010: 0.2375,
  2011: 0.2375,
  2012: 0.2,
  2013: 0.2333,
  2014: 0.25,
  2015: 0.2659,
  2016: 0.27,
  2017: 0.27,
  2018: 0.27,
  2019: 0.27,
  2020: 0.27,
  2021: 0.27,
  2022: 0.27,
  2023: 0.27,
  2024: 0.27,
  2025: 0.27, // Estimativa
};

// Percentual de biodiesel no diesel por ano
export const BIODIESEL_BLEND: Record<number, number> = {
  2008: 0.025,
  2009: 0.035,
  2010: 0.05,
  2011: 0.05,
  2012: 0.05,
  2013: 0.05,
  2014: 0.0567,
  2015: 0.07,
  2016: 0.07,
  2017: 0.0783,
  2018: 0.0967,
  2019: 0.1033,
  2020: 0.1133,
  2021: 0.1117,
  2022: 0.1,
  2023: 0.12,
  2024: 0.1367,
  2025: 0.14, // Estimativa
};

// Função para obter a mistura de biocombustíveis por ano
export function getBiofuelBlend(year: number): BiofuelBlend {
  // Se o ano não estiver na tabela, usar o mais recente disponível
  const latestYear = Math.max(...Object.keys(ETHANOL_BLEND).map(Number));
  const effectiveYear = year > latestYear ? latestYear : year;

  return {
    year: effectiveYear,
    ethanolInGasoline: ETHANOL_BLEND[effectiveYear] || 0.27,
    biodieselInDiesel: BIODIESEL_BLEND[effectiveYear] || 0.12,
  };
}

// Função para calcular fração fóssil de combustíveis
export function getFossilFraction(
  fuelType: string,
  year: number
): { fossil: number; renewable: number } {
  const blend = getBiofuelBlend(year);

  switch (fuelType) {
    case "Gasolina Automotiva":
    case "Gasolina C":
      return {
        fossil: 1 - blend.ethanolInGasoline,
        renewable: blend.ethanolInGasoline,
      };

    case "Óleo Diesel":
    case "Diesel B":
    case "Diesel":
      return {
        fossil: 1 - blend.biodieselInDiesel,
        renewable: blend.biodieselInDiesel,
      };

    case "Álcool Etílico Anidro":
    case "Álcool Etílico Hidratado":
    case "Etanol":
    case "Biodiesel":
      return { fossil: 0, renewable: 1 };

    case "Gás Natural":
    case "GLP":
    case "Querosene de Aviação":
    case "Óleo Combustível":
      return { fossil: 1, renewable: 0 };

    default:
      return { fossil: 1, renewable: 0 };
  }
}
