"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useInventory } from "@/contexts/inventory-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { InventorySelector } from "@/components/dashboard/inventory-selector";
import { KPICards } from "@/components/dashboard/kpi-cards";
import {
  ArrowRight,
  Plus,
  Factory,
  Zap,
  Truck,
  Leaf,
  FileText,
  Clock,
} from "lucide-react";

interface ActivityCount {
  total: number;
  byCategory: Record<string, number>;
}

export default function DashboardPage() {
  const { currentInventory, isLoading } = useInventory();
  const [activityCount, setActivityCount] = useState<ActivityCount | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);

  useEffect(() => {
    async function fetchActivityCount() {
      if (!currentInventory) {
        setActivityCount(null);
        return;
      }

      try {
        setIsLoadingCount(true);
        const response = await fetch(
          `/api/inventories/${currentInventory.id}/activity-data?limit=1`
        );
        if (response.ok) {
          const data = await response.json();
          setActivityCount({
            total: data.pagination?.total || 0,
            byCategory: {},
          });
        }
      } catch (error) {
        console.error("Error fetching activity count:", error);
      } finally {
        setIsLoadingCount(false);
      }
    }

    fetchActivityCount();
  }, [currentInventory]);

  // Calculate completion percentage (simplified)
  const completedCategories = activityCount?.total ? Math.min(activityCount.total, 18) : 0;
  const totalCategories = 18;
  const progressPercent = Math.round((completedCategories / totalCategories) * 100);

  const quickActions = [
    {
      title: "Combustão Estacionária",
      description: "Caldeiras, geradores",
      href: "/dashboard/scope1/stationary",
      icon: Factory,
      color: "text-red-500",
      bgColor: "bg-red-50 hover:bg-red-100",
    },
    {
      title: "Eletricidade",
      description: "Consumo de energia",
      href: "/dashboard/scope2/electricity",
      icon: Zap,
      color: "text-blue-500",
      bgColor: "bg-blue-50 hover:bg-blue-100",
    },
    {
      title: "Frota de Veículos",
      description: "Combustão móvel",
      href: "/dashboard/scope1/mobile",
      icon: Truck,
      color: "text-orange-500",
      bgColor: "bg-orange-50 hover:bg-orange-100",
    },
    {
      title: "Florestas",
      description: "LULUCF e remoções",
      href: "/dashboard/scope1/forest",
      icon: Leaf,
      color: "text-green-600",
      bgColor: "bg-green-50 hover:bg-green-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu inventário de emissões
          </p>
        </div>
        <div className="flex items-center gap-3">
          <InventorySelector />
          <Link href="/dashboard/inventories/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Novo Inventário</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>
            Comece a adicionar dados ao seu inventário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Card className={`hover-lift cursor-pointer transition-all duration-200 border-0 ${action.bgColor}`}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                      <action.icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{action.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Inventory Status */}
      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ) : currentInventory ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {currentInventory.name}
                </CardTitle>
                <CardDescription>
                  Ano base: {currentInventory.baseYear} | GWP: {currentInventory.gwpReference}
                </CardDescription>
              </div>
              <Link href={`/dashboard/inventories/${currentInventory.id}`}>
                <Button variant="outline" size="sm">
                  Ver detalhes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <Badge
                  variant={currentInventory.status === "DRAFT" ? "secondary" : "success"}
                >
                  {currentInventory.status === "DRAFT" ? "Rascunho" :
                   currentInventory.status === "PUBLISHED" ? "Publicado" :
                   currentInventory.status === "VERIFIED" ? "Verificado" :
                   currentInventory.status}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Atualizado recentemente
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Progresso estimado</p>
                <p className="text-2xl font-bold tabular-nums">{progressPercent}%</p>
              </div>
            </div>

            <Progress value={progressPercent} className="h-2 mb-4" />

            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-muted-foreground">Registros</p>
                <p className="font-semibold text-lg tabular-nums">
                  {isLoadingCount ? (
                    <Skeleton className="h-6 w-12 mx-auto" />
                  ) : (
                    activityCount?.total || 0
                  )}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-muted-foreground">Escopos</p>
                <p className="font-semibold text-lg tabular-nums">
                  {[
                    currentInventory.includeScope1 && "1",
                    currentInventory.includeScope2 && "2",
                    currentInventory.includeScope3 && "3",
                  ]
                    .filter(Boolean)
                    .join(", ") || "1, 2"}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-muted-foreground">Referência</p>
                <p className="font-semibold text-lg">{currentInventory.gwpReference}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Nenhum inventário encontrado</h3>
              <p className="text-muted-foreground">
                Crie seu primeiro inventário para começar a registrar emissões.
              </p>
            </div>
            <Link href="/dashboard/inventories/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Criar Inventário
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
