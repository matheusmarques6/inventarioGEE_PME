import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/supabase-db";

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    database: {
      configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
    const supabase = getDb();

    // Test database connection and count organizations
    const { count: orgCount, error: orgError } = await supabase
      .from("organizations")
      .select("*", { count: "exact", head: true });

    if (orgError) throw orgError;
    checks.database.connected = true;
    checks.tables.organizations = orgCount || 0;

    // Count inventories
    const { count: invCount } = await supabase
      .from("inventories")
      .select("*", { count: "exact", head: true });
    checks.tables.inventories = invCount || 0;

    // Count users
    const { count: userCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });
    checks.tables.users = userCount || 0;

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
