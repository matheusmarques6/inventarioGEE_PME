-- ============================================
-- SQL PARA SUPABASE - GEE INVENTORY
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER', 'AUDITOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "InventoryStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'SUBMITTED', 'VERIFIED', 'PUBLISHED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "GWPReference" AS ENUM ('AR4', 'AR5', 'AR6');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ConsolidationApproach" AS ENUM ('OPERATIONAL_CONTROL', 'FINANCIAL_CONTROL', 'EQUITY_SHARE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "UnitType" AS ENUM ('INDUSTRIAL', 'FLORESTAL', 'ADMINISTRATIVO', 'AGRICOLA', 'LOGISTICO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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

DO $$ BEGIN
    CREATE TYPE "DataQuality" AS ENUM ('PRIMARY', 'PRIMARY_THIRD', 'SECONDARY_CALC', 'SECONDARY_ASSUMED', 'EXTRAPOLATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "GasFamily" AS ENUM ('CO2', 'CH4', 'N2O', 'HFC', 'PFC', 'SF6', 'NF3', 'CFC', 'HCFC', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReportType" AS ENUM ('GHG_PROTOCOL', 'GRI', 'CDP', 'SBCE', 'EXECUTIVE_SUMMARY', 'CUSTOM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'XLSX', 'DOCX', 'JSON');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABELAS
-- ============================================

-- Organization
CREATE TABLE IF NOT EXISTS "Organization" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Organization_cnpj_key" ON "Organization"("cnpj");
CREATE INDEX IF NOT EXISTS "Organization_cnpj_idx" ON "Organization"("cnpj");

-- User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "supabaseId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_supabaseId_key" ON "User"("supabaseId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_organizationId_idx" ON "User"("organizationId");
CREATE INDEX IF NOT EXISTS "User_supabaseId_idx" ON "User"("supabaseId");

-- Inventory
CREATE TABLE IF NOT EXISTS "Inventory" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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
    "totalEmissionsScope1" DECIMAL(20,6),
    "totalEmissionsScope2" DECIMAL(20,6),
    "totalEmissionsScope3" DECIMAL(20,6),
    "totalBiogenicEmissions" DECIMAL(20,6),
    "totalRemovals" DECIMAL(20,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Inventory_organizationId_idx" ON "Inventory"("organizationId");
CREATE INDEX IF NOT EXISTS "Inventory_baseYear_idx" ON "Inventory"("baseYear");
CREATE INDEX IF NOT EXISTS "Inventory_status_idx" ON "Inventory"("status");

-- OperationalUnit
CREATE TABLE IF NOT EXISTS "OperationalUnit" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "UnitType" NOT NULL,
    "state" TEXT,
    "city" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalUnit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OperationalUnit_organizationId_idx" ON "OperationalUnit"("organizationId");

-- ActivityData
CREATE TABLE IF NOT EXISTS "ActivityData" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "inventoryId" TEXT NOT NULL,
    "unitId" TEXT,
    "category" "EmissionCategory" NOT NULL,
    "subcategory" TEXT,
    "scope" INTEGER NOT NULL,
    "sourceDescription" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "quantity" DECIMAL(20,6) NOT NULL,
    "quantityUnit" TEXT NOT NULL,
    "month" INTEGER,
    "year" INTEGER NOT NULL,
    "dataSource" TEXT,
    "dataQuality" "DataQuality" NOT NULL DEFAULT 'PRIMARY',
    "uncertainty" DECIMAL(5,4),
    "evidenceUrl" TEXT,
    "notes" TEXT,
    "emissionFactorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "ActivityData_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ActivityData_inventoryId_idx" ON "ActivityData"("inventoryId");
CREATE INDEX IF NOT EXISTS "ActivityData_category_idx" ON "ActivityData"("category");
CREATE INDEX IF NOT EXISTS "ActivityData_scope_idx" ON "ActivityData"("scope");

-- EmissionResult
CREATE TABLE IF NOT EXISTS "EmissionResult" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "inventoryId" TEXT NOT NULL,
    "activityDataId" TEXT NOT NULL,
    "co2Mass" DECIMAL(20,6),
    "ch4Mass" DECIMAL(20,6),
    "n2oMass" DECIMAL(20,6),
    "hfcMass" DECIMAL(20,6),
    "pfcMass" DECIMAL(20,6),
    "sf6Mass" DECIMAL(20,6),
    "nf3Mass" DECIMAL(20,6),
    "co2Equivalent" DECIMAL(20,6) NOT NULL,
    "biogenicCo2" DECIMAL(20,6),
    "removals" DECIMAL(20,6),
    "scope" INTEGER NOT NULL,
    "category" "EmissionCategory" NOT NULL,
    "isKyotoGas" BOOLEAN NOT NULL DEFAULT true,
    "uncertainty" DECIMAL(10,8),
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculationVersion" TEXT NOT NULL DEFAULT '1.0',
    "gwpReference" "GWPReference" NOT NULL,
    "factorsSnapshot" JSONB,

    CONSTRAINT "EmissionResult_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EmissionResult_inventoryId_idx" ON "EmissionResult"("inventoryId");
CREATE INDEX IF NOT EXISTS "EmissionResult_activityDataId_idx" ON "EmissionResult"("activityDataId");
CREATE INDEX IF NOT EXISTS "EmissionResult_scope_idx" ON "EmissionResult"("scope");

-- EmissionFactor
CREATE TABLE IF NOT EXISTS "EmissionFactor" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "co2Factor" DECIMAL(20,10),
    "ch4Factor" DECIMAL(20,10),
    "n2oFactor" DECIMAL(20,10),
    "factorUnit" TEXT NOT NULL,
    "activityUnit" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "reference" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "region" TEXT,
    "density" DECIMAL(10,6),
    "pci" DECIMAL(10,4),
    "energyContent" DECIMAL(10,6),
    "isRenewable" BOOLEAN NOT NULL DEFAULT false,
    "biofuelBlend" DECIMAL(5,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmissionFactor_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EmissionFactor_category_idx" ON "EmissionFactor"("category");
CREATE INDEX IF NOT EXISTS "EmissionFactor_name_idx" ON "EmissionFactor"("name");

-- GWPFactor
CREATE TABLE IF NOT EXISTS "GWPFactor" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "gasName" TEXT NOT NULL,
    "gasFormula" TEXT,
    "gasFamily" "GasFamily" NOT NULL,
    "gwpAR4" INTEGER,
    "gwpAR5" INTEGER,
    "gwpAR6" INTEGER,
    "isKyotoGas" BOOLEAN NOT NULL DEFAULT true,
    "isMontrealGas" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GWPFactor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GWPFactor_gasName_key" ON "GWPFactor"("gasName");
CREATE INDEX IF NOT EXISTS "GWPFactor_gasFamily_idx" ON "GWPFactor"("gasFamily");

-- Report
CREATE TABLE IF NOT EXISTS "Report" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "inventoryId" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "format" "ReportFormat" NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Report_inventoryId_idx" ON "Report"("inventoryId");

-- AuditLog
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuditLog_inventoryId_idx" ON "AuditLog"("inventoryId");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- ============================================
-- FOREIGN KEYS
-- ============================================

ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_organizationId_fkey";
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Inventory" DROP CONSTRAINT IF EXISTS "Inventory_organizationId_fkey";
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OperationalUnit" DROP CONSTRAINT IF EXISTS "OperationalUnit_organizationId_fkey";
ALTER TABLE "OperationalUnit" ADD CONSTRAINT "OperationalUnit_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ActivityData" DROP CONSTRAINT IF EXISTS "ActivityData_inventoryId_fkey";
ALTER TABLE "ActivityData" ADD CONSTRAINT "ActivityData_inventoryId_fkey"
    FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ActivityData" DROP CONSTRAINT IF EXISTS "ActivityData_unitId_fkey";
ALTER TABLE "ActivityData" ADD CONSTRAINT "ActivityData_unitId_fkey"
    FOREIGN KEY ("unitId") REFERENCES "OperationalUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ActivityData" DROP CONSTRAINT IF EXISTS "ActivityData_emissionFactorId_fkey";
ALTER TABLE "ActivityData" ADD CONSTRAINT "ActivityData_emissionFactorId_fkey"
    FOREIGN KEY ("emissionFactorId") REFERENCES "EmissionFactor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmissionResult" DROP CONSTRAINT IF EXISTS "EmissionResult_inventoryId_fkey";
ALTER TABLE "EmissionResult" ADD CONSTRAINT "EmissionResult_inventoryId_fkey"
    FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmissionResult" DROP CONSTRAINT IF EXISTS "EmissionResult_activityDataId_fkey";
ALTER TABLE "EmissionResult" ADD CONSTRAINT "EmissionResult_activityDataId_fkey"
    FOREIGN KEY ("activityDataId") REFERENCES "ActivityData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Report" DROP CONSTRAINT IF EXISTS "Report_inventoryId_fkey";
ALTER TABLE "Report" ADD CONSTRAINT "Report_inventoryId_fkey"
    FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_inventoryId_fkey";
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_inventoryId_fkey"
    FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================
-- DADOS INICIAIS - GWP FACTORS
-- ============================================

INSERT INTO "GWPFactor" ("gasName", "gasFormula", "gasFamily", "gwpAR4", "gwpAR5", "gwpAR6", "isKyotoGas", "isMontrealGas")
VALUES
    ('Carbon Dioxide', 'CO2', 'CO2', 1, 1, 1, true, false),
    ('Methane', 'CH4', 'CH4', 25, 28, 27, true, false),
    ('Nitrous Oxide', 'N2O', 'N2O', 298, 265, 273, true, false),
    ('Sulfur Hexafluoride', 'SF6', 'SF6', 22800, 23500, 25200, true, false),
    ('Nitrogen Trifluoride', 'NF3', 'NF3', 17200, 16100, 17400, true, false)
ON CONFLICT ("gasName") DO NOTHING;

-- ============================================
-- GRANT PERMISSIONS (para Supabase)
-- ============================================

-- Permitir acesso às tabelas pelo service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Fim do script
SELECT 'Schema criado com sucesso!' as status;
