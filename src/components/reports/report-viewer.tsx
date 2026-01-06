"use client";

import { useRef, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Download,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  Leaf,
  Building2,
  Factory,
  Loader2,
  ArrowLeft,
  Printer,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export interface ReportData {
  id: string;
  title: string;
  type: string;
  description?: string;
  organization: {
    name: string;
    cnpj?: string;
    sector?: string;
  };
  inventory: {
    baseYear: number;
    gwpReference: string;
    consolidationApproach: string;
  };
  emissions: {
    scope1: number;
    scope2: number;
    scope3: number;
    biogenic: number;
    total: number;
  };
  emissionsByCategory: Array<{
    category: string;
    categoryLabel: string;
    scope: number;
    value: number;
    percentage: number;
  }>;
  activityData?: Array<{
    id: string;
    category: string;
    sourceDescription: string;
    activityType: string;
    quantity: number;
    unit: string;
    co2Equivalent: number;
  }>;
  generatedAt: string;
  config: {
    includeCharts: boolean;
    includeDetails: boolean;
    includeMethodology: boolean;
    responsibleName?: string;
    responsibleRole?: string;
  };
}

interface ReportViewerProps {
  data: ReportData;
  onBack: () => void;
  onExportPDF: () => Promise<void>;
}

const SCOPE_COLORS = {
  1: "#ef4444", // red
  2: "#3b82f6", // blue
  3: "#22c55e", // green
};

const CATEGORY_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#ec4899",
];

const categoryLabels: Record<string, string> = {
  STATIONARY_COMBUSTION: "Combustão Estacionária",
  MOBILE_COMBUSTION: "Combustão Móvel",
  FUGITIVE_EMISSIONS: "Emissões Fugitivas",
  PROCESS_EMISSIONS: "Emissões de Processo",
  AGRICULTURAL: "Agrícola",
  LULUCF: "Mudança de Uso do Solo",
  PURCHASED_ELECTRICITY: "Energia Elétrica",
  PURCHASED_HEAT: "Calor/Vapor",
  UPSTREAM_TRANSPORT: "Transporte Upstream",
  DOWNSTREAM_TRANSPORT: "Transporte Downstream",
  WASTE_EXTERNAL: "Resíduos",
  BUSINESS_TRAVEL: "Viagens a Negócio",
  EMPLOYEE_COMMUTING: "Deslocamento de Funcionários",
};

