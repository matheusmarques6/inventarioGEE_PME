// Local type definitions to avoid Prisma client import issues

// Base types that mirror Prisma schema
export interface Organization {
  id: string;
  name: string;
  cnpj: string;
  sector: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  supabaseId: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Inventory {
  id: string;
  organizationId: string;
  name?: string | null;
  baseYear: number;
  reportingPeriod: string;
  gwpReference: string;
  status: string;
  consolidationApproach: string;
  includeScope1: boolean;
  includeScope2: boolean;
  includeScope3: boolean;
  totalEmissionsScope1?: number | null;
  totalEmissionsScope2?: number | null;
  totalEmissionsScope3?: number | null;
  totalBiogenicEmissions?: number | null;
  totalRemovals?: number | null;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date | null;
  verifiedAt?: Date | null;
}

export interface OperationalUnit {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  state?: string | null;
  city?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityData {
  id: string;
  inventoryId: string;
  unitId?: string | null;
  category: string;
  subcategory?: string | null;
  scope: number;
  sourceDescription: string;
  activityType: string;
  quantity: unknown;
  quantityUnit: string;
  month?: number | null;
  year: number;
  dataSource?: string | null;
  dataQuality: string;
  uncertainty?: unknown;
  evidenceUrl?: string | null;
  notes?: string | null;
  emissionFactorId?: string | null;
  metadata?: unknown;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
}

export interface EmissionResult {
  id: string;
  inventoryId: string;
  activityDataId: string;
  co2Mass?: unknown;
  ch4Mass?: unknown;
  n2oMass?: unknown;
  hfcMass?: unknown;
  pfcMass?: unknown;
  sf6Mass?: unknown;
  nf3Mass?: unknown;
  co2Equivalent: unknown;
  biogenicCo2?: unknown;
  removals?: unknown;
  scope: number;
  category: string;
  isKyotoGas: boolean;
  uncertainty?: unknown;
  calculatedAt: Date;
  calculationVersion: string;
  gwpReference: string;
  factorsSnapshot?: unknown;
}

export interface EmissionFactor {
  id: string;
  name: string;
  category: string;
  subcategory?: string | null;
  co2Factor?: unknown;
  ch4Factor?: unknown;
  n2oFactor?: unknown;
  factorUnit: string;
  activityUnit: string;
  source: string;
  reference?: string | null;
  validFrom: Date;
  validTo?: Date | null;
  region?: string | null;
  density?: unknown;
  pci?: unknown;
  energyContent?: unknown;
  isRenewable: boolean;
  biofuelBlend?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface GWPFactor {
  id: string;
  gasName: string;
  gasFormula?: string | null;
  gasFamily: string;
  gwpAR4?: number | null;
  gwpAR5?: number | null;
  gwpAR6?: number | null;
  isKyotoGas: boolean;
  isMontrealGas: boolean;
}

export interface Report {
  id: string;
  inventoryId: string;
  type: string;
  format: string;
  fileUrl?: string | null;
  fileName?: string | null;
  generatedAt: Date;
  generatedBy?: string | null;
}

export interface AuditLog {
  id: string;
  inventoryId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: unknown;
  newValue?: unknown;
  userId: string;
  userEmail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

// Extended types with relations
export type InventoryWithRelations = Inventory & {
  organization?: Organization;
  activityData?: ActivityData[];
  emissionResults?: EmissionResult[];
  reports?: Report[];
  _count?: {
    activityData: number;
    emissionResults: number;
    reports: number;
  };
};

export type ActivityDataWithRelations = ActivityData & {
  inventory?: Inventory;
  unit?: OperationalUnit;
  emissionFactor?: EmissionFactor;
  emissionResults?: EmissionResult[];
};

export type EmissionResultWithRelations = EmissionResult & {
  inventory?: Inventory;
  activityData?: ActivityData;
};

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard stats
export interface DashboardStats {
  totalEmissions: number;
  scope1: number;
  scope2: number;
  scope3: number;
  biogenic: number;
  removals: number;
  previousYear?: number;
  changePercent?: number;
}

// Emission category info
export interface CategoryInfo {
  name: string;
  scope: number;
  description: string;
  icon?: string;
}
