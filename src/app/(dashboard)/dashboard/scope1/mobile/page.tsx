"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Truck, Trash2, Loader2, AlertCircle } from "lucide-react";
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

const fuelTypes = [
  { value: "Gasolina Automotiva", label: "Gasolina Comum" },
  { value: "Óleo Diesel", label: "Diesel S10" },
  { value: "Álcool Etílico Hidratado", label: "Etanol" },
  { value: "GLP", label: "GLP" },
  { value: "Biodiesel", label: "Biodiesel" },
];

const vehicleTypes = [
  { value: "Automóvel", label: "Automóvel" },
  { value: "Caminhão Leve", label: "Caminhão Leve" },
  { value: "Caminhão Pesado", label: "Caminhão Pesado" },
  { value: "Motocicleta", label: "Motocicleta" },
  { value: "Ônibus", label: "Ônibus" },
  { value: "Empilhadeira", label: "Empilhadeira" },
  { value: "Máquina Agrícola", label: "Máquina Agrícola" },
];

interface ActivityRecord {
  id: string;
  sourceDescription: string;
  quantity: number;
  quantityUnit: string;
  month?: number;
  year: number;
  metadata?: {
    fuelName?: string;
    vehicleCategory?: string;
  };
  emissionResults?: Array<{
    co2Equivalent: number;
  }>;
}

export default function MobileCombustionPage() {
  const { currentInventory, isLoading: inventoryLoading } = useInventory();
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [vehicleType, setVehicleType] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [monthYear, setMonthYear] = useState("");

  const fetchRecords = useCallback(async () => {
    if (!currentInventory?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/scope1/mobile?inventoryId=${currentInventory.id}`
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

    if (!vehicleType || !fuelType || !quantity) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const [year, month] = monthYear ? monthYear.split("-").map(Number) : [new Date().getFullYear(), undefined];

      const response = await fetch("/api/scope1/mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId: currentInventory.id,
          sourceDescription: vehicleType,
          fuelName: fuelType,
          quantity: parseFloat(quantity),
          unit: "litros",
          vehicleCategory: vehicleType,
          vehicleType: vehicleType.toLowerCase().includes("máquina") || vehicleType.toLowerCase().includes("agrícola") ? "offroad" : "road",
          year: year || new Date().getFullYear(),
          month: month,
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
      setVehicleType("");
      setFuelType("");
      setQuantity("");
      setMonthYear("");

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

  const getMonthName = (month?: number) => {
    if (!month) return "Anual";
    const months = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return months[month];
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
            <Truck className="h-6 w-6 text-orange-500" />
            Combustão Móvel
          </h1>
          <p className="text-muted-foreground">
            Frota de veículos próprios e arrendados - {currentInventory.name}
          </p>
        </div>
        {records.length > 0 && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total de Emissões</p>
            <p className="text-2xl font-bold">{totalEmissions.toFixed(2)} <span className="text-sm font-normal">tCO₂e</span></p>
          </div>
        )}
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Consumo
          </CardTitle>
          <CardDescription>
            Registre o consumo de combustível da frota
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Tipo de Veículo *</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Combustível *</Label>
              <Select value={fuelType} onValueChange={setFuelType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypes.map((fuel) => (
                    <SelectItem key={fuel.value} value={fuel.value}>
                      {fuel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade (Litros) *</Label>
              <Input
                type="number"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Mês/Ano</Label>
              <Input
                type="month"
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
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
          <CardTitle>Registros de Consumo</CardTitle>
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
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum registro encontrado</p>
              <p className="text-sm">Use o formulário acima para adicionar dados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo/Frota</TableHead>
                  <TableHead>Combustível</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead>Período</TableHead>
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
                      {(record.metadata as { fuelName?: string })?.fuelName || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(record.quantity).toLocaleString("pt-BR")} {record.quantityUnit}
                    </TableCell>
                    <TableCell>
                      {getMonthName(record.month)} {record.year}
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
