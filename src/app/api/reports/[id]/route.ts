import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/supabase-db";

// GET - Get a single report by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: report, error } = await getDb()
      .from("reports")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !report) {
      return NextResponse.json(
        { error: "Relatório não encontrado" },
        { status: 404 }
      );
    }

    // Parse the stored report data
    let reportData = null;
    try {
      if (report.file_url) {
        reportData = JSON.parse(report.file_url);
      }
    } catch {
      // If parsing fails, return the raw data
      reportData = report.file_url;
    }

    return NextResponse.json({
      id: report.id,
      type: report.type,
      format: report.format,
      fileName: report.file_name,
      generatedAt: report.created_at,
      reportData,
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Erro ao carregar relatório" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a report by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await getDb()
      .from("reports")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "Erro ao excluir relatório" },
      { status: 500 }
    );
  }
}
