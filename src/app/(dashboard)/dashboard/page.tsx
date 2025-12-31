import { auth } from "@clerk/nextjs/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Leaf,
  Factory,
  Zap,
  Truck,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const { userId } = await auth();

  // TODO: Fetch real data from database
  const stats = {
    totalEmissions: 12450.5,
    scope1: 5230.2,
    scope2: 3120.8,
    scope3: 4099.5,
    biogenic: 890.3,
    removals: -2340.1,
    previousYear: 13200.0,
  };

  const percentChange = (
    ((stats.totalEmissions - stats.previousYear) / stats.previousYear) *
    100
  ).toFixed(1);
  const isReduction = stats.totalEmissions < stats.previousYear;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu inventário de emissões
          </p>
        </div>
        <Link href="/dashboard/inventories/new">
          <Button>
            Novo Inventário
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Emissões Totais
            </CardTitle>
            {isReduction ? (
              <TrendingDown className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalEmissions.toLocaleString("pt-BR")} tCO₂e
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={isReduction ? "text-green-500" : "text-red-500"}>
                {isReduction ? "" : "+"}
                {percentChange}%
              </span>{" "}
              em relação ao ano anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Escopo 1</CardTitle>
            <Factory className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.scope1.toLocaleString("pt-BR")} tCO₂e
            </div>
            <p className="text-xs text-muted-foreground">
              Emissões diretas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Escopo 2</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.scope2.toLocaleString("pt-BR")} tCO₂e
            </div>
            <p className="text-xs text-muted-foreground">
              Energia indireta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Escopo 3</CardTitle>
            <Truck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.scope3.toLocaleString("pt-BR")} tCO₂e
            </div>
            <p className="text-xs text-muted-foreground">
              Outras indiretas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Emissões Biogênicas
            </CardTitle>
            <Leaf className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.biogenic.toLocaleString("pt-BR")} tCO₂
            </div>
            <p className="text-xs text-muted-foreground">
              Reportadas separadamente conforme GHG Protocol
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Remoções (Florestas)
            </CardTitle>
            <Leaf className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.removals.toLocaleString("pt-BR")} tCO₂
            </div>
            <p className="text-xs text-muted-foreground">
              Sequestro de carbono em florestas plantadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Comece a adicionar dados ao seu inventário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/scope1/stationary">
              <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
                <CardContent className="flex items-center gap-4 p-4">
                  <Factory className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="font-medium">Combustão Estacionária</p>
                    <p className="text-sm text-muted-foreground">
                      Caldeiras, geradores
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/scope2/electricity">
              <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
                <CardContent className="flex items-center gap-4 p-4">
                  <Zap className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">Eletricidade</p>
                    <p className="text-sm text-muted-foreground">
                      Consumo de energia
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/scope1/mobile">
              <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
                <CardContent className="flex items-center gap-4 p-4">
                  <Truck className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-medium">Frota de Veículos</p>
                    <p className="text-sm text-muted-foreground">
                      Combustão móvel
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/scope1/forest">
              <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
                <CardContent className="flex items-center gap-4 p-4">
                  <Leaf className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium">Florestas</p>
                    <p className="text-sm text-muted-foreground">
                      LULUCF e remoções
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Current Inventory Status */}
      <Card>
        <CardHeader>
          <CardTitle>Inventário Atual</CardTitle>
          <CardDescription>Status do inventário 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Inventário 2024</p>
              <Badge variant="warning">Em Andamento</Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Progresso</p>
              <p className="text-2xl font-bold">65%</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: "65%" }}
              />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <p className="text-muted-foreground">Categorias</p>
              <p className="font-medium">12 / 18</p>
            </div>
            <div>
              <p className="text-muted-foreground">Registros</p>
              <p className="font-medium">156</p>
            </div>
            <div>
              <p className="text-muted-foreground">Última atualização</p>
              <p className="font-medium">Há 2 horas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
