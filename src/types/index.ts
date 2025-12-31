import type {
  Organization,
  User,
  Inventory,
  OperationalUnit,
  ActivityData,
  EmissionResult,
  EmissionFactor,
  GWPFactor,
  Report,
  AuditLog,
} from "@prisma/client";

// Re-export Prisma types
export type {
  Organization,
  User,
  Inventory,
  OperationalUnit,
  ActivityData,
  EmissionResult,
  EmissionFactor,
  GWPFactor,
  Report,
  AuditLog,
};

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
