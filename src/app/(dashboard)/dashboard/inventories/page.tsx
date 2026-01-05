"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, MoreHorizontal, FileText, Download, Loader2, AlertCircle, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "@/components/ui/use-toast";
import { useInventory } from "@/contexts/inventory-context";

interface Inventory {
  id: string;
  name: string | null;
  baseYear: number;
  status: string;
  gwpReference: string;
  includeScope1: boolean;
  includeScope2: boolean;
  includeScope3: boolean;
  totalEmissionsScope1: number | null;
  totalEmissionsScope2: number | null;
  totalEmissionsScope3: number | null;
  totalBiogenicEmissions: number | null;
  updatedAt: string;
  _count?: {
    activityData: number;
    emissionResults: number;
  };
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  DRAFT: { label: "Rascunho", variant: "secondary" },
  IN_REVIEW: { label: "Em Revisão", variant: "outline" },
  SUBMITTED: { label: "Submetido", variant: "outline" },
  VERIFIED: { label: "Verificado", variant: "default" },
  PUBLISHED: { label: "Publicado", variant: "default" },
};

export default function InventoriesPage() {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { setCurrentInventory, currentInventory } = useInventory();

  const fetchInventories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/inventories");
      if (response.ok) {
        const data = await response.json();
        setInventories(data);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os inventários",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching inventories:", error);
      toast({
        title: "Erro",
        description: "Erro de conexão ao carregar inventários",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventories();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/inventories/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({ title: "Inventário excluído com sucesso" });
        fetchInventories();
        // If deleted the current inventory, clear selection
        if (currentInventory?.id === id) {
          setCurrentInventory(null);
        }
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao excluir",
          description: error.error || "Tente novamente",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de conexão",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectInventory = (inventory: Inventory) => {
    setCurrentInventory({
      id: inventory.id,
      name: inventory.name || `Inventário ${inventory.baseYear}`,
      baseYear: inventory.baseYear,
      status: inventory.status,
      gwpReference: inventory.gwpReference,
      includeScope1: inventory.includeScope1,
      includeScope2: inventory.includeScope2,
      includeScope3: inventory.includeScope3,
      totalEmissionsScope1: inventory.totalEmissionsScope1 ?? undefined,
      totalEmissionsScope2: inventory.totalEmissionsScope2 ?? undefined,
      totalEmissionsScope3: inventory.totalEmissionsScope3 ?? undefined,
    });
    toast({
      title: "Inventário selecionado",
      description: `${inventory.name || `Inventário ${inventory.baseYear}`} está ativo`,
    });
  };

  const getTotalEmissions = (inv: Inventory) => {
    return (
      (Number(inv.totalEmissionsScope1) || 0) +
      (Number(inv.totalEmissionsScope2) || 0) +
      (Number(inv.totalEmissionsScope3) || 0)
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventários</h1>
          <p className="text-muted-foreground">
            Gerencie seus inventários de emissões de GEE
          </p>
        </div>
        <Link href="/dashboard/inventories/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Inventário
          </Button>
        </Link>
      </div>

      {/* Inventories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Todos os Inventários</CardTitle>
          <CardDescription>
            Lista de todos os inventários da sua organização
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inventories.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum inventário encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro inventário para começar a registrar emissões
              </p>
              <Link href="/dashboard/inventories/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Inventário
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Ano Base</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Escopo 1</TableHead>
                  <TableHead className="text-right">Escopo 2</TableHead>
                  <TableHead className="text-right">Escopo 3</TableHead>
                  <TableHead className="text-right">Total (tCO₂e)</TableHead>
                  <TableHead>Registros</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventories.map((inventory) => (
                  <TableRow
                    key={inventory.id}
                    className={currentInventory?.id === inventory.id ? "bg-primary/5" : ""}
                  >
                    <TableCell>
                      <button
                        onClick={() => handleSelectInventory(inventory)}
                        className="font-medium hover:underline text-left"
                      >
                        {inventory.name || `Inventário ${inventory.baseYear}`}
                        {currentInventory?.id === inventory.id && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Ativo
                          </Badge>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>{inventory.baseYear}</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[inventory.status]?.variant || "secondary"}>
                        {statusConfig[inventory.status]?.label || inventory.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(inventory.totalEmissionsScope1 || 0).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(inventory.totalEmissionsScope2 || 0).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(inventory.totalEmissionsScope3 || 0).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {getTotalEmissions(inventory).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {inventory._count?.activityData || 0} atividades
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleSelectInventory(inventory)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Selecionar
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/dashboard/reports">
                              <Download className="mr-2 h-4 w-4" />
                              Gerar Relatório
                            </Link>
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir inventário?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. Todos os dados de atividade e
                                  emissões associados serão permanentemente removidos.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(inventory.id)}
                                  className="bg-destructive text-destructive-foreground"
                                  disabled={deletingId === inventory.id}
                                >
                                  {deletingId === inventory.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Excluir"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
