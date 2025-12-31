import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

const updateInventorySchema = z.object({
  name: z.string().min(3).optional(),
  status: z
    .enum(["DRAFT", "IN_REVIEW", "SUBMITTED", "VERIFIED", "PUBLISHED"])
    .optional(),
  gwpReference: z.enum(["AR4", "AR5", "AR6"]).optional(),
  consolidationApproach: z
    .enum(["OPERATIONAL_CONTROL", "FINANCIAL_CONTROL", "EQUITY_SHARE"])
    .optional(),
  includeScope1: z.boolean().optional(),
  includeScope2: z.boolean().optional(),
  includeScope3: z.boolean().optional(),
});

// GET /api/inventories/[id] - Get single inventory
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const inventory = await prisma.inventory.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        activityData: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        emissionResults: {
          take: 10,
          orderBy: { calculatedAt: "desc" },
        },
        _count: {
          select: {
            activityData: true,
            emissionResults: true,
            reports: true,
          },
        },
      },
    });

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(inventory);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/inventories/[id] - Update inventory
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateInventorySchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check access
    const existingInventory = await prisma.inventory.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existingInventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    // Update inventory
    const inventory = await prisma.inventory.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        inventoryId: inventory.id,
        action: "UPDATE",
        entityType: "Inventory",
        entityId: inventory.id,
        userId: userId,
        userEmail: user.email,
        previousValue: existingInventory as unknown as Record<string, unknown>,
        newValue: inventory as unknown as Record<string, unknown>,
      },
    });

    return NextResponse.json(inventory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating inventory:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/inventories/[id] - Delete inventory
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can delete inventories" },
        { status: 403 }
      );
    }

    // Check access
    const existingInventory = await prisma.inventory.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existingInventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    // Delete inventory (cascades to activity data and results)
    await prisma.inventory.delete({
      where: { id },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        entityType: "Inventory",
        entityId: id,
        userId: userId,
        userEmail: user.email,
        previousValue: existingInventory as unknown as Record<string, unknown>,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting inventory:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
