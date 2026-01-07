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
import { Factory, AlertCircle, FileSpreadsheet, Info } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getStationaryFuelTypes } from "@/lib/calculation-engine/calculators/stationary";
import { ExcelImportModal } from "@/components/import/excel-import-modal";
import { findFuelName } from "@/lib/constants/emission-factors";
import { ActivityDataGrid, ColumnDef, DataRow } from "@/components/data-grid/activity-data-grid";
import Link from "next/link";

// Get fuel types for dropdown options
const fuelTypes = getStationaryFuelTypes();
const fuelOptions = fuelTypes.map(fuel => ({ value: fuel, label: fuel }));

// Unit options by fuel type
const unitsByFuel: Record<string, string[]> = {
  "Gás Natural": ["m³", "GJ"],
  "GLP": ["m³", "kg", "L"],
  "Óleo Diesel": ["L", "m³", "kg"],
  "Gasolina Automotiva": ["L", "m³"],
  "Álcool Etílico Anidro": ["L", "m³"],
  "Álcool Etílico Hidratado": ["L", "m³"],
  "Biodiesel": ["L", "m³"],
  "Biomassa": ["t", "kg"],
  "Lenha": ["t", "kg", "m³"],
  "Carvão Mineral": ["t", "kg"],
  "Carvão Vegetal": ["t", "kg"],
  "Bagaço de Cana": ["t", "kg"],
  Default: ["L", "m³", "kg", "t", "GJ"],
};

// All unit options for grid
const allUnits = [...new Set(Object.values(unitsByFuel).flat())];
const unitOptions = allUnits.map(u => ({ value: u, label: u }));

// Column definitions for the data grid
const columns: ColumnDef[] = [
  {
    id: "sourceDescription",
    header: "Fonte/Equipamento",
    type: "text",
    width: "180px",
    placeholder: "Ex: Caldeira 01",
  },
  {
    id: "activityType",
    header: "Combustível",
    type: "select",
    options: fuelOptions,
    width: "150px",
    required: true,
  },
  {
    id: "quantity",
    header: "Quantidade",
    type: "number",
    width: "100px",
    required: true,
    placeholder: "0.00",
  },
  {
    id: "quantityUnit",
    header: "Unidade",
    type: "select",
    options: unitOptions,
    width: "80px",
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
      return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
  },
];

// Import fields configuration
const importFields = [
  { id: "sourceDescription", label: "Descrição da Fonte", required: false, description: "Ex: Caldeira 01, Gerador (opcional)" },
  { id: "activityType", label: "Combustível", required: true, description: "Gás Natural, GLP, Óleo Diesel, etc." },
  { id: "quantity", label: "Quantidade", required: true, description: "Valor numérico" },
  { id: "quantityUnit", label: "Unidade", required: true, description: "L, m³, kg, t, GJ" },
  { id: "month", label: "Mês", required: false, description: "1 a 12 (opcional)" },
  { id: "year", label: "Ano", required: false, description: "Ex: 2024" },
  { id: "notes", label: "Observações", required: false, description: "Opcional" },
];

// Template data
const templateData = [
  {
    "Descrição da Fonte": "Caldeira Industrial 01",
    "Combustível": "Gás Natural",
    "Quantidade": 1000,
    "Unidade": "m³",
    "Mês": 1,
    "Ano": 2024,
    "Observações": "",
  },
  {
    "Descrição da Fonte": "Gerador de Emergência",
    "Combustível": "Óleo Diesel",
    "Quantidade": 500,
    "Unidade": "L",
    "Mês": "",
    "Ano": 2024,
    "Observações": "",
  },
];

