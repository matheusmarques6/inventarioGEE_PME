"use client";

import { useEffect, useState } from "react";
import { useInventory } from "@/contexts/inventory-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingDown,
  TrendingUp,
  Factory,
  Zap,
  Truck,
  Leaf,
} from "lucide-react";

interface EmissionStats {
  totalEmissions: number;
  scope1: number;
  scope2: number;
  scope3: number;
  biogenic: number;
  removals: number;
  previousYear?: number;
}

export function KPICards() {
  const { currentInventory } = useInventory();
  const [stats, setStats] = useState<EmissionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!currentInventory) {
        setStats(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/inventories/${currentInventory.id}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          // Use inventory totals as fallback
          setStats({
            totalEmissions: Number(currentInventory.totalEmissionsScope1 || 0) +
                           Number(currentInventory.totalEmissionsScope2 || 0) +
                           Number(currentInventory.totalEmissionsScope3 || 0),
            scope1: Number(currentInventory.totalEmissionsScope1 || 0),
            scope2: Number(currentInventory.totalEmissionsScope2 || 0),
            scope3: Number(currentInventory.totalEmissionsScope3 || 0),
            biogenic: Number(currentInventory.totalBiogenicEmissions || 0),
            removals: Number(currentInventory.totalRemovals || 0),
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats({
          totalEmissions: 0,
          scope1: 0,
          scope2: 0,
          scope3: 0,
          biogenic: 0,
          removals: 0,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [currentInventory]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats || !currentInventory) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Selecione ou crie um inventário para ver as estatísticas
        </p>
      </Card>
    );
  }

  const percentChange = stats.previousYear
    ? ((stats.totalEmissions - stats.previousYear) / stats.previousYear * 100)
    : null;
  const isReduction = percentChange !== null && percentChange < 0;

  return (
    <>
      {/* Main KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="gradient-total hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Emissões Totais
            </CardTitle>
            {percentChange !== null && (
              isReduction ? (
                <TrendingDown className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-500" />
              )
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {stats.totalEmissions.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
              <span className="text-sm font-normal text-muted-foreground ml-1">tCO₂e</span>
            </div>
            {percentChange !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className={isReduction ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  {isReduction ? "" : "+"}
                  {percentChange.toFixed(1)}%
                </span>{" "}
                vs ano anterior
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="gradient-scope1 hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Escopo 1</CardTitle>
            <Factory className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {stats.scope1.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
              <span className="text-sm font-normal text-muted-foreground ml-1">tCO₂e</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Emissões diretas
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-scope2 hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Escopo 2</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {stats.scope2.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
              <span className="text-sm font-normal text-muted-foreground ml-1">tCO₂e</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Energia indireta
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-scope3 hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Escopo 3</CardTitle>
            <Truck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {stats.scope3.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
              <span className="text-sm font-normal text-muted-foreground ml-1">tCO₂e</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Outras indiretas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Cards */}
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <Card className="gradient-biogenic hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Emissões Biogênicas
            </CardTitle>
            <Leaf className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {stats.biogenic.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
              <span className="text-sm font-normal text-muted-foreground ml-1">tCO₂</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Reportadas separadamente conforme GHG Protocol
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-removal hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Remoções (Florestas)
            </CardTitle>
            <Leaf className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 tabular-nums">
              {stats.removals.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
              <span className="text-sm font-normal text-muted-foreground ml-1">tCO₂</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sequestro de carbono em florestas
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
