"use client";

import { useState, useEffect, useCallback } from "react";
import { useInventory } from "@/contexts/inventory-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck, AlertCircle, Info } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { ActivityDataGrid, ColumnDef, DataRow } from "@/components/data-grid/activity-data-grid";
import Link from "next/link";

// Fuel options for mobile combustion
const fuelOptions = [
  { value: "Gasolina Automotiva", label: "Gasolina" },
  { value: "Óleo Diesel", label: "Diesel" },
  { value: "Álcool Etílico Hidratado", label: "Etanol" },
  { value: "GLP", label: "GLP" },
  { value: "Biodiesel", label: "Biodiesel" },
  { value: "Gás Natural Veicular", label: "GNV" },
];

// Vehicle type options
const vehicleOptions = [
  { value: "Automóvel", label: "Automóvel" },
  { value: "Caminhão Leve", label: "Caminhão Leve" },
  { value: "Caminhão Pesado", label: "Caminhão Pesado" },
  { value: "Motocicleta", label: "Motocicleta" },
  { value: "Ônibus", label: "Ônibus" },
  { value: "Empilhadeira", label: "Empilhadeira" },
  { value: "Máquina Agrícola", label: "Máquina Agrícola" },
];

// Unit options
const unitOptions = [
  { value: "litros", label: "Litros" },
  { value: "m3", label: "m³" },
  { value: "kg", label: "kg" },
];

// Column definitions
const columns: ColumnDef[] = [
  {
    id: "sourceDescription",
    header: "Veículo/Frota",
    type: "select",
    options: vehicleOptions,
    width: "140px",
    required: true,
  },
  {
    id: "activityType",
    header: "Combustível",
    type: "select",
    options: fuelOptions,
    width: "120px",
    required: true,
  },
  {
    id: "quantity",
    header: "Quantidade",
    type: "number",
    width: "100px",
    required: true,
    placeholder: "0",
  },
  {
    id: "quantityUnit",
    header: "Unidade",
    type: "select",
    options: unitOptions,
    width: "90px",
    required: true,
  },
  {
    id: "month",
    header: "Mês",
    type: "month",
    width: "100px",
  },
  {
    id: "year",
    header: "Ano",
    type: "number",
    width: "80px",
    required: true,
  },
  {
    id: "notes",
    header: "Observações",
    type: "text",
    width: "150px",
    placeholder: "Opcional",
  },
  {
    id: "emissions",
    header: "tCO₂e",
    type: "readonly",
    width: "90px",
    format: (value) => {
      const num = Number(value) || 0;
      return num.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    },
  },
];

