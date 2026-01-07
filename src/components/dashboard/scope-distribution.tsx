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
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

interface EmissionStats {
  totalEmissions: number;
  scope1: number;
  scope2: number;
  scope3: number;
  biogenic: number;
  removals: number;
}

const SCOPE_COLORS = ["#3b82f6", "#ef4444", "#8b5cf6"];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show labels for very small slices

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontWeight="bold"
      fontSize={14}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function ScopeDistribution() {
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
          setStats(null);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [currentInventory]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats || !currentInventory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Distribuição por Escopo
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <p className="text-muted-foreground">
            Selecione um inventário para ver o gráfico
          </p>
        </CardContent>
      </Card>
    );
  }

  const pieData = [
    { name: "Escopo 1", value: stats.scope1, color: SCOPE_COLORS[0] },
    { name: "Escopo 2", value: stats.scope2, color: SCOPE_COLORS[1] },
    { name: "Escopo 3", value: stats.scope3, color: SCOPE_COLORS[2] },
  ].filter((d) => d.value > 0);

  const hasData = pieData.length > 0 && stats.totalEmissions > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          Distribuição por Escopo
        </CardTitle>
        <CardDescription>
          Proporção de emissões por escopo
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[250px] flex items-center justify-center">
            <p className="text-muted-foreground">
              Nenhum dado de emissões registrado
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} tCO₂e`,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend with values */}
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="font-medium">{entry.name}</span>
                </div>
              ))}
            </div>

            {/* Scope details */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Escopo 1</p>
                <p className="font-semibold text-blue-600">
                  {stats.scope1.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {((stats.scope1 / stats.totalEmissions) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Escopo 2</p>
                <p className="font-semibold text-red-600">
                  {stats.scope2.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {((stats.scope2 / stats.totalEmissions) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Escopo 3</p>
                <p className="font-semibold text-purple-600">
                  {stats.scope3.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {((stats.scope3 / stats.totalEmissions) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
