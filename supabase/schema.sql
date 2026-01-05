-- =====================================================
-- SCHEMA DO BANCO DE DADOS - INVENTÁRIO GEE PME
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'EDITOR', 'VIEWER', 'AUDITOR');
CREATE TYPE inventory_status AS ENUM ('DRAFT', 'IN_REVIEW', 'SUBMITTED', 'VERIFIED', 'PUBLISHED');
CREATE TYPE gwp_reference AS ENUM ('AR4', 'AR5', 'AR6');
CREATE TYPE consolidation_approach AS ENUM ('OPERATIONAL_CONTROL', 'FINANCIAL_CONTROL', 'EQUITY_SHARE');
CREATE TYPE unit_type AS ENUM ('INDUSTRIAL', 'FLORESTAL', 'ADMINISTRATIVO', 'AGRICOLA', 'LOGISTICO');
CREATE TYPE emission_category AS ENUM (
  'STATIONARY_COMBUSTION', 'MOBILE_COMBUSTION', 'FUGITIVE_EMISSIONS',
  'PROCESS_EMISSIONS', 'AGRICULTURAL', 'LULUCF', 'WASTE_INTERNAL',
  'PURCHASED_ELECTRICITY', 'PURCHASED_HEAT',
  'PURCHASED_GOODS', 'CAPITAL_GOODS', 'FUEL_ENERGY_ACTIVITIES',
  'UPSTREAM_TRANSPORT', 'DOWNSTREAM_TRANSPORT', 'WASTE_EXTERNAL',
  'BUSINESS_TRAVEL', 'EMPLOYEE_COMMUTING', 'LEASED_ASSETS', 'INVESTMENTS'
);
CREATE TYPE data_quality AS ENUM ('PRIMARY', 'PRIMARY_THIRD', 'SECONDARY_CALC', 'SECONDARY_ASSUMED', 'EXTRAPOLATED');
CREATE TYPE gas_family AS ENUM ('CO2', 'CH4', 'N2O', 'HFC', 'PFC', 'SF6', 'NF3', 'CFC', 'HCFC', 'OTHER');
CREATE TYPE report_type AS ENUM ('GHG_PROTOCOL', 'GRI', 'CDP', 'SBCE', 'EXECUTIVE_SUMMARY', 'CUSTOM');
CREATE TYPE report_format AS ENUM ('PDF', 'XLSX', 'DOCX', 'JSON');

-- =====================================================
-- TABELAS
-- =====================================================

-- Organizações
CREATE TABLE organizations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  sector TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_cnpj ON organizations(cnpj);

-- Usuários
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  supabase_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role DEFAULT 'VIEWER',
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_supabase ON users(supabase_id);

-- Inventários
CREATE TABLE inventories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT,
  base_year INTEGER NOT NULL,
  reporting_period TEXT NOT NULL,
  gwp_reference gwp_reference DEFAULT 'AR5',
  status inventory_status DEFAULT 'DRAFT',
  consolidation_approach consolidation_approach DEFAULT 'OPERATIONAL_CONTROL',
  include_scope1 BOOLEAN DEFAULT true,
  include_scope2 BOOLEAN DEFAULT true,
  include_scope3 BOOLEAN DEFAULT false,
  total_emissions_scope1 DECIMAL(20, 6),
  total_emissions_scope2 DECIMAL(20, 6),
  total_emissions_scope3 DECIMAL(20, 6),
  total_biogenic_emissions DECIMAL(20, 6),
  total_removals DECIMAL(20, 6),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ
);

CREATE INDEX idx_inventories_organization ON inventories(organization_id);
CREATE INDEX idx_inventories_base_year ON inventories(base_year);
CREATE INDEX idx_inventories_status ON inventories(status);

