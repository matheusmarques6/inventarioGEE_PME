// Cliente de banco de dados usando Supabase
// Substitui o Prisma Client

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Tipos das tabelas
export interface Organization {
  id: string;
  name: string;
  cnpj: string;
  sector: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  supabase_id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EDITOR" | "VIEWER" | "AUDITOR";
  organization_id: string;
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface Inventory {
  id: string;
  organization_id: string;
  name?: string | null;
  base_year: number;
  reporting_period: string;
  gwp_reference: "AR4" | "AR5" | "AR6";
  status: "DRAFT" | "IN_REVIEW" | "SUBMITTED" | "VERIFIED" | "PUBLISHED";
  consolidation_approach: "OPERATIONAL_CONTROL" | "FINANCIAL_CONTROL" | "EQUITY_SHARE";
  include_scope1: boolean;
  include_scope2: boolean;
  include_scope3: boolean;
  total_emissions_scope1?: number | null;
  total_emissions_scope2?: number | null;
  total_emissions_scope3?: number | null;
  total_biogenic_emissions?: number | null;
  total_removals?: number | null;
  created_at: string;
  updated_at: string;
  submitted_at?: string | null;
  verified_at?: string | null;
}

export interface OperationalUnit {
  id: string;
  organization_id: string;
  name: string;
  type: "INDUSTRIAL" | "FLORESTAL" | "ADMINISTRATIVO" | "AGRICOLA" | "LOGISTICO";
  state?: string | null;
  city?: string | null;
  address?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type EmissionCategory =
  | "STATIONARY_COMBUSTION"
  | "MOBILE_COMBUSTION"
  | "FUGITIVE_EMISSIONS"
  | "PROCESS_EMISSIONS"
  | "AGRICULTURAL"
  | "LULUCF"
  | "WASTE_INTERNAL"
  | "PURCHASED_ELECTRICITY"
  | "PURCHASED_HEAT"
  | "PURCHASED_GOODS"
  | "CAPITAL_GOODS"
  | "FUEL_ENERGY_ACTIVITIES"
  | "UPSTREAM_TRANSPORT"
  | "DOWNSTREAM_TRANSPORT"
  | "WASTE_EXTERNAL"
  | "BUSINESS_TRAVEL"
  | "EMPLOYEE_COMMUTING"
  | "LEASED_ASSETS"
  | "INVESTMENTS";

export type DataQuality =
  | "PRIMARY"
  | "PRIMARY_THIRD"
  | "SECONDARY_CALC"
  | "SECONDARY_ASSUMED"
  | "EXTRAPOLATED";

export interface ActivityData {
  id: string;
  inventory_id: string;
  unit_id?: string | null;
  category: EmissionCategory;
  subcategory?: string | null;
  scope: number;
  source_description: string;
  activity_type: string;
  quantity: number;
  quantity_unit: string;
  month?: number | null;
  year: number;
  data_source?: string | null;
  data_quality: DataQuality;
  uncertainty?: number | null;
  evidence_url?: string | null;
  notes?: string | null;
  emission_factor_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  unit?: OperationalUnit | null;
  emission_results?: EmissionResult[];
}

export interface EmissionResult {
  id: string;
  inventory_id: string;
  activity_data_id: string;
  co2_mass?: number | null;
  ch4_mass?: number | null;
  n2o_mass?: number | null;
  hfc_mass?: number | null;
  pfc_mass?: number | null;
  sf6_mass?: number | null;
  nf3_mass?: number | null;
  co2_equivalent: number;
  biogenic_co2?: number | null;
  removals?: number | null;
  scope: number;
  category: EmissionCategory;
  is_kyoto_gas: boolean;
  uncertainty?: number | null;
  calculated_at: string;
  calculation_version: string;
  gwp_reference: "AR4" | "AR5" | "AR6";
  factors_snapshot?: Record<string, unknown> | null;
}

export interface AuditLog {
  id: string;
  inventory_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  previous_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  user_id: string;
  user_email?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  inventory_id: string;
  type: "GHG_PROTOCOL" | "GRI" | "CDP" | "SBCE" | "EXECUTIVE_SUMMARY" | "CUSTOM";
  format: "PDF" | "XLSX" | "DOCX" | "JSON";
  file_url?: string | null;
  file_name?: string | null;
  generated_at: string;
  generated_by?: string | null;
}

// Criar cliente Supabase
function createDbClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
}

// Singleton para o cliente
let dbClient: ReturnType<typeof createDbClient> | null = null;

export function getDb() {
  if (!dbClient) {
    dbClient = createDbClient();
  }
  return dbClient;
}

// Helper functions para operações comuns
export const db = {
  // Organizations
  organizations: {
    async findFirst() {
      const { data, error } = await getDb()
        .from("organizations")
        .select("*")
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as Organization | null;
    },

    async findById(id: string) {
      const { data, error } = await getDb()
        .from("organizations")
        .select("*")
        .eq("id", id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as Organization | null;
    },

    async findByCnpj(cnpj: string) {
      const { data, error } = await getDb()
        .from("organizations")
        .select("*")
        .eq("cnpj", cnpj)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as Organization | null;
    },

    async create(org: Partial<Organization>) {
      const { data, error } = await getDb()
        .from("organizations")
        .insert(org)
        .select()
        .single();
      if (error) throw error;
      return data as Organization;
    },

    async upsert(org: Partial<Organization>, onConflict: string = "cnpj") {
      const { data, error } = await getDb()
        .from("organizations")
        .upsert(org, { onConflict })
        .select()
        .single();
      if (error) throw error;
      return data as Organization;
    },
  },

  // Users
  users: {
    async findBySupabaseId(supabaseId: string) {
      const { data, error } = await getDb()
        .from("users")
        .select("*, organization:organizations(*)")
        .eq("supabase_id", supabaseId)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as User | null;
    },

    async create(user: Partial<User>) {
      const { data, error } = await getDb()
        .from("users")
        .insert(user)
        .select()
        .single();
      if (error) throw error;
      return data as User;
    },
  },

  // Inventories
  inventories: {
    async findMany(options?: { orderBy?: string; organizationId?: string }) {
      let query = getDb()
        .from("inventories")
        .select("*");

      if (options?.organizationId) {
        query = query.eq("organization_id", options.organizationId);
      }

      if (options?.orderBy) {
        const [field, order] = options.orderBy.split(":");
        query = query.order(field, { ascending: order !== "desc" });
      } else {
        query = query.order("base_year", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Inventory[];
    },

    async findById(id: string) {
      const { data, error } = await getDb()
        .from("inventories")
        .select("*")
        .eq("id", id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as Inventory | null;
    },

    async findByIdWithOrg(id: string, organizationId: string) {
      const { data, error } = await getDb()
        .from("inventories")
        .select("*")
        .eq("id", id)
        .eq("organization_id", organizationId)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as Inventory | null;
    },

    async create(inventory: Partial<Inventory>) {
      const { data, error } = await getDb()
        .from("inventories")
        .insert(inventory)
        .select()
        .single();
      if (error) throw error;
      return data as Inventory;
    },

    async update(id: string, updates: Partial<Inventory>) {
      const { data, error } = await getDb()
        .from("inventories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Inventory;
    },

    async delete(id: string) {
      const { error } = await getDb()
        .from("inventories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },

    async getWithCounts(id: string) {
      const { data: inventory, error: invError } = await getDb()
        .from("inventories")
        .select("*")
        .eq("id", id)
        .single();
      if (invError) throw invError;

      const { count: activityCount } = await getDb()
        .from("activity_data")
        .select("*", { count: "exact", head: true })
        .eq("inventory_id", id);

      const { count: emissionCount } = await getDb()
        .from("emission_results")
        .select("*", { count: "exact", head: true })
        .eq("inventory_id", id);

      return {
        ...inventory,
        _count: {
          activityData: activityCount || 0,
          emissionResults: emissionCount || 0,
        },
      };
    },

    async getAllWithCounts() {
      const { data: inventories, error } = await getDb()
        .from("inventories")
        .select("*")
        .order("base_year", { ascending: false });

      if (error) throw error;

      // Get counts for each inventory
      const inventoriesWithCounts = await Promise.all(
        (inventories || []).map(async (inv) => {
          const { count: activityCount } = await getDb()
            .from("activity_data")
            .select("*", { count: "exact", head: true })
            .eq("inventory_id", inv.id);

          const { count: emissionCount } = await getDb()
            .from("emission_results")
            .select("*", { count: "exact", head: true })
            .eq("inventory_id", inv.id);

          return {
            ...inv,
            _count: {
              activityData: activityCount || 0,
              emissionResults: emissionCount || 0,
            },
          };
        })
      );

      return inventoriesWithCounts;
    },
  },

  // Activity Data
  activityData: {
    async findMany(options: {
      inventoryId: string;
      scope?: number;
      category?: string;
      page?: number;
      limit?: number;
    }) {
      const { inventoryId, scope, category, page = 1, limit = 50 } = options;
      const offset = (page - 1) * limit;

      let query = getDb()
        .from("activity_data")
        .select("*, unit:operational_units(*), emission_results(*)")
        .eq("inventory_id", inventoryId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (scope !== undefined) query = query.eq("scope", scope);
      if (category) query = query.eq("category", category);

      const { data, error } = await query;
      if (error) throw error;
      return data as ActivityData[];
    },

    async count(options: { inventoryId: string; scope?: number; category?: string }) {
      const { inventoryId, scope, category } = options;

      let query = getDb()
        .from("activity_data")
        .select("*", { count: "exact", head: true })
        .eq("inventory_id", inventoryId);

      if (scope !== undefined) query = query.eq("scope", scope);
      if (category) query = query.eq("category", category);

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },

    async findById(id: string) {
      const { data, error } = await getDb()
        .from("activity_data")
        .select("*, unit:operational_units(*), emission_results(*)")
        .eq("id", id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as ActivityData | null;
    },

    async create(data: Partial<ActivityData>) {
      const { data: result, error } = await getDb()
        .from("activity_data")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result as ActivityData;
    },

    async update(id: string, updates: Partial<ActivityData>) {
      const { data, error } = await getDb()
        .from("activity_data")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as ActivityData;
    },

    async delete(id: string) {
      const { error } = await getDb()
        .from("activity_data")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },

    async findAll(inventoryId: string) {
      const { data, error } = await getDb()
        .from("activity_data")
        .select("*")
        .eq("inventory_id", inventoryId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ActivityData[];
    },
  },

  // Emission Results
  emissionResults: {
    async create(data: Partial<EmissionResult>) {
      const { data: result, error } = await getDb()
        .from("emission_results")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result as EmissionResult;
    },

    async deleteByActivityId(activityDataId: string) {
      const { error } = await getDb()
        .from("emission_results")
        .delete()
        .eq("activity_data_id", activityDataId);
      if (error) throw error;
    },

    async deleteByInventoryId(inventoryId: string) {
      const { error } = await getDb()
        .from("emission_results")
        .delete()
        .eq("inventory_id", inventoryId);
      if (error) throw error;
    },

    async sumByScope(inventoryId: string, scope: number) {
      const { data, error } = await getDb()
        .from("emission_results")
        .select("co2_equivalent, biogenic_co2")
        .eq("inventory_id", inventoryId)
        .eq("scope", scope);

      if (error) throw error;

      const sum = (data || []).reduce(
        (acc, row) => ({
          co2_equivalent: acc.co2_equivalent + (Number(row.co2_equivalent) || 0),
          biogenic_co2: acc.biogenic_co2 + (Number(row.biogenic_co2) || 0),
        }),
        { co2_equivalent: 0, biogenic_co2: 0 }
      );

      return sum;
    },

    async sumByInventory(inventoryId: string) {
      const scope1 = await this.sumByScope(inventoryId, 1);
      const scope2 = await this.sumByScope(inventoryId, 2);
      const scope3 = await this.sumByScope(inventoryId, 3);

      return { scope1, scope2, scope3 };
    },
  },

  // Audit Logs
  auditLogs: {
    async create(log: Partial<AuditLog>) {
      const { data, error } = await getDb()
        .from("audit_logs")
        .insert(log)
        .select()
        .single();
      if (error) throw error;
      return data as AuditLog;
    },
  },

  // Reports
  reports: {
    async findByInventory(inventoryId: string) {
      const { data, error } = await getDb()
        .from("reports")
        .select("*")
        .eq("inventory_id", inventoryId)
        .order("generated_at", { ascending: false });
      if (error) throw error;
      return data as Report[];
    },

    async create(report: Partial<Report>) {
      const { data, error } = await getDb()
        .from("reports")
        .insert(report)
        .select()
        .single();
      if (error) throw error;
      return data as Report;
    },
  },

  // Operational Units
  operationalUnits: {
    async findByOrganization(organizationId: string) {
      const { data, error } = await getDb()
        .from("operational_units")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_active", true);
      if (error) throw error;
      return data as OperationalUnit[];
    },
  },

  // Raw query for health check
  async healthCheck() {
    const { data, error } = await getDb().from("organizations").select("id").limit(1);
    return { connected: !error, error };
  },
};

export default db;