const formatNumber = (value: number) => {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function ReportViewer({ data, onBack, onExportPDF }: ReportViewerProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const scopeData = [
    { name: "Escopo 1", value: data.emissions.scope1, color: SCOPE_COLORS[1] },
    { name: "Escopo 2", value: data.emissions.scope2, color: SCOPE_COLORS[2] },
    { name: "Escopo 3", value: data.emissions.scope3, color: SCOPE_COLORS[3] },
  ].filter(d => d.value > 0);

  const categoryData = data.emissionsByCategory
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await onExportPDF();
      toast({ title: "PDF exportado com sucesso!" });
    } catch (error) {
      toast({
        title: "Erro ao exportar PDF",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button onClick={handleExportPDF} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="space-y-6 print:space-y-4" id="report-content">
        {/* Report Header */}
        <Card className="border-t-4 border-t-primary">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Leaf className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{data.title}</h1>
                  <p className="text-muted-foreground">{data.organization.name}</p>
                  {data.description && (
                    <p className="text-sm text-muted-foreground mt-1">{data.description}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {data.inventory.baseYear}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  Gerado em: {new Date(data.generatedAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
                <Factory className="h-4 w-4" />
                Escopo 1
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-900">
                {formatNumber(data.emissions.scope1)}
              </p>
              <p className="text-xs text-red-700">tCO₂e</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Escopo 2
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-900">
                {formatNumber(data.emissions.scope2)}
              </p>
              <p className="text-xs text-blue-700">tCO₂e</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Escopo 3
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-900">
                {formatNumber(data.emissions.scope3)}
              </p>
              <p className="text-xs text-green-700">tCO₂e</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-800 flex items-center gap-2">
                <Leaf className="h-4 w-4" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data.emissions.total)}
              </p>
              <p className="text-xs text-gray-700">tCO₂e</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        {data.config.includeCharts && (
          <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-2">
            {/* Pie Chart - By Scope */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Emissões por Escopo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={scopeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(1)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {scopeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [
                          `${formatNumber(value)} tCO₂e`,
                          "Emissões",
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart - By Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top 10 Categorias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryData}
                      layout="vertical"
                      margin={{ left: 120 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis
                        dataKey="categoryLabel"
                        type="category"
                        width={110}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          `${formatNumber(value)} tCO₂e`,
                          "Emissões",
                        ]}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {categoryData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Tables */}
        {data.config.includeDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalhamento por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="print:hidden">
                <TabsList>
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="scope1">Escopo 1</TabsTrigger>
                  <TabsTrigger value="scope2">Escopo 2</TabsTrigger>
                  <TabsTrigger value="scope3">Escopo 3</TabsTrigger>
                </TabsList>

                {["all", "scope1", "scope2", "scope3"].map((tab) => (
                  <TabsContent key={tab} value={tab}>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Escopo</TableHead>
                            <TableHead className="text-right">Emissões (tCO₂e)</TableHead>
                            <TableHead className="text-right">% do Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.emissionsByCategory
                            .filter((c) =>
                              tab === "all" ? true : c.scope === parseInt(tab.replace("scope", ""))
                            )
                            .sort((a, b) => b.value - a.value)
                            .map((cat) => (
                              <TableRow key={`${cat.scope}-${cat.category}`}>
                                <TableCell className="font-medium">
                                  {cat.categoryLabel}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    style={{
                                      backgroundColor: `${SCOPE_COLORS[cat.scope as keyof typeof SCOPE_COLORS]}20`,
                                      borderColor: SCOPE_COLORS[cat.scope as keyof typeof SCOPE_COLORS],
                                      color: SCOPE_COLORS[cat.scope as keyof typeof SCOPE_COLORS],
                                    }}
                                  >
                                    Escopo {cat.scope}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatNumber(cat.value)}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {cat.percentage.toFixed(1)}%
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              {/* Print version (no tabs) */}
              <div className="hidden print:block border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Escopo</TableHead>
                      <TableHead className="text-right">Emissões (tCO₂e)</TableHead>
                      <TableHead className="text-right">% do Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.emissionsByCategory
                      .sort((a, b) => b.value - a.value)
                      .map((cat) => (
                        <TableRow key={`${cat.scope}-${cat.category}`}>
                          <TableCell className="font-medium">{cat.categoryLabel}</TableCell>
                          <TableCell>Escopo {cat.scope}</TableCell>
                          <TableCell className="text-right">{formatNumber(cat.value)}</TableCell>
                          <TableCell className="text-right">{cat.percentage.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Data Details */}
        {data.config.includeDetails && data.activityData && data.activityData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Dados de Atividade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fonte</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">tCO₂e</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.activityData.slice(0, 20).map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">
                          {activity.sourceDescription}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {categoryLabels[activity.category] || activity.category}
                          </Badge>
                        </TableCell>
                        <TableCell>{activity.activityType}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(activity.quantity)} {activity.unit}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatNumber(activity.co2Equivalent)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {data.activityData.length > 20 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Mostrando 20 de {data.activityData.length} registros
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Methodology Section */}
        {data.config.includeMethodology && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Metodologia
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold">Referência GWP</h4>
                  <p className="text-muted-foreground">{data.inventory.gwpReference}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Abordagem de Consolidação</h4>
                  <p className="text-muted-foreground">
                    {data.inventory.consolidationApproach === "OPERATIONAL_CONTROL"
                      ? "Controle Operacional"
                      : data.inventory.consolidationApproach === "FINANCIAL_CONTROL"
                      ? "Controle Financeiro"
                      : data.inventory.consolidationApproach}
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Sobre os Escopos</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>
                    <strong>Escopo 1:</strong> Emissões diretas de fontes próprias ou controladas
                    pela organização (combustão estacionária, móvel, processos industriais, etc.)
                  </li>
                  <li>
                    <strong>Escopo 2:</strong> Emissões indiretas provenientes da aquisição de
                    energia elétrica, vapor, calor ou resfriamento
                  </li>
                  <li>
                    <strong>Escopo 3:</strong> Outras emissões indiretas que ocorrem na cadeia de
                    valor da organização
                  </li>
                </ul>
              </div>

              {data.config.responsibleName && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-semibold">Responsável pelo Inventário</h4>
                  <p className="text-muted-foreground">
                    {data.config.responsibleName}
                    {data.config.responsibleRole && ` - ${data.config.responsibleRole}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Biogenic Emissions */}
        {data.emissions.biogenic > 0 && (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Leaf className="h-5 w-5" />
                Emissões Biogênicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-900">
                {formatNumber(data.emissions.biogenic)} tCO₂
              </p>
              <p className="text-sm text-green-700 mt-2">
                Emissões de CO₂ provenientes de fontes biogênicas são reportadas separadamente,
                conforme o GHG Protocol.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4 border-t">
          <p>
            Relatório gerado pelo Sistema GEE Inventory em{" "}
            {new Date(data.generatedAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="mt-1">
            Em conformidade com o GHG Protocol e a Lei nº 15.042/2024 (SBCE)
          </p>
        </div>
      </div>
    </div>
  );
}
