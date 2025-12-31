import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// GET /api/auth/debug - Debug authentication status
export async function GET() {
  try {
    const supabase = await createClient();

    // Get user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Get session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    return NextResponse.json({
      success: true,
      hasUser: !!user,
      hasSession: !!session,
      userId: user?.id || null,
      userEmail: user?.email || null,
      sessionExpiry: session?.expires_at || null,
      userError: userError?.message || null,
      sessionError: sessionError?.message || null,
    });
  } catch (error) {
    console.error("Auth debug error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
