-- ============================================
-- GEE INVENTORY - SUPABASE DATABASE MIGRATION
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

-- User Role
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER', 'AUDITOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Inventory Status
DO $$ BEGIN
    CREATE TYPE "InventoryStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'SUBMITTED', 'VERIFIED', 'PUBLISHED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- GWP Reference
DO $$ BEGIN
    CREATE TYPE "GWPReference" AS ENUM ('AR4', 'AR5', 'AR6');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Consolidation Approach
DO $$ BEGIN
    CREATE TYPE "ConsolidationApproach" AS ENUM ('OPERATIONAL_CONTROL', 'FINANCIAL_CONTROL', 'EQUITY_SHARE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Unit Type
DO $$ BEGIN
    CREATE TYPE "UnitType" AS ENUM ('INDUSTRIAL', 'FLORESTAL', 'ADMINISTRATIVO', 'AGRICOLA', 'LOGISTICO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Emission Category
DO $$ BEGIN
    CREATE TYPE "EmissionCategory" AS ENUM (
        'STATIONARY_COMBUSTION',
        'MOBILE_COMBUSTION',
        'FUGITIVE_EMISSIONS',
        'PROCESS_EMISSIONS',
        'AGRICULTURAL',
        'LULUCF',
        'WASTE_INTERNAL',
        'PURCHASED_ELECTRICITY',
        'PURCHASED_HEAT',
        'PURCHASED_GOODS',
        'CAPITAL_GOODS',
        'FUEL_ENERGY_ACTIVITIES',
        'UPSTREAM_TRANSPORT',
        'DOWNSTREAM_TRANSPORT',
        'WASTE_EXTERNAL',
        'BUSINESS_TRAVEL',
        'EMPLOYEE_COMMUTING',
        'LEASED_ASSETS',
        'INVESTMENTS'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Data Quality
DO $$ BEGIN
    CREATE TYPE "DataQuality" AS ENUM ('PRIMARY', 'PRIMARY_THIRD', 'SECONDARY_CALC', 'SECONDARY_ASSUMED', 'EXTRAPOLATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Gas Family
DO $$ BEGIN
    CREATE TYPE "GasFamily" AS ENUM ('CO2', 'CH4', 'N2O', 'HFC', 'PFC', 'SF6', 'NF3', 'CFC', 'HCFC', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Report Type
DO $$ BEGIN
    CREATE TYPE "ReportType" AS ENUM ('GHG_PROTOCOL', 'GRI', 'CDP', 'SBCE', 'EXECUTIVE_SUMMARY', 'CUSTOM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Report Format
DO $$ BEGIN
    CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'XLSX', 'DOCX', 'JSON');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- FUNÇÃO PARA GERAR CUID
-- ============================================

CREATE OR REPLACE FUNCTION generate_cuid()
RETURNS TEXT AS $$
DECLARE
    timestamp_part TEXT;
    random_part TEXT;
BEGIN
    timestamp_part := lpad(to_hex(floor(extract(epoch from now()) * 1000)::bigint), 12, '0');
    random_part := lpad(to_hex(floor(random() * 4294967295)::bigint), 8, '0') ||
                   lpad(to_hex(floor(random() * 4294967295)::bigint), 8, '0');
    RETURN 'c' || substring(timestamp_part from 1 for 8) || substring(random_part from 1 for 16);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABELAS
-- ============================================

-- Organization
CREATE TABLE IF NOT EXISTS "Organization" (
    "id" TEXT PRIMARY KEY DEFAULT generate_cuid(),
    "name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL UNIQUE,
    "sector" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Organization_cnpj_idx" ON "Organization"("cnpj");

-- User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY DEFAULT generate_cuid(),
    "supabaseId" TEXT NOT NULL UNIQUE,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "User_organizationId_idx" ON "User"("organizationId");
CREATE INDEX IF NOT EXISTS "User_supabaseId_idx" ON "User"("supabaseId");

-- Inventory
CREATE TABLE IF NOT EXISTS "Inventory" (
    "id" TEXT PRIMARY KEY DEFAULT generate_cuid(),
    "organizationId" TEXT NOT NULL,
    "name" TEXT,
    "baseYear" INTEGER NOT NULL,
    "reportingPeriod" TEXT NOT NULL,
    "gwpReference" "GWPReference" NOT NULL DEFAULT 'AR5',
    "status" "InventoryStatus" NOT NULL DEFAULT 'DRAFT',
    "consolidationApproach" "ConsolidationApproach" NOT NULL DEFAULT 'OPERATIONAL_CONTROL',
    "includeScope1" BOOLEAN NOT NULL DEFAULT true,
    "includeScope2" BOOLEAN NOT NULL DEFAULT true,
    "includeScope3" BOOLEAN NOT NULL DEFAULT false,
    "totalEmissionsScope1" DECIMAL(20, 6),
    "totalEmissionsScope2" DECIMAL(20, 6),
    "totalEmissionsScope3" DECIMAL(20, 6),
    "totalBiogenicEmissions" DECIMAL(20, 6),
    "totalRemovals" DECIMAL(20, 6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    CONSTRAINT "Inventory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Inventory_organizationId_idx" ON "Inventory"("organizationId");
CREATE INDEX IF NOT EXISTS "Inventory_baseYear_idx" ON "Inventory"("baseYear");
CREATE INDEX IF NOT EXISTS "Inventory_status_idx" ON "Inventory"("status");

-- OperationalUnit
CREATE TABLE IF NOT EXISTS "OperationalUnit" (
    "id" TEXT PRIMARY KEY DEFAULT generate_cuid(),
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "UnitType" NOT NULL,
    "state" TEXT,
    "city" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationalUnit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "OperationalUnit_organizationId_idx" ON "OperationalUnit"("organizationId");

-- EmissionFactor
CREATE TABLE IF NOT EXISTS "EmissionFactor" (
    "id" TEXT PRIMARY KEY DEFAULT generate_cuid(),
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "co2Factor" DECIMAL(20, 10),
    "ch4Factor" DECIMAL(20, 10),
    "n2oFactor" DECIMAL(20, 10),
    "factorUnit" TEXT NOT NULL,
    "activityUnit" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "reference" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "region" TEXT,
    "density" DECIMAL(10, 6),
    "pci" DECIMAL(10, 4),
    "energyContent" DECIMAL(10, 6),
    "isRenewable" BOOLEAN NOT NULL DEFAULT false,
    "biofuelBlend" DECIMAL(5, 4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "EmissionFactor_category_idx" ON "EmissionFactor"("category");
CREATE INDEX IF NOT EXISTS "EmissionFactor_name_idx" ON "EmissionFactor"("name");

-- ActivityData
CREATE TABLE IF NOT EXISTS "ActivityData" (
    "id" TEXT PRIMARY KEY DEFAULT generate_cuid(),
    "inventoryId" TEXT NOT NULL,
    "unitId" TEXT,
    "category" "EmissionCategory" NOT NULL,
    "subcategory" TEXT,
    "scope" INTEGER NOT NULL,
    "sourceDescription" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "quantity" DECIMAL(20, 6) NOT NULL,
    "quantityUnit" TEXT NOT NULL,
    "month" INTEGER,
    "year" INTEGER NOT NULL,
    "dataSource" TEXT,
    "dataQuality" "DataQuality" NOT NULL DEFAULT 'PRIMARY',
    "uncertainty" DECIMAL(5, 4),
    "evidenceUrl" TEXT,
    "notes" TEXT,
    "emissionFactorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    CONSTRAINT "ActivityData_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityData_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "OperationalUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActivityData_emissionFactorId_fkey" FOREIGN KEY ("emissionFactorId") REFERENCES "EmissionFactor"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ActivityData_inventoryId_idx" ON "ActivityData"("inventoryId");
CREATE INDEX IF NOT EXISTS "ActivityData_category_idx" ON "ActivityData"("category");
CREATE INDEX IF NOT EXISTS "ActivityData_scope_idx" ON "ActivityData"("scope");

-- EmissionResult
CREATE TABLE IF NOT EXISTS "EmissionResult" (
    "id" TEXT PRIMARY KEY DEFAULT generate_cuid(),
    "inventoryId" TEXT NOT NULL,
    "activityDataId" TEXT NOT NULL,
    "co2Mass" DECIMAL(20, 6),
    "ch4Mass" DECIMAL(20, 6),
    "n2oMass" DECIMAL(20, 6),
    "hfcMass" DECIMAL(20, 6),
    "pfcMass" DECIMAL(20, 6),
    "sf6Mass" DECIMAL(20, 6),
    "nf3Mass" DECIMAL(20, 6),
    "co2Equivalent" DECIMAL(20, 6) NOT NULL,
    "biogenicCo2" DECIMAL(20, 6),
    "removals" DECIMAL(20, 6),
    "scope" INTEGER NOT NULL,
    "category" "EmissionCategory" NOT NULL,
    "isKyotoGas" BOOLEAN NOT NULL DEFAULT true,
    "uncertainty" DECIMAL(10, 8),
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculationVersion" TEXT NOT NULL DEFAULT '1.0',
    "gwpReference" "GWPReference" NOT NULL,
    "factorsSnapshot" JSONB,
    CONSTRAINT "EmissionResult_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmissionResult_activityDataId_fkey" FOREIGN KEY ("activityDataId") REFERENCES "ActivityData"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "EmissionResult_inventoryId_idx" ON "EmissionResult"("inventoryId");
CREATE INDEX IF NOT EXISTS "EmissionResult_activityDataId_idx" ON "EmissionResult"("activityDataId");
CREATE INDEX IF NOT EXISTS "EmissionResult_scope_idx" ON "EmissionResult"("scope");

-- GWPFactor
CREATE TABLE IF NOT EXISTS "GWPFactor" (
    "id" TEXT PRIMARY KEY DEFAULT generate_cuid(),
    "gasName" TEXT NOT NULL UNIQUE,
    "gasFormula" TEXT,
    "gasFamily" "GasFamily" NOT NULL,
    "gwpAR4" INTEGER,
    "gwpAR5" INTEGER,
    "gwpAR6" INTEGER,
    "isKyotoGas" BOOLEAN NOT NULL DEFAULT true,
    "isMontrealGas" BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS "GWPFactor_gasFamily_idx" ON "GWPFactor"("gasFamily");

-- Report
CREATE TABLE IF NOT EXISTS "Report" (
    "id" TEXT PRIMARY KEY DEFAULT generate_cuid(),
    "inventoryId" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "format" "ReportFormat" NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT,
    CONSTRAINT "Report_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Report_inventoryId_idx" ON "Report"("inventoryId");

-- AuditLog
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT PRIMARY KEY DEFAULT generate_cuid(),
    "inventoryId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AuditLog_inventoryId_idx" ON "AuditLog"("inventoryId");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas com updatedAt
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY['Organization', 'User', 'Inventory', 'OperationalUnit', 'EmissionFactor', 'ActivityData']) LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%s_updated_at ON "%s";
            CREATE TRIGGER update_%s_updated_at
                BEFORE UPDATE ON "%s"
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', lower(t), t, lower(t), t);
    END LOOP;
END $$;

-- ============================================
-- DADOS INICIAIS - GWP FACTORS
-- ============================================

INSERT INTO "GWPFactor" ("gasName", "gasFormula", "gasFamily", "gwpAR4", "gwpAR5", "gwpAR6", "isKyotoGas", "isMontrealGas")
VALUES
    ('CO2', 'CO₂', 'CO2', 1, 1, 1, true, false),
    ('CH4', 'CH₄', 'CH4', 25, 28, 27, true, false),
    ('N2O', 'N₂O', 'N2O', 298, 265, 273, true, false),
    ('SF6', 'SF₆', 'SF6', 22800, 23500, 25200, true, false),
    ('NF3', 'NF₃', 'NF3', 17200, 16100, 17400, true, false),
    ('HFC-23', 'CHF₃', 'HFC', 14800, 12400, 14600, true, false),
    ('HFC-32', 'CH₂F₂', 'HFC', 675, 677, 771, true, false),
    ('HFC-125', 'CHF₂CF₃', 'HFC', 3500, 3170, 3740, true, false),
    ('HFC-134a', 'CH₂FCF₃', 'HFC', 1430, 1300, 1530, true, false),
    ('HFC-143a', 'CH₃CF₃', 'HFC', 4470, 4800, 5810, true, false),
    ('HFC-152a', 'CH₃CHF₂', 'HFC', 124, 138, 164, true, false),
    ('HFC-227ea', 'CF₃CHFCF₃', 'HFC', 3220, 3350, 3600, true, false),
    ('HFC-245fa', 'CHF₂CH₂CF₃', 'HFC', 1030, 858, 962, true, false),
    ('PFC-14', 'CF₄', 'PFC', 7390, 6630, 7380, true, false),
    ('PFC-116', 'C₂F₆', 'PFC', 12200, 11100, 12400, true, false),
    ('PFC-218', 'C₃F₈', 'PFC', 8830, 8900, 9290, true, false),
    ('R-410A', NULL, 'HFC', 2088, 1924, 2256, true, false),
    ('R-407C', NULL, 'HFC', 1774, 1624, 1907, true, false),
    ('R-404A', NULL, 'HFC', 3922, 3943, 4728, true, false)
ON CONFLICT ("gasName") DO NOTHING;

-- ============================================
-- RLS (Row Level Security) - OPCIONAL
-- Descomente se quiser habilitar segurança por linha
-- ============================================

-- ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Inventory" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "OperationalUnit" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "ActivityData" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "EmissionResult" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FINALIZAÇÃO
-- ============================================

-- Verificar se tudo foi criado corretamente
SELECT
    table_name,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
AND table_name IN ('Organization', 'User', 'Inventory', 'OperationalUnit', 'ActivityData', 'EmissionResult', 'EmissionFactor', 'GWPFactor', 'Report', 'AuditLog')
ORDER BY table_name;