export default function MobileCombustionPage() {
  const { currentInventory, isLoading: inventoryLoading } = useInventory();
  const [activityData, setActivityData] = useState<DataRow[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const currentYear = new Date().getFullYear();

  const fetchActivityData = useCallback(async () => {
    if (!currentInventory) return;

    try {
      setIsLoadingData(true);
      const response = await fetch(
        `/api/scope1/mobile?inventoryId=${currentInventory.id}`
      );

      if (response.ok) {
        const data = await response.json();
        // Transform API data to grid format
        const gridData: DataRow[] = (data || []).map((row: Record<string, unknown>) => {
          const metadata = row.metadata as { fuelName?: string; vehicleCategory?: string } | undefined;
          return {
            id: row.id as string,
            sourceDescription: row.sourceDescription || metadata?.vehicleCategory || "",
            activityType: metadata?.fuelName || "",
            quantity: Number(row.quantity) || 0,
            quantityUnit: row.quantityUnit || "litros",
            month: row.month || undefined,
            year: Number(row.year) || currentYear,
            notes: row.notes || "",
            emissions: (row.emissionResults as Array<{ co2Equivalent: number }>)?.[0]?.co2Equivalent || 0,
          };
        });
        setActivityData(gridData);
      }
    } catch (error) {
      console.error("Error fetching activity data:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, [currentInventory, currentYear]);

  useEffect(() => {
    fetchActivityData();
  }, [fetchActivityData]);

  const handleSave = async (rows: DataRow[]): Promise<{ success: boolean; errors?: string[] }> => {
    if (!currentInventory) {
      return { success: false, errors: ["Nenhum inventário selecionado"] };
    }

    const errors: string[] = [];
    let successCount = 0;

    // Process each row individually through the mobile API
    for (const row of rows) {
      const isNew = String(row.id).startsWith("new-");

      try {
        if (isNew) {
          // Create new record via mobile API
          const vehicleType = String(row.sourceDescription || "").toLowerCase().includes("máquina") ||
                             String(row.sourceDescription || "").toLowerCase().includes("agrícola")
                             ? "offroad" : "road";

          const response = await fetch("/api/scope1/mobile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inventoryId: currentInventory.id,
              sourceDescription: row.sourceDescription || "Veículo",
              fuelName: row.activityType,
              quantity: Number(row.quantity),
              unit: row.quantityUnit || "litros",
              vehicleCategory: row.sourceDescription,
              vehicleType,
              year: Number(row.year) || currentYear,
              month: row.month ? Number(row.month) : undefined,
              dataSource: "Manual",
              notes: row.notes || undefined,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            errors.push(`Erro ao criar: ${error.error || "Erro desconhecido"}`);
          } else {
            successCount++;
          }
        } else {
          // Update existing record via bulk API
          const response = await fetch(
            `/api/inventories/${currentInventory.id}/activity-data/bulk`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                category: "MOBILE_COMBUSTION",
                scope: 1,
                data: [{
                  id: row.id,
                  sourceDescription: row.sourceDescription || undefined,
                  activityType: row.activityType,
                  quantity: Number(row.quantity),
                  quantityUnit: row.quantityUnit || "litros",
                  month: row.month ? Number(row.month) : undefined,
                  year: Number(row.year) || currentYear,
                  notes: row.notes || undefined,
                }],
              }),
            }
          );

          const result = await response.json();
          if (result.success > 0) {
            successCount++;
          } else if (result.errors?.length > 0) {
            errors.push(...result.errors);
          }
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Erro ao salvar");
      }
    }

    if (successCount > 0) {
      return { success: true };
    } else {
      return { success: false, errors: errors.length > 0 ? errors : ["Erro ao salvar dados"] };
    }
  };

  const handleDelete = async (ids: string[]): Promise<{ success: boolean; errors?: string[] }> => {
    if (!currentInventory) {
      return { success: false, errors: ["Nenhum inventário selecionado"] };
    }

    try {
      const response = await fetch(
        `/api/inventories/${currentInventory.id}/activity-data/bulk`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success > 0) {
        return { success: true };
      } else {
        return { success: false, errors: result.errors || ["Erro ao excluir dados"] };
      }
    } catch (error) {
      return { success: false, errors: [error instanceof Error ? error.message : "Erro ao excluir"] };
    }
  };

  if (inventoryLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!currentInventory) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Nenhum inventário selecionado</h3>
          <p className="text-muted-foreground">
            Crie ou selecione um inventário para adicionar dados.
          </p>
          <Link href="/dashboard/inventories/new">
            <Button>Criar Inventário</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const totalEmissions = activityData.reduce(
    (sum, row) => sum + Number(row.emissions || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-orange-100">
          <Truck className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Combustão Móvel</h1>
          <p className="text-muted-foreground">
            Escopo 1 - Frota de veículos próprios e arrendados
          </p>
        </div>
      </div>

      {/* Summary */}
      {activityData.length > 0 && (
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de emissões</p>
                <p className="text-2xl font-bold tabular-nums">
                  {totalEmissions.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                  <span className="text-sm font-normal text-muted-foreground ml-1">tCO₂e</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Registros</p>
                <p className="text-2xl font-bold tabular-nums">{activityData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Dados de Consumo
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
          <CardDescription>
            Adicione, edite ou exclua registros de consumo de combustível da frota.
            Clique em uma célula para editar. Use os checkboxes para seleção em massa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityDataGrid
            columns={columns}
            data={activityData}
            onSave={handleSave}
            onDelete={handleDelete}
            onRefresh={fetchActivityData}
            isLoading={isLoadingData}
            emptyMessage="Nenhum dado de combustão móvel registrado. Use 'Adicionar' para criar novos registros."
            defaultNewRow={{
              sourceDescription: "",
              activityType: "",
              quantity: 0,
              quantityUnit: "litros",
              year: currentYear,
              notes: "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
