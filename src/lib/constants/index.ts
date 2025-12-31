// Re-export all constants
export * from "./gwp";
export * from "./biofuel-blends";
export * from "./emission-factors";
export * from "./grid-factors";
export * from "./forest-factors";
export * from "./fire-factors";
export * from "./fertilizer-factors";
export * from "./transport-factors";
export * from "./waste-factors";

// Categories mapping for UI
export const EMISSION_CATEGORIES = {
  // Escopo 1
  STATIONARY_COMBUSTION: {
    name: "Combustão Estacionária",
    scope: 1,
    description: "Caldeiras, geradores, fornos",
  },
  MOBILE_COMBUSTION: {
    name: "Combustão Móvel",
    scope: 1,
    description: "Frota própria de veículos",
  },
  FUGITIVE_EMISSIONS: {
    name: "Emissões Fugitivas",
    scope: 1,
    description: "Gases refrigerantes",
  },
  PROCESS_EMISSIONS: {
    name: "Emissões de Processo",
    scope: 1,
    description: "Processos industriais",
  },
  AGRICULTURAL: {
    name: "Agrícolas",
    scope: 1,
    description: "Fertilizantes nitrogenados",
  },
  LULUCF: {
    name: "Uso da Terra e Florestas",
    scope: 1,
    description: "Florestas plantadas, incêndios, vegetação nativa",
  },
  WASTE_INTERNAL: {
    name: "Resíduos Internos",
    scope: 1,
    description: "Tratamento de efluentes interno",
  },

  // Escopo 2
  PURCHASED_ELECTRICITY: {
    name: "Eletricidade Comprada",
    scope: 2,
    description: "Consumo de energia elétrica",
  },
  PURCHASED_HEAT: {
    name: "Calor/Vapor Comprado",
    scope: 2,
    description: "Energia térmica adquirida",
  },

  // Escopo 3
  PURCHASED_GOODS: {
    name: "Bens e Serviços Adquiridos",
    scope: 3,
    description: "Insumos, materiais, serviços",
  },
  CAPITAL_GOODS: {
    name: "Bens de Capital",
    scope: 3,
    description: "Equipamentos, construções",
  },
  FUEL_ENERGY_ACTIVITIES: {
    name: "Atividades de Combustível/Energia",
    scope: 3,
    description: "Upstream de combustíveis",
  },
  UPSTREAM_TRANSPORT: {
    name: "Transporte Upstream",
    scope: 3,
    description: "Transporte de insumos",
  },
  DOWNSTREAM_TRANSPORT: {
    name: "Transporte Downstream",
    scope: 3,
    description: "Distribuição de produtos",
  },
  WASTE_EXTERNAL: {
    name: "Resíduos (Externo)",
    scope: 3,
    description: "Tratamento externo de resíduos",
  },
  BUSINESS_TRAVEL: {
    name: "Viagens a Negócios",
    scope: 3,
    description: "Viagens aéreas, terrestres",
  },
  EMPLOYEE_COMMUTING: {
    name: "Transporte de Colaboradores",
    scope: 3,
    description: "Deslocamento casa-trabalho",
  },
  LEASED_ASSETS: {
    name: "Ativos Arrendados",
    scope: 3,
    description: "Ativos upstream/downstream",
  },
  INVESTMENTS: {
    name: "Investimentos",
    scope: 3,
    description: "Participações societárias",
  },
} as const;

export type EmissionCategoryKey = keyof typeof EMISSION_CATEGORIES;

// Unit types
export const UNIT_TYPES = {
  INDUSTRIAL: { name: "Industrial", description: "Plantas industriais" },
  FLORESTAL: { name: "Florestal", description: "Áreas florestais" },
  ADMINISTRATIVO: { name: "Administrativo", description: "Escritórios" },
  AGRICOLA: { name: "Agrícola", description: "Áreas agrícolas" },
  LOGISTICO: { name: "Logístico", description: "Centros de distribuição" },
} as const;

// Inventory status
export const INVENTORY_STATUS = {
  DRAFT: { name: "Rascunho", color: "gray" },
  IN_REVIEW: { name: "Em Revisão", color: "yellow" },
  SUBMITTED: { name: "Submetido", color: "blue" },
  VERIFIED: { name: "Verificado", color: "green" },
  PUBLISHED: { name: "Publicado", color: "green" },
} as const;

// Brazilian states
export const BRAZILIAN_STATES = [
  { code: "AC", name: "Acre" },
  { code: "AL", name: "Alagoas" },
  { code: "AP", name: "Amapá" },
  { code: "AM", name: "Amazonas" },
  { code: "BA", name: "Bahia" },
  { code: "CE", name: "Ceará" },
  { code: "DF", name: "Distrito Federal" },
  { code: "ES", name: "Espírito Santo" },
  { code: "GO", name: "Goiás" },
  { code: "MA", name: "Maranhão" },
  { code: "MT", name: "Mato Grosso" },
  { code: "MS", name: "Mato Grosso do Sul" },
  { code: "MG", name: "Minas Gerais" },
  { code: "PA", name: "Pará" },
  { code: "PB", name: "Paraíba" },
  { code: "PR", name: "Paraná" },
  { code: "PE", name: "Pernambuco" },
  { code: "PI", name: "Piauí" },
  { code: "RJ", name: "Rio de Janeiro" },
  { code: "RN", name: "Rio Grande do Norte" },
  { code: "RS", name: "Rio Grande do Sul" },
  { code: "RO", name: "Rondônia" },
  { code: "RR", name: "Roraima" },
  { code: "SC", name: "Santa Catarina" },
  { code: "SP", name: "São Paulo" },
  { code: "SE", name: "Sergipe" },
  { code: "TO", name: "Tocantins" },
];
