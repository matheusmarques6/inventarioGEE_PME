"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Leaf, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useInventory } from "@/contexts/inventory-context";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

const fertilizerTypes = [
  { value: "urea", label: "Ureia", nitrogenContent: 0.46, isUrea: true },
  { value: "npk_06_30_06", label: "NPK 06-30-06", nitrogenContent: 0.06, isUrea: false },
  { value: "npk_12_00_36", label: "NPK 12-00-36", nitrogenContent: 0.12, isUrea: false },
  { value: "npk_15_05_30", label: "NPK 15-05-30", nitrogenContent: 0.15, isUrea: false },
  { value: "npk_04_19_36", label: "NPK 04-19-36", nitrogenContent: 0.04, isUrea: false },
  { value: "ammonium_sulfate", label: "Sulfato de Amônio", nitrogenContent: 0.21, isUrea: false },
  { value: "ammonium_nitrate", label: "Nitrato de Amônio", nitrogenContent: 0.33, isUrea: false },
  { value: "limestone_dolomitic", label: "Calcário Dolomítico", nitrogenContent: 0, isUrea: false, isLimestone: true, type: "dolomitic" },
  { value: "limestone_calcitic", label: "Calcário Calcítico", nitrogenContent: 0, isUrea: false, isLimestone: true, type: "calcitic" },
];

interface ActivityRecord {
  id: string;
  sourceDescription: string;
  quantity: number;
  quantityUnit: string;
  month?: number;
  year: number;
  metadata?: {
    fertilizerName?: string;
    nitrogenContent?: number;
    isUrea?: boolean;
  };
  emissionResults?: Array<{
    co2Equivalent: number;
  }>;
}

export default function FertilizerPage() {
  const { currentInventory, isLoading: inventoryLoading } = useInventory();
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [fertilizerType, setFertilizerType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [date, setDate] = useState("");

  const fetchRecords = useCallback(async () => {
    if (!currentInventory?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/scope1/fertilizer?inventoryId=${currentInventory.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentInventory?.id]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSubmit = async () => {
    if (!currentInventory?.id) {
      toast({
        title: "Erro",
        description: "Selecione um inventário primeiro",
        variant: "destructive",
      });
      return;
    }

    if (!fertilizerType || !quantity) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedFertilizer = fertilizerTypes.find(f => f.value === fertilizerType);
      if (!selectedFertilizer) throw new Error("Fertilizante não encontrado");

      const dateObj = date ? new Date(date) : new Date();
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;

      // Convert quantity to kg if needed
      let quantityKg = parseFloat(quantity);
      if (unit === "ton") {
        quantityKg = quantityKg * 1000;
      }

      const isLimestone = (selectedFertilizer as { isLimestone?: boolean }).isLimestone;

      const response = await fetch("/api/scope1/fertilizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId: currentInventory.id,
          sourceDescription: selectedFertilizer.label,
          fertilizerType: isLimestone ? "limestone" : "nitrogen",
          fertilizerName: selectedFertilizer.label,
          nitrogenContent: selectedFertilizer.nitrogenContent,
          isUrea: selectedFertilizer.isUrea,
          limestoneType: isLimestone ? (selectedFertilizer as { type?: string }).type : undefined,
          caoContent: isLimestone ? 0.3 : undefined,
          mgoContent: isLimestone && (selectedFertilizer as { type?: string }).type === "dolomitic" ? 0.12 : undefined,
          quantity: quantityKg,
          unit: "kg",
          year,
          month,
          dataSource: "Manual",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar");
      }

      const result = await response.json();

      toast({
        title: "Registro adicionado",
        description: `Emissões calculadas: ${result.calculatedEmissions?.totalTCO2e?.toFixed(4) || 0} tCO₂e`,
      });

      // Reset form
      setFertilizerType("");
      setQuantity("");
      setUnit("kg");
      setDate("");

      // Refresh records
      fetchRecords();
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentInventory?.id) return;

    setDeletingId(id);
    try {
      const response = await fetch(
        `/api/inventories/${currentInventory.id}/activity-data/${id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast({ title: "Registro excluído" });
        fetchRecords();
      } else {
        throw new Error("Erro ao excluir");
      }
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const totalEmissions = records.reduce(
    (sum, r) => sum + (r.emissionResults?.[0]?.co2Equivalent || 0),
    0
  );

  if (inventoryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Leaf className="h-6 w-6 text-green-500" />
            Fertilizantes e Calcário
          </h1>
          <p className="text-muted-foreground">
            Emissões de N2O e CO2 - {currentInventory.name}
          </p>
        </div>
        {records.length > 0 && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total de Emissões</p>
            <p className="text-2xl font-bold">{totalEmissions.toFixed(2)} <span className="text-sm font-normal">tCO₂e</span></p>
          </div>
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="py-4">
          <p className="text-sm text-green-800">
            <strong>Emissões Agrícolas:</strong> A aplicação de fertilizantes nitrogenados resulta em emissões de
            óxido nitroso (N2O) com GWP de 265. O calcário (calcítico/dolomítico) emite CO2 durante a correção do solo.
          </p>
        </CardContent>
      </Card>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Registrar Aplicação
          </CardTitle>
          <CardDescription>
            Adicione dados de uso de fertilizantes ou calcário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={fertilizerType} onValueChange={setFertilizerType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {fertilizerTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="ton">toneladas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registros</CardTitle>
          <CardDescription>
            {records.length} registro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Leaf className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum registro encontrado</p>
              <p className="text-sm">Use o formulário acima para adicionar dados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fertilizante/Calcário</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Teor N (%)</TableHead>
                  <TableHead className="text-right">Emissões (tCO2e)</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.sourceDescription}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(record.quantity).toLocaleString("pt-BR")} {record.quantityUnit}
                    </TableCell>
                    <TableCell className="text-right">
                      {((record.metadata as { nitrogenContent?: number })?.nitrogenContent || 0) * 100}%
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {(record.emissionResults?.[0]?.co2Equivalent || 0).toFixed(4)}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={deletingId === record.id}>
                            {deletingId === record.id ? (
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
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(record.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
