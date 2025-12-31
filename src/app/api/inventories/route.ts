import { NextRequest, NextResponse } from "next/server";

// Mock data - no database required for now
const mockInventories = [
  {
    id: "inv-001",
    organizationId: "org-001",
    name: "Inventário 2024",
    baseYear: 2024,
    reportingPeriod: "2024",
    gwpReference: "AR5",
    status: "DRAFT",
    consolidationApproach: "OPERATIONAL_CONTROL",
    includeScope1: true,
    includeScope2: true,
    includeScope3: false,
    totalEmissionsScope1: 1250.5,
    totalEmissionsScope2: 450.2,
    totalEmissionsScope3: 0,
    totalBiogenicEmissions: 50.0,
    totalRemovals: 100.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: {
      activityData: 15,
      emissionResults: 15,
    },
  },
  {
    id: "inv-002",
    organizationId: "org-001",
    name: "Inventário 2023",
    baseYear: 2023,
    reportingPeriod: "2023",
    gwpReference: "AR5",
    status: "PUBLISHED",
    consolidationApproach: "OPERATIONAL_CONTROL",
    includeScope1: true,
    includeScope2: true,
    includeScope3: true,
    totalEmissionsScope1: 1180.3,
    totalEmissionsScope2: 420.8,
    totalEmissionsScope3: 890.5,
    totalBiogenicEmissions: 45.0,
    totalRemovals: 95.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: {
      activityData: 42,
      emissionResults: 42,
    },
  },
];

// GET /api/inventories
export async function GET() {
  return NextResponse.json(mockInventories);
}

// POST /api/inventories
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newInventory = {
      id: `inv-${Date.now()}`,
      organizationId: "org-001",
      name: body.name || `Inventário ${body.baseYear}`,
      baseYear: body.baseYear,
      reportingPeriod: body.reportingPeriod || String(body.baseYear),
      gwpReference: body.gwpReference || "AR5",
      status: "DRAFT",
      consolidationApproach: body.consolidationApproach || "OPERATIONAL_CONTROL",
      includeScope1: body.includeScope1 ?? true,
      includeScope2: body.includeScope2 ?? true,
      includeScope3: body.includeScope3 ?? false,
      totalEmissionsScope1: 0,
      totalEmissionsScope2: 0,
      totalEmissionsScope3: 0,
      totalBiogenicEmissions: 0,
      totalRemovals: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: {
        activityData: 0,
        emissionResults: 0,
      },
    };

    return NextResponse.json(newInventory, { status: 201 });
  } catch (error) {
    console.error("Error creating inventory:", error);
    return NextResponse.json(
      { error: "Erro ao criar inventário" },
      { status: 500 }
    );
  }
}