-- Unidades Operacionais
CREATE TABLE operational_units (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type unit_type NOT NULL,
  state TEXT,
  city TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_operational_units_organization ON operational_units(organization_id);

-- Fatores de Emissão
CREATE TABLE emission_factors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  co2_factor DECIMAL(20, 10),
  ch4_factor DECIMAL(20, 10),
  n2o_factor DECIMAL(20, 10),
  factor_unit TEXT NOT NULL,
  activity_unit TEXT NOT NULL,
  source TEXT NOT NULL,
  reference TEXT,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ,
  region TEXT,
  density DECIMAL(10, 6),
  pci DECIMAL(10, 4),
  energy_content DECIMAL(10, 6),
  is_renewable BOOLEAN DEFAULT false,
  biofuel_blend DECIMAL(5, 4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emission_factors_category ON emission_factors(category);
CREATE INDEX idx_emission_factors_name ON emission_factors(name);

-- Dados de Atividade
CREATE TABLE activity_data (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  inventory_id TEXT NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
  unit_id TEXT REFERENCES operational_units(id),
  category emission_category NOT NULL,
  subcategory TEXT,
  scope INTEGER NOT NULL,
  source_description TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  quantity DECIMAL(20, 6) NOT NULL,
  quantity_unit TEXT NOT NULL,
  month INTEGER,
  year INTEGER NOT NULL,
  data_source TEXT,
  data_quality data_quality DEFAULT 'PRIMARY',
  uncertainty DECIMAL(5, 4),
  evidence_url TEXT,
  notes TEXT,
  emission_factor_id TEXT REFERENCES emission_factors(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

CREATE INDEX idx_activity_data_inventory ON activity_data(inventory_id);
CREATE INDEX idx_activity_data_category ON activity_data(category);
CREATE INDEX idx_activity_data_scope ON activity_data(scope);

-- Resultados de Emissão
CREATE TABLE emission_results (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  inventory_id TEXT NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
  activity_data_id TEXT NOT NULL REFERENCES activity_data(id) ON DELETE CASCADE,
  co2_mass DECIMAL(20, 6),
  ch4_mass DECIMAL(20, 6),
  n2o_mass DECIMAL(20, 6),
  hfc_mass DECIMAL(20, 6),
  pfc_mass DECIMAL(20, 6),
  sf6_mass DECIMAL(20, 6),
  nf3_mass DECIMAL(20, 6),
  co2_equivalent DECIMAL(20, 6) NOT NULL,
  biogenic_co2 DECIMAL(20, 6),
  removals DECIMAL(20, 6),
  scope INTEGER NOT NULL,
  category emission_category NOT NULL,
  is_kyoto_gas BOOLEAN DEFAULT true,
  uncertainty DECIMAL(10, 8),
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  calculation_version TEXT DEFAULT '1.0',
  gwp_reference gwp_reference NOT NULL,
  factors_snapshot JSONB
);

CREATE INDEX idx_emission_results_inventory ON emission_results(inventory_id);
CREATE INDEX idx_emission_results_activity ON emission_results(activity_data_id);
CREATE INDEX idx_emission_results_scope ON emission_results(scope);

-- Fatores GWP
CREATE TABLE gwp_factors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  gas_name TEXT UNIQUE NOT NULL,
  gas_formula TEXT,
  gas_family gas_family NOT NULL,
  gwp_ar4 INTEGER,
  gwp_ar5 INTEGER,
  gwp_ar6 INTEGER,
  is_kyoto_gas BOOLEAN DEFAULT true,
  is_montreal_gas BOOLEAN DEFAULT false
);

CREATE INDEX idx_gwp_factors_family ON gwp_factors(gas_family);

-- Relatórios
CREATE TABLE reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  inventory_id TEXT NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
  type report_type NOT NULL,
  format report_format NOT NULL,
  file_url TEXT,
  file_name TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by TEXT
);

CREATE INDEX idx_reports_inventory ON reports(inventory_id);

-- Logs de Auditoria
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  inventory_id TEXT REFERENCES inventories(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  previous_value JSONB,
  new_value JSONB,
  user_id TEXT NOT NULL,
  user_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_inventory ON audit_logs(inventory_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- =====================================================
-- FUNÇÕES DE ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_inventories_updated_at BEFORE UPDATE ON inventories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_operational_units_updated_at BEFORE UPDATE ON operational_units FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_activity_data_updated_at BEFORE UPDATE ON activity_data FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_emission_factors_updated_at BEFORE UPDATE ON emission_factors FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- POLÍTICAS RLS (Row Level Security) - Opcional
-- =====================================================

-- Por enquanto deixamos RLS desabilitado para simplificar
-- ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ... etc

-- =====================================================
-- DADOS INICIAIS (SEED)
-- =====================================================

-- Inserir organização padrão
INSERT INTO organizations (id, name, cnpj, sector)
VALUES ('default-org', 'Minha Empresa', '00000000000000', 'outros')
ON CONFLICT (cnpj) DO NOTHING;
