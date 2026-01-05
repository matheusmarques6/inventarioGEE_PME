"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, TreePine, Leaf, TrendingDown, Trash2, Loader2, AlertCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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

const forestTypes = [
  { value: "planted", label: "Floresta Plantada" },
  { value: "native", label: "Floresta Nativa" },
  { value: "restoration", label: "Área em Restauração" },
];

const activityTypes = [
  { value: "growth", label: "Crescimento/Sequestro" },
  { value: "harvest", label: "Colheita" },
  { value: "deforestation", label: "Desmatamento" },
  { value: "fire", label: "Queimada/Incêndio" },
  { value: "planting", label: "Plantio" },
];

const species = [
  { value: "Eucalipto", label: "Eucalipto" },
  { value: "Pinus", label: "Pinus" },
  { value: "Acácia", label: "Acácia" },
  { value: "Teca", label: "Teca" },
];

const biomes = [
  { value: "Amazônia", label: "Amazônia" },
  { value: "Cerrado", label: "Cerrado" },
  { value: "Mata Atlântica", label: "Mata Atlântica" },
  { value: "Caatinga", label: "Caatinga" },
  { value: "Pantanal", label: "Pantanal" },
  { value: "Pampa", label: "Pampa" },
];

interface ActivityRecord {
  id: string;
  sourceDescription: string;
  quantity: number;
  quantityUnit: string;
  month?: number;
  year: number;
  metadata?: {
    forestType?: string;
    activityType?: string;
    species?: string;
    biome?: string;
    age?: number;
    isRemoval?: boolean;
  };
  emissionResults?: Array<{
    co2Equivalent: number;
    removals: number;
  }>;
}

