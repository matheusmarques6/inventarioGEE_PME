"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Wind, Trash2, Loader2, AlertCircle } from "lucide-react";
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

const gasTypes = [
  { value: "R-410A", label: "R-410A (Ar condicionado)", gwp: 2088 },
  { value: "R-134a", label: "R-134a (Refrigeração)", gwp: 1300 },
  { value: "HFC-134a", label: "HFC-134a", gwp: 1300 },
  { value: "R-22", label: "R-22 / HCFC-22", gwp: 1760 },
  { value: "R-404A", label: "R-404A", gwp: 3922 },
  { value: "R-407C", label: "R-407C", gwp: 1774 },
  { value: "R-438A", label: "R-438A", gwp: 2265 },
  { value: "HFC-32", label: "HFC-32", gwp: 677 },
  { value: "HFC-125", label: "HFC-125", gwp: 3170 },
  { value: "SF6", label: "SF6", gwp: 23500 },
];

const sourceTypes = [
  { value: "Ar Condicionado", label: "Ar Condicionado" },
  { value: "Refrigeração", label: "Refrigeração Industrial" },
  { value: "Extintores", label: "Extintores de Incêndio" },
  { value: "Equipamento Elétrico", label: "Equipamentos Elétricos" },
  { value: "Processo Industrial", label: "Processo Industrial" },
  { value: "Veículos", label: "Veículos" },
];

interface ActivityRecord {
  id: string;
  sourceDescription: string;
  quantity: number;
  quantityUnit: string;
  month?: number;
  year: number;
  metadata?: {
    gasName?: string;
    gwp?: number;
  };
  emissionResults?: Array<{
    co2Equivalent: number;
  }>;
}

export default function FugitiveEmissionsPage() {
  const { currentInventory, isLoading: inventoryLoading } = useInventory();
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [sourceType, setSourceType] = useState("");
  const [gasType, setGasType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState("");

  const fetchRecords = useCallback(async () => {
    if (!currentInventory?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/scope1/fugitive?inventoryId=${currentInventory.id}`
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

    if (!sourceType || !gasType || !quantity) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const dateObj = date ? new Date(date) : new Date();
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;

      const response = await fetch("/api/scope1/fugitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId: currentInventory.id,
          sourceDescription: sourceType,
          gasName: gasType,
          quantity: parseFloat(quantity),
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
        description: `Emissões calculadas: ${result.calculatedEmissions?.totalTCO2e?.toFixed(2) || 0} tCO₂e`,
      });

      // Reset form
      setSourceType("");
      setGasType("");
      setQuantity("");
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
            <Wind className="h-6 w-6 text-purple-500" />
            Emissões Fugitivas
          </h1>
          <p className="text-muted-foreground">
            Gases refrigerantes e vazamentos - {currentInventory.name}
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
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="py-4">
          <p className="text-sm text-purple-800">
            <strong>Emissões fugitivas</strong> são liberações não intencionais de gases de efeito estufa,
            principalmente gases refrigerantes (HFCs, HCFCs) de sistemas de refrigeração e ar condicionado.
            Registre as recargas de gás realizadas durante o período de reporte.
          </p>
        </CardContent>
      </Card>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Registrar Emissão Fugitiva
          </CardTitle>
          <CardDescription>
            Adicione recargas de gases ou vazamentos identificados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Fonte *</Label>
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {sourceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Gás *</Label>
              <Select value={gasType} onValueChange={setGasType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {gasTypes.map((gas) => (
                    <SelectItem key={gas.value} value={gas.value}>
                      {gas.label} (GWP: {gas.gwp})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade (kg) *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
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
          <CardTitle>Registros de Emissões Fugitivas</CardTitle>
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
              <Wind className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum registro encontrado</p>
              <p className="text-sm">Use o formulário acima para adicionar dados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Gás</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">GWP</TableHead>
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
                    <TableCell>
                      {(record.metadata as { gasName?: string })?.gasName || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(record.quantity).toLocaleString("pt-BR")} {record.quantityUnit}
                    </TableCell>
                    <TableCell className="text-right">
                      {(record.metadata as { gwp?: number })?.gwp || "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {(record.emissionResults?.[0]?.co2Equivalent || 0).toFixed(2)}
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
