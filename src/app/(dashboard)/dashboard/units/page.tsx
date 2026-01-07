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
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Factory,
  TreePine,
  Building,
  Tractor,
  Truck,
  MapPin,
  BarChart3,
  Loader2,
  Check,
} from "lucide-react";

interface OperationalUnit {
  id: string;
  name: string;
  type: "INDUSTRIAL" | "FLORESTAL" | "ADMINISTRATIVO" | "AGRICOLA" | "LOGISTICO";
  state?: string | null;
  city?: string | null;
  address?: string | null;
  is_active: boolean;
  activityCount?: number;
  emissions?: {
    scope1: number;
    scope2: number;
    scope3: number;
    total: number;
  };
}

const UNIT_TYPES = {
  INDUSTRIAL: { label: "Industrial", icon: Factory, color: "text-red-500", bg: "bg-red-50" },
  FLORESTAL: { label: "Florestal", icon: TreePine, color: "text-green-600", bg: "bg-green-50" },
  ADMINISTRATIVO: { label: "Administrativo", icon: Building, color: "text-blue-500", bg: "bg-blue-50" },
  AGRICOLA: { label: "Agrícola", icon: Tractor, color: "text-amber-600", bg: "bg-amber-50" },
  LOGISTICO: { label: "Logístico", icon: Truck, color: "text-purple-500", bg: "bg-purple-50" },
};

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function UnitsPage() {
  const { currentInventory } = useInventory();
  const [units, setUnits] = useState<OperationalUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<OperationalUnit>>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newUnit, setNewUnit] = useState<Partial<OperationalUnit>>({
    name: "",
    type: "INDUSTRIAL",
    state: "",
    city: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<OperationalUnit | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const fetchUnits = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = currentInventory
        ? `/api/units?inventoryId=${currentInventory.id}&includeInactive=${showInactive}`
        : `/api/units?includeInactive=${showInactive}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setUnits(data.units || []);
      }
    } catch (error) {
      console.error("Error fetching units:", error);
      toast({
        title: "Erro ao carregar unidades",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentInventory, showInactive]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleStartEdit = (unit: OperationalUnit) => {
    setEditingId(unit.id);
    setEditData({ ...unit });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/units/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        toast({ title: "Unidade atualizada com sucesso" });
        setEditingId(null);
        setEditData({});
        fetchUnits();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atualizar");
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddNew = async () => {
    if (!newUnit.name?.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome da unidade.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUnit),
      });

      if (response.ok) {
        toast({ title: "Unidade criada com sucesso" });
        setIsAddingNew(false);
        setNewUnit({
          name: "",
          type: "INDUSTRIAL",
          state: "",
          city: "",
          is_active: true,
        });
        fetchUnits();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar");
      }
    } catch (error) {
      toast({
        title: "Erro ao criar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!unitToDelete) return;

    try {
      const response = await fetch(`/api/units/${unitToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({ title: "Unidade removida com sucesso" });
        fetchUnits();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erro ao remover");
      }
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setUnitToDelete(null);
    }
  };

  const totalEmissions = units.reduce((sum, u) => sum + (u.emissions?.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Unidades Operacionais</h1>
            <p className="text-muted-foreground">
              Gerencie as unidades da sua organização
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? "Ocultar inativos" : "Mostrar inativos"}
          </Button>
          <Button onClick={() => setIsAddingNew(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Unidade
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Unidades</p>
                <p className="text-2xl font-bold">{units.filter(u => u.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Emissões Totais</p>
                <p className="text-2xl font-bold">
                  {totalEmissions.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                  <span className="text-sm font-normal text-muted-foreground ml-1">tCO₂e</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Factory className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unidades Industriais</p>
                <p className="text-2xl font-bold">
                  {units.filter(u => u.type === "INDUSTRIAL" && u.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <MapPin className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estados</p>
                <p className="text-2xl font-bold">
                  {new Set(units.filter(u => u.state && u.is_active).map(u => u.state)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Units Table - Spreadsheet Style */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Planilha de Unidades</CardTitle>
          <CardDescription>
            Clique em uma linha para editar ou use o botão + para adicionar novas unidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-[250px] font-semibold">Nome</TableHead>
                    <TableHead className="w-[150px] font-semibold">Tipo</TableHead>
                    <TableHead className="w-[80px] font-semibold">UF</TableHead>
                    <TableHead className="w-[150px] font-semibold">Cidade</TableHead>
                    <TableHead className="w-[100px] text-right font-semibold">Registros</TableHead>
                    <TableHead className="w-[120px] text-right font-semibold">Emissões</TableHead>
                    <TableHead className="w-[80px] font-semibold">Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* New Unit Row */}
                  {isAddingNew && (
                    <TableRow className="bg-green-50/50">
                      <TableCell>
                        <Input
                          value={newUnit.name || ""}
                          onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                          placeholder="Nome da unidade"
                          className="h-9"
                          autoFocus
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={newUnit.type}
                          onValueChange={(v) => setNewUnit({ ...newUnit, type: v as OperationalUnit["type"] })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(UNIT_TYPES).map(([key, { label }]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={newUnit.state || ""}
                          onValueChange={(v) => setNewUnit({ ...newUnit, state: v || null })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="UF" />
                          </SelectTrigger>
                          <SelectContent>
                            {BRAZILIAN_STATES.map((state) => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={newUnit.city || ""}
                          onChange={(e) => setNewUnit({ ...newUnit, city: e.target.value })}
                          placeholder="Cidade"
                          className="h-9"
                        />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">-</TableCell>
                      <TableCell className="text-right text-muted-foreground">-</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Nova</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleAddNew}
                            disabled={saving}
                            className="h-8 w-8"
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setIsAddingNew(false)}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Existing Units */}
                  {units.map((unit) => {
                    const isEditing = editingId === unit.id;
                    const typeInfo = UNIT_TYPES[unit.type];
                    const TypeIcon = typeInfo?.icon || Building;

                    return (
                      <TableRow
                        key={unit.id}
                        className={`
                          ${!unit.is_active ? "opacity-50 bg-gray-50" : ""}
                          ${isEditing ? "bg-blue-50/50" : "hover:bg-gray-50"}
                          cursor-pointer transition-colors
                        `}
                        onClick={() => !isEditing && handleStartEdit(unit)}
                      >
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editData.name || ""}
                              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                              className="h-9"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded ${typeInfo?.bg}`}>
                                <TypeIcon className={`h-4 w-4 ${typeInfo?.color}`} />
                              </div>
                              <span className="font-medium">{unit.name}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Select
                              value={editData.type}
                              onValueChange={(v) => setEditData({ ...editData, type: v as OperationalUnit["type"] })}
                            >
                              <SelectTrigger className="h-9" onClick={(e) => e.stopPropagation()}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(UNIT_TYPES).map(([key, { label }]) => (
                                  <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline" className={typeInfo?.bg}>
                              {typeInfo?.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Select
                              value={editData.state || ""}
                              onValueChange={(v) => setEditData({ ...editData, state: v || null })}
                            >
                              <SelectTrigger className="h-9" onClick={(e) => e.stopPropagation()}>
                                <SelectValue placeholder="UF" />
                              </SelectTrigger>
                              <SelectContent>
                                {BRAZILIAN_STATES.map((state) => (
                                  <SelectItem key={state} value={state}>{state}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-sm">{unit.state || "-"}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editData.city || ""}
                              onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                              className="h-9"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="text-sm">{unit.city || "-"}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {unit.activityCount || 0}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {unit.emissions?.total
                            ? unit.emissions.total.toLocaleString("pt-BR", { maximumFractionDigits: 1 })
                            : "0"
                          }
                        </TableCell>
                        <TableCell>
                          {unit.is_active ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="h-8 w-8"
                              >
                                {saving ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4 text-blue-600" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                className="h-8 w-8"
                              >
                                <X className="h-4 w-4 text-gray-500" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(unit);
                                }}
                                className="h-8 w-8"
                              >
                                <Pencil className="h-4 w-4 text-gray-500" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUnitToDelete(unit);
                                  setDeleteDialogOpen(true);
                                }}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* Empty State */}
                  {!isAddingNew && units.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Building2 className="h-8 w-8 opacity-50" />
                          <p>Nenhuma unidade cadastrada</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAddingNew(true)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar primeira unidade
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir unidade?</AlertDialogTitle>
            <AlertDialogDescription>
              {unitToDelete?.activityCount && unitToDelete.activityCount > 0 ? (
                <>
                  Esta unidade possui <strong>{unitToDelete.activityCount}</strong> registro(s)
                  de atividade associados. A unidade será desativada, mas os dados serão mantidos.
                </>
              ) : (
                "Esta ação não pode ser desfeita. A unidade será permanentemente removida."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