export default function StationaryCombustionPage() {
  const { currentInventory, isLoading: inventoryLoading } = useInventory();
  const [activityData, setActivityData] = useState<DataRow[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const currentYear = new Date().getFullYear();

  const fetchActivityData = useCallback(async () => {
    if (!currentInventory) return;

    try {
      setIsLoadingData(true);
      const response = await fetch(
        `/api/inventories/${currentInventory.id}/activity-data?category=STATIONARY_COMBUSTION&scope=1`
      );

      if (response.ok) {
        const result = await response.json();
        // Transform API data to grid format
        const gridData: DataRow[] = (result.data || []).map((row: Record<string, unknown>) => ({
          id: row.id as string,
          sourceDescription: row.sourceDescription || "",
          activityType: row.activityType || "",
          quantity: Number(row.quantity) || 0,
          quantityUnit: row.quantityUnit || "",
          month: row.month || undefined,
          year: Number(row.year) || currentYear,
          notes: row.notes || "",
          emissions: (row.emissionResults as Array<{ co2Equivalent: number }>)?.[0]?.co2Equivalent || 0,
        }));
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

    try {
      const response = await fetch(
        `/api/inventories/${currentInventory.id}/activity-data/bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "STATIONARY_COMBUSTION",
            scope: 1,
            data: rows.map(row => ({
              id: row.id,
              sourceDescription: row.sourceDescription || undefined,
              activityType: row.activityType,
              quantity: Number(row.quantity),
              quantityUnit: row.quantityUnit,
              month: row.month ? Number(row.month) : undefined,
              year: Number(row.year) || currentYear,
              notes: row.notes || undefined,
            })),
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success > 0) {
        return { success: true };
      } else {
        return { success: false, errors: result.errors || ["Erro ao salvar dados"] };
      }
    } catch (error) {
      return { success: false, errors: [error instanceof Error ? error.message : "Erro ao salvar"] };
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

  async function handleImport(data: Record<string, unknown>[]): Promise<{ success: number; errors: string[] }> {
    if (!currentInventory) {
      return { success: 0, errors: ["Nenhum inventário selecionado"] };
    }

    const errors: string[] = [];
    const validRows: {
      sourceDescription: string;
      activityType: string;
      quantity: number;
      quantityUnit: string;
      month: number | undefined;
      year: number;
      notes: string | undefined;
    }[] = [];

    data.forEach((row, index) => {
      const rowNum = index + 2;

      const rawFuelType = String(row.activityType || "").trim();

      if (!rawFuelType && !row.quantity && !row.quantityUnit) {
        return;
      }

      if (!rawFuelType) {
        errors.push(`Linha ${rowNum}: Combustível não informado`);
        return;
      }

      const matchedFuelType = findFuelName(rawFuelType);
      if (!matchedFuelType) {
        errors.push(`Linha ${rowNum}: Combustível "${rawFuelType}" não reconhecido`);
        return;
      }

      const quantity = Number(row.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        errors.push(`Linha ${rowNum}: Quantidade inválida`);
        return;
      }

      const unit = String(row.quantityUnit || "").trim();
      if (!unit) {
        errors.push(`Linha ${rowNum}: Unidade não informada`);
        return;
      }

      let month: number | undefined = undefined;
      if (row.month !== undefined && row.month !== null && row.month !== "") {
        const monthNum = Number(row.month);
        if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
          month = monthNum;
        }
      }

      let year = currentYear;
      if (row.year !== undefined && row.year !== null && row.year !== "") {
        const yearNum = Number(row.year);
        if (!isNaN(yearNum) && yearNum >= 2000 && yearNum <= 2100) {
          year = yearNum;
        }
      }

      validRows.push({
        sourceDescription: row.sourceDescription ? String(row.sourceDescription).trim() : `Importação linha ${rowNum}`,
        activityType: matchedFuelType,
        quantity,
        quantityUnit: unit,
        month,
        year,
        notes: row.notes ? String(row.notes).trim() : undefined,
      });
    });

    if (validRows.length === 0) {
      return { success: 0, errors: errors.length > 0 ? errors : ["Nenhuma linha válida"] };
    }

    try {
      const response = await fetch(
        `/api/inventories/${currentInventory.id}/activity-data/bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "STATIONARY_COMBUSTION",
            scope: 1,
            data: validRows,
          }),
        }
      );

      const result = await response.json();
      const allErrors = [...errors, ...(result.errors || [])];

      if (response.ok && result.success > 0) {
        fetchActivityData();
        toast({
          title: "Importação concluída",
          description: `${result.success} registro(s) importado(s).`,
        });
      }

      return { success: result.success || 0, errors: allErrors };
    } catch (error) {
      return { success: 0, errors: [...errors, error instanceof Error ? error.message : "Erro na importação"] };
    }
  }

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-100">
            <Factory className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Combustão Estacionária</h1>
            <p className="text-muted-foreground">
              Escopo 1 - Caldeiras, geradores, fornos industriais
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsImportModalOpen(true)}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Importar Planilha
        </Button>
      </div>

      {/* Import Modal */}
      <ExcelImportModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        title="Importar Dados de Combustão Estacionária"
        description="Importe dados de consumo de combustíveis a partir de uma planilha Excel"
        fields={importFields}
        templateData={templateData}
        templateFileName="modelo_combustao_estacionaria.xlsx"
        onImport={handleImport}
      />

      {/* Summary */}
      {activityData.length > 0 && (
        <Card className="gradient-scope1">
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
            Dados Registrados
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
          <CardDescription>
            Adicione, edite ou exclua registros diretamente na tabela abaixo.
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
            emptyMessage="Nenhum dado de combustão estacionária registrado. Use 'Adicionar' para criar novos registros."
            defaultNewRow={{
              sourceDescription: "",
              activityType: "",
              quantity: 0,
              quantityUnit: "",
              year: currentYear,
              notes: "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
