"use client";

import { useEffect, useState } from "react";
import { useInventory } from "@/contexts/inventory-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface CategoryData {
  category: string;
  categoryLabel: string;
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
}

interface EmissionsByCategory {
  categories: CategoryData[];
  totalScope1: number;
  totalScope2: number;
  totalScope3: number;
  totalEmissions: number;
}

// Category labels in Portuguese
const CATEGORY_LABELS: Record<string, string> = {
  STATIONARY_COMBUSTION: "Combustão Estacionária",
  MOBILE_COMBUSTION: "Combustão Móvel",
  FUGITIVE_EMISSIONS: "Emissões Fugitivas",
  PROCESS_EMISSIONS: "Processos Industriais",
  AGRICULTURAL: "Agricultura",
  LULUCF: "Florestas (LULUCF)",
  WASTE_INTERNAL: "Resíduos Internos",
  PURCHASED_ELECTRICITY: "Eletricidade",
  PURCHASED_HEAT: "Calor/Vapor",
  PURCHASED_GOODS: "Bens Comprados",
  CAPITAL_GOODS: "Bens de Capital",
  FUEL_ENERGY_ACTIVITIES: "Energia (upstream)",
  UPSTREAM_TRANSPORT: "Transporte (upstream)",
  DOWNSTREAM_TRANSPORT: "Transporte (downstream)",
  WASTE_EXTERNAL: "Resíduos (downstream)",
  BUSINESS_TRAVEL: "Viagens",
  EMPLOYEE_COMMUTING: "Deslocamento",
  LEASED_ASSETS: "Ativos Arrendados",
  INVESTMENTS: "Investimentos",
};

const SCOPE_COLORS = {
  scope1: "#3b82f6", // blue
  scope2: "#ef4444", // red
  scope3: "#8b5cf6", // purple
};

export function EmissionsChart() {
  const { currentInventory } = useInventory();
  const [data, setData] = useState<EmissionsByCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScope, setSelectedScope] = useState<"all" | "1" | "2" | "3">("all");

  useEffect(() => {
    async function fetchData() {
      if (!currentInventory) {
        setData(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/inventories/${currentInventory.id}/stats/categories`
        );
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          setData(null);
        }
      } catch (error) {
        console.error("Error fetching category data:", error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [currentInventory]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !currentInventory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Emissões por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">
            Selecione um inventário para ver o gráfico
          </p>
        </CardContent>
      </Card>
    );
  }

  // Filter and sort data
  let chartData = data.categories
    .map((cat) => ({
      name: cat.categoryLabel,
      scope1: cat.scope1,
      scope2: cat.scope2,
      scope3: cat.scope3,
      total: cat.total,
    }))
    .filter((cat) => {
      if (selectedScope === "all") return cat.total > 0;
      if (selectedScope === "1") return cat.scope1 > 0;
      if (selectedScope === "2") return cat.scope2 > 0;
      if (selectedScope === "3") return cat.scope3 > 0;
      return false;
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 8); // Top 8 categories

  // Calculate percentages
  const totalForScope = selectedScope === "all"
    ? data.totalEmissions
    : selectedScope === "1" ? data.totalScope1
    : selectedScope === "2" ? data.totalScope2
    : data.totalScope3;

  const scopeLabel = selectedScope === "all" ? "Todos os escopos"
    : `Escopo ${selectedScope}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Emissões por Categoria
            </CardTitle>
            <CardDescription>
              Em toneladas de CO₂ equivalente (tCO₂e)
            </CardDescription>
          </div>
          <Tabs
            value={selectedScope}
            onValueChange={(v) => setSelectedScope(v as "all" | "1" | "2" | "3")}
          >
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="1">Escopo 1</TabsTrigger>
              <TabsTrigger value="2">Escopo 2</TabsTrigger>
              <TabsTrigger value="3">Escopo 3</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-muted-foreground">{scopeLabel}</span>
          <span className="font-semibold">
            Emissão total: {" "}
            <span className="text-lg">
              {totalForScope.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
            </span>
            {" "}tCO₂e
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">
              Nenhum dado de emissões registrado
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                tickFormatter={(value) => value.toLocaleString("pt-BR")}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                width={90}
              />
              <Tooltip
                formatter={(value: number) => [
                  `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} tCO₂e`,
                ]}
                labelStyle={{ fontWeight: "bold" }}
              />
              {selectedScope === "all" ? (
                <>
                  <Legend />
                  <Bar dataKey="scope1" name="Escopo 1" stackId="stack" fill={SCOPE_COLORS.scope1} />
                  <Bar dataKey="scope2" name="Escopo 2" stackId="stack" fill={SCOPE_COLORS.scope2} />
                  <Bar dataKey="scope3" name="Escopo 3" stackId="stack" fill={SCOPE_COLORS.scope3} />
                </>
              ) : (
                <Bar
                  dataKey={selectedScope === "1" ? "scope1" : selectedScope === "2" ? "scope2" : "scope3"}
                  fill={selectedScope === "1" ? SCOPE_COLORS.scope1 : selectedScope === "2" ? SCOPE_COLORS.scope2 : SCOPE_COLORS.scope3}
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={selectedScope === "1" ? SCOPE_COLORS.scope1 : selectedScope === "2" ? SCOPE_COLORS.scope2 : SCOPE_COLORS.scope3}
                      opacity={1 - (index * 0.08)}
                    />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: SCOPE_COLORS.scope1 }} />
            <span>Escopo 1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: SCOPE_COLORS.scope2 }} />
            <span>Escopo 2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: SCOPE_COLORS.scope3 }} />
            <span>Escopo 3</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { CATEGORY_LABELS };