export default function ForestPage() {
  const { currentInventory, isLoading: inventoryLoading } = useInventory();
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [forestType, setForestType] = useState("");
  const [activityType, setActivityType] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState("");
  const [selectedBiome, setSelectedBiome] = useState("");
  const [age, setAge] = useState("");
  const [area, setArea] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [description, setDescription] = useState("");

  const fetchRecords = useCallback(async () => {
    if (!currentInventory?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/scope1/forest?inventoryId=${currentInventory.id}`
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

    if (!forestType || !activityType || !area) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Validate species for planted forests
    if (forestType === "planted" && !selectedSpecies) {
      toast({
        title: "Erro",
        description: "Selecione a espécie para floresta plantada",
        variant: "destructive",
      });
      return;
    }

    // Validate biome for native forests
    if (forestType === "native" && !selectedBiome) {
      toast({
        title: "Erro",
        description: "Selecione o bioma para floresta nativa",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/scope1/forest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId: currentInventory.id,
          sourceDescription: description || `${forestTypes.find(f => f.value === forestType)?.label} - ${activityTypes.find(a => a.value === activityType)?.label}`,
          forestType,
          activityType,
          species: forestType === "planted" ? selectedSpecies : undefined,
          biome: forestType === "native" ? selectedBiome : undefined,
          age: age ? parseInt(age) : undefined,
          area: parseFloat(area),
          year: parseInt(year),
          dataSource: "Manual",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar");
      }

      const result = await response.json();

      const isRemoval = result.calculatedEmissions?.isRemoval;
      const value = Math.abs(result.calculatedEmissions?.totalTCO2e || 0);

      toast({
        title: "Registro adicionado",
        description: isRemoval
          ? `Remoções calculadas: ${value.toFixed(2)} tCO₂`
          : `Emissões calculadas: ${value.toFixed(2)} tCO₂e`,
      });

      // Reset form
      setForestType("");
      setActivityType("");
      setSelectedSpecies("");
      setSelectedBiome("");
      setAge("");
      setArea("");
      setDescription("");

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

  const totalRemovals = records.reduce((sum, r) => {
    const removals = r.emissionResults?.[0]?.removals || 0;
    return sum + (removals < 0 ? removals : 0);
  }, 0);

  const totalEmissions = records.reduce((sum, r) => {
    const co2e = r.emissionResults?.[0]?.co2Equivalent || 0;
    return sum + (co2e > 0 ? co2e : 0);
  }, 0);

  const netBalance = totalRemovals + totalEmissions;

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
            <TreePine className="h-6 w-6 text-green-600" />
            Florestas e Uso do Solo (LULUCF)
          </h1>
          <p className="text-muted-foreground">
            Mudanças no uso da terra, florestas e remoções de carbono - {currentInventory.name}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {records.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100">
                  <TrendingDown className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Remoções</p>
                  <p className="text-2xl font-bold text-green-700">
                    {Math.abs(totalRemovals).toFixed(2)} tCO₂
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-orange-100">
                  <Leaf className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-orange-600 font-medium">Emissões LULUCF</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {totalEmissions.toFixed(2)} tCO₂e
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${netBalance < 0 ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${netBalance < 0 ? "bg-blue-100" : "bg-red-100"}`}>
                  <TreePine className={`h-6 w-6 ${netBalance < 0 ? "text-blue-600" : "text-red-600"}`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${netBalance < 0 ? "text-blue-600" : "text-red-600"}`}>
                    Balanço Líquido
                  </p>
                  <p className={`text-2xl font-bold ${netBalance < 0 ? "text-blue-700" : "text-red-700"}`}>
                    {netBalance.toFixed(2)} tCO₂
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="py-4">
          <p className="text-sm text-green-800">
            <strong>LULUCF (Land Use, Land-Use Change and Forestry)</strong>: Este setor contabiliza
            as emissões e remoções de CO₂ associadas a mudanças no uso da terra e florestas.
            Florestas em crescimento sequestram carbono (remoções), enquanto desmatamento e
            queimadas geram emissões.
          </p>
        </CardContent>
      </Card>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Registrar Atividade Florestal
          </CardTitle>
          <CardDescription>
            Adicione dados de crescimento, colheita ou mudanças de uso do solo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Tipo de Floresta *</Label>
              <Select value={forestType} onValueChange={setForestType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {forestTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Atividade *</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {forestType === "planted" && (
              <div className="space-y-2">
                <Label>Espécie *</Label>
                <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {species.map((sp) => (
                      <SelectItem key={sp.value} value={sp.value}>
                        {sp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {forestType === "native" && (
              <div className="space-y-2">
                <Label>Bioma *</Label>
                <Select value={selectedBiome} onValueChange={setSelectedBiome}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {biomes.map((biome) => (
                      <SelectItem key={biome.value} value={biome.value}>
                        {biome.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {forestType === "planted" && (
              <div className="space-y-2">
                <Label>Idade (anos)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Área (hectares) *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Ano *</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label>Descrição (opcional)</Label>
              <Input
                placeholder="Ex: Plantio de eucalipto - Fazenda São João"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
          <CardTitle>Registros Florestais</CardTitle>
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
              <TreePine className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum registro encontrado</p>
              <p className="text-sm">Use o formulário acima para adicionar dados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Atividade</TableHead>
                  <TableHead className="text-right">Área (ha)</TableHead>
                  <TableHead className="text-right">Emissões/Remoções</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const metadata = record.metadata as {
                    forestType?: string;
                    activityType?: string;
                    species?: string;
                    biome?: string;
                    isRemoval?: boolean;
                  };
                  const removals = record.emissionResults?.[0]?.removals || 0;
                  const co2e = record.emissionResults?.[0]?.co2Equivalent || 0;
                  const isRemoval = removals < 0;
                  const value = isRemoval ? Math.abs(removals) : co2e;

                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.sourceDescription}
                        {metadata?.species && (
                          <span className="block text-sm text-muted-foreground">
                            {metadata.species}
                          </span>
                        )}
                        {metadata?.biome && (
                          <span className="block text-sm text-muted-foreground">
                            {metadata.biome}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {forestTypes.find((t) => t.value === metadata?.forestType)?.label ||
                            metadata?.forestType ||
                            "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {activityTypes.find((t) => t.value === metadata?.activityType)?.label ||
                          metadata?.activityType ||
                          "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(record.quantity).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={isRemoval ? "default" : "destructive"} className={isRemoval ? "bg-green-600" : ""}>
                          {isRemoval ? "-" : "+"}{value.toFixed(2)} tCO₂
                        </Badge>
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
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
