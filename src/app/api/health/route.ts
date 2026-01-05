import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    database: {
      configured: !!process.env.DATABASE_URL,
      connected: false,
      error: null as string | null,
    },
    tables: {
      organizations: 0,
      inventories: 0,
      users: 0,
    },
  };

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    checks.database.connected = true;

    // Count records in main tables
    const [orgCount, invCount, userCount] = await Promise.all([
      prisma.organization.count(),
      prisma.inventory.count(),
      prisma.user.count(),
    ]);

    checks.tables.organizations = orgCount;
    checks.tables.inventories = invCount;
    checks.tables.users = userCount;

    return NextResponse.json({
      status: "healthy",
      ...checks,
    });
  } catch (error) {
    checks.database.error = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        status: "unhealthy",
        ...checks,
      },
      { status: 503 }
    );
  }
}
