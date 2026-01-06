"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useInventory } from "@/contexts/inventory-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Factory, Trash2, AlertCircle, Loader2, FileSpreadsheet, Info } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getStationaryFuelTypes } from "@/lib/calculation-engine/calculators/stationary";
import { ExcelImportModal } from "@/components/import/excel-import-modal";
import { CalculationDetailsModal } from "@/components/calculation/calculation-details-modal";
import Link from "next/link";

const formSchema = z.object({
  sourceDescription: z.string().min(3, "Descrição é obrigatória"),
  activityType: z.string().min(1, "Combustível é obrigatório"),
  quantity: z.coerce.number().positive("Quantidade deve ser maior que zero"),
  quantityUnit: z.string().min(1, "Unidade é obrigatória"),
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2000).max(2100),
  dataSource: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EmissionResult {
  co2Equivalent: number;
  co2Mass?: number;
  ch4Mass?: number;
  n2oMass?: number;
  biogenicCo2?: number;
  factorsSnapshot?: {
    emissionFactor?: {
      name: string;
      co2: number;
      ch4: number;
      n2o: number;
      energyContent: number;
      unit: string;
      density?: number;
      renewable: boolean;
      source: string;
    };
    energyContent?: number;
    fossilFraction?: number;
    renewableFraction?: number;
  } | null;
}

interface ActivityDataRow {
  id: string;
  sourceDescription: string;
  activityType: string;
  quantity: number;
  quantityUnit: string;
  month?: number;
  year: number;
  emissionResults?: EmissionResult[];
}

const fuelTypes = getStationaryFuelTypes();

const units: Record<string, string[]> = {
  "Gás Natural": ["m\u00B3", "GJ"],
  GLP: ["m\u00B3", "kg", "L"],
  "Óleo Diesel": ["L", "m\u00B3", "kg"],
  "Gasolina Automotiva": ["L", "m\u00B3"],
  "Álcool Etílico Anidro": ["L", "m\u00B3"],
  "Álcool Etílico Hidratado": ["L", "m\u00B3"],
  Biodiesel: ["L", "m\u00B3"],
  Biomassa: ["t", "kg"],
  Lenha: ["t", "kg", "m\u00B3"],
  "Carvão Mineral": ["t", "kg"],
  "Carvão Vegetal": ["t", "kg"],
  "Bagaço de Cana": ["t", "kg"],
  Default: ["L", "m\u00B3", "kg", "t", "GJ"],
};

const months = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

// Import fields configuration - labels must match template column names
const importFields = [
  { id: "sourceDescription", label: "Descrição da Fonte", required: false, description: "Ex: Caldeira 01, Gerador" },
  { id: "activityType", label: "Combustível", required: true, description: "Gás Natural, GLP, Óleo Diesel, etc." },
  { id: "quantity", label: "Quantidade", required: true, description: "Valor numérico" },
  { id: "quantityUnit", label: "Unidade", required: true, description: "L, m³, kg, t, GJ" },
  { id: "month", label: "Mês", required: false, description: "1 a 12 (opcional)" },
  { id: "year", label: "Ano", required: false, description: "Ex: 2024" },
  { id: "notes", label: "Observações", required: false },
];

// Template data for download
const templateData = [
  {
    "Descrição da Fonte": "Caldeira Industrial 01",
    "Combustível": "Gás Natural",
    "Quantidade": 1000,
    "Unidade": "m³",
    "Mês": 1,
    "Ano": 2024,
    "Observações": "Consumo mensal",
  },
  {
    "Descrição da Fonte": "Gerador de Emergência",
    "Combustível": "Óleo Diesel",
    "Quantidade": 500,
    "Unidade": "L",
    "Mês": 1,
    "Ano": 2024,
    "Observações": "",
  },
  {
    "Descrição da Fonte": "Forno Industrial",
    "Combustível": "GLP",
    "Quantidade": 200,
    "Unidade": "kg",
    "Mês": 1,
    "Ano": 2024,
    "Observações": "",
  },
];

export default function StationaryCombustionPage() {
  const { currentInventory, isLoading: inventoryLoading } = useInventory();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFuel, setSelectedFuel] = useState<string>("");
  const [activityData, setActivityData] = useState<ActivityDataRow[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCalculation, setSelectedCalculation] = useState<ActivityDataRow | null>(null);
  const [isCalculationModalOpen, setIsCalculationModalOpen] = useState(false);

  const currentYear = new Date().getFullYear();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceDescription: "",
      activityType: "",
      quantity: 0,
      quantityUnit: "",
      year: currentYear,
      dataSource: "Manual",
      notes: "",
    },
  });

  const availableUnits = units[selectedFuel] || units.Default;

  const fetchActivityData = useCallback(async () => {
    if (!currentInventory) return;

    try {
      setIsLoadingData(true);
      const response = await fetch(
        `/api/inventories/${currentInventory.id}/activity-data?category=STATIONARY_COMBUSTION&scope=1`
      );

      if (response.ok) {
        const result = await response.json();
        setActivityData(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching activity data:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, [currentInventory]);

  useEffect(() => {
    fetchActivityData();
  }, [fetchActivityData]);

  async function onSubmit(data: FormData) {
    if (!currentInventory) {
      toast({
        title: "Erro",
        description: "Selecione um inventário primeiro.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/inventories/${currentInventory.id}/activity-data`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            category: "STATIONARY_COMBUSTION",
            scope: 1,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar dados");
      }

      const result = await response.json();

      toast({
        title: "Dados salvos com sucesso",
        description: `Emissões calculadas: ${Number(result.emissionResult?.co2Equivalent || 0).toFixed(2)} tCO₂e`,
      });

      form.reset({
        sourceDescription: "",
        activityType: "",
        quantity: 0,
        quantityUnit: "",
        year: currentYear,
        dataSource: "Manual",
        notes: "",
      });
      setSelectedFuel("");
      fetchActivityData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!currentInventory) return;

    setDeletingId(id);
    try {
      const response = await fetch(
        `/api/inventories/${currentInventory.id}/activity-data/${id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast({ title: "Registro excluído com sucesso" });
        fetchActivityData();
      } else {
        throw new Error("Erro ao excluir");
      }
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleImport(data: Record<string, unknown>[]): Promise<{ success: number; errors: string[] }> {
    if (!currentInventory) {
      return { success: 0, errors: ["Nenhum inventário selecionado"] };
    }

    // Helper to find matching fuel type (case-insensitive)
    const findFuelType = (input: string): string | null => {
      const inputLower = input.toLowerCase().trim();
      // Exact match first
      const exactMatch = fuelTypes.find(f => f.toLowerCase() === inputLower);
      if (exactMatch) return exactMatch;
      // Partial match
      const partialMatch = fuelTypes.find(f =>
        f.toLowerCase().includes(inputLower) || inputLower.includes(f.toLowerCase())
      );
      return partialMatch || null;
    };

    // Pre-validate and transform data
    const errors: string[] = [];
    const transformedData = data.map((row, index) => {
      const rowNum = index + 2; // Excel row (1-indexed + header)

      // Get and validate fuel type
      const rawFuelType = String(row.activityType || "").trim();
      const matchedFuelType = findFuelType(rawFuelType);

      if (!matchedFuelType && rawFuelType) {
        errors.push(`Linha ${rowNum}: Combustível "${rawFuelType}" não reconhecido. Use: ${fuelTypes.slice(0, 5).join(", ")}...`);
      }

      // Get quantity
      const quantity = Number(row.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        errors.push(`Linha ${rowNum}: Quantidade inválida "${row.quantity}"`);
      }

      // Get unit
      const unit = String(row.quantityUnit || "").trim();
      if (!unit) {
        errors.push(`Linha ${rowNum}: Unidade não informada`);
      }

      return {
        sourceDescription: String(row.sourceDescription || `Importação linha ${rowNum}`),
        activityType: matchedFuelType || rawFuelType,
        quantity: quantity,
        quantityUnit: unit,
        month: row.month ? Number(row.month) : undefined,
        year: row.year ? Number(row.year) : currentYear,
        notes: row.notes ? String(row.notes) : undefined,
      };
    });

    // If there are validation errors, show them but continue with valid rows
    if (errors.length === data.length) {
      return { success: 0, errors };
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
            data: transformedData.filter((_, i) => {
              // Only include rows without pre-validation errors
              const rowNum = i + 2;
              return !errors.some(e => e.startsWith(`Linha ${rowNum}:`));
            }),
          }),
        }
      );

      const result = await response.json();

      // Merge pre-validation errors with API errors
      const allErrors = [...errors, ...(result.errors || [])];

      if (response.ok && result.success > 0) {
        fetchActivityData();
        toast({
          title: "Importação concluída",
          description: `${result.success} registro(s) importado(s) com sucesso.`,
        });
      }

      return {
        success: result.success || 0,
        errors: allErrors,
      };
    } catch (error) {
      console.error("Import error:", error);
      return {
        success: 0,
        errors: [...errors, error instanceof Error ? error.message : "Erro na importação"],
      };
    }
  }

  if (inventoryLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[500px]" />
          <Skeleton className="h-[500px]" />
        </div>
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
            Crie ou selecione um inventário para adicionar dados de combustão estacionária.
          </p>
          <Link href="/dashboard/inventories/new">
            <Button>Criar Inventário</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const totalEmissions = activityData.reduce(
    (sum, row) => sum + Number(row.emissionResults?.[0]?.co2Equivalent || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
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

      {/* Summary Card */}
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Dados</CardTitle>
            <CardDescription>
              Registre o consumo de combustível em equipamentos estacionários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="sourceDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição da Fonte</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Caldeira Industrial 01" />
                      </FormControl>
                      <FormDescription>
                        Identifique o equipamento ou processo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="activityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Combustível</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedFuel(value);
                          form.setValue("quantityUnit", "");
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o combustível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fuelTypes.map((fuel) => (
                            <SelectItem key={fuel} value={fuel}>
                              {fuel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} placeholder="0.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantityUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Unidade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableUnits.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mês (opcional)</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(parseInt(v))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Anual" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {months.map((m) => (
                              <SelectItem key={m.value} value={m.value.toString()}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Informações adicionais..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Registro
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Existing Data */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Registrados</CardTitle>
            <CardDescription>
              Combustão estacionária no inventário {currentInventory.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : activityData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Factory className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum dado registrado ainda</p>
                <p className="text-sm">Use o formulário ao lado para adicionar dados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fonte</TableHead>
                      <TableHead>Combustível</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">tCO₂e</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityData.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="font-medium">{row.sourceDescription}</div>
                          <div className="text-sm text-muted-foreground">
                            {row.month ? `${months[row.month - 1]?.label}/` : ""}
                            {row.year}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.activityType}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {Number(row.quantity).toLocaleString("pt-BR")} {row.quantityUnit}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {Number(row.emissionResults?.[0]?.co2Equivalent || 0).toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedCalculation(row);
                                setIsCalculationModalOpen(true);
                              }}
                              title="Ver detalhes do cálculo"
                            >
                              <Info className="h-4 w-4 text-blue-500" />
                            </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={deletingId === row.id}
                              >
                                {deletingId === row.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O registro e suas emissões
                                  calculadas serão permanentemente removidos.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(row.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calculation Details Modal */}
      <CalculationDetailsModal
        open={isCalculationModalOpen}
        onOpenChange={setIsCalculationModalOpen}
        data={selectedCalculation ? {
          sourceDescription: selectedCalculation.sourceDescription,
          activityType: selectedCalculation.activityType,
          quantity: selectedCalculation.quantity,
          quantityUnit: selectedCalculation.quantityUnit,
          year: selectedCalculation.year,
          co2Equivalent: selectedCalculation.emissionResults?.[0]?.co2Equivalent,
          co2Mass: selectedCalculation.emissionResults?.[0]?.co2Mass,
          ch4Mass: selectedCalculation.emissionResults?.[0]?.ch4Mass,
          n2oMass: selectedCalculation.emissionResults?.[0]?.n2oMass,
          biogenicCo2: selectedCalculation.emissionResults?.[0]?.biogenicCo2,
          factorsSnapshot: selectedCalculation.emissionResults?.[0]?.factorsSnapshot,
        } : null}
      />
    </div>
  );
}
