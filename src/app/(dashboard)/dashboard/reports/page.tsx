"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  Calendar,
  CheckCircle,
  Loader2,
  AlertCircle,
  Trash2,
  Plus,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ReportWizardModal, type ReportFormData } from "@/components/reports/report-wizard-modal";
import { ReportViewer, type ReportData } from "@/components/reports/report-viewer";
import { exportReportToPDF } from "@/lib/pdf-export";

interface Report {
  id: string;
  type: string;
  format: string;
  fileName: string;
  fileUrl: string;
  generatedAt: string;
  inventory?: {
    name: string;
    baseYear: number;
  };
  reportData?: ReportData;
}

const formatLabels: Record<string, string> = {
  PDF: "PDF",
  XLSX: "Excel",
  JSON: "JSON",
  DOCX: "Word",
};

const typeLabels: Record<string, string> = {
  GHG_PROTOCOL: "GHG Protocol",
  EXECUTIVE_SUMMARY: "Sumário Executivo",
  SBCE: "SBCE",
  CUSTOM: "Personalizado",
  GRI: "GRI",
  CDP: "CDP",
};

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

export default function ReportsPage() {
  const { currentInventory, isLoading: inventoryLoading } = useInventory();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!currentInventory?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/reports?inventoryId=${currentInventory.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentInventory?.id]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleCreateReport = async (formData: ReportFormData) => {
    if (!currentInventory?.id) {
      toast({
        title: "Erro",
        description: "Selecione um inventário primeiro",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId: currentInventory.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao gerar relatório");
      }

      const result = await response.json();

      toast({
        title: "Relatório gerado com sucesso!",
        description: "Visualize o relatório abaixo",
      });

      // Show the report viewer
      setViewingReport(result.reportData);
      setIsWizardOpen(false);

      // Refresh reports list
      fetchReports();
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewReport = async (report: Report) => {
    try {
      const response = await fetch(`/api/reports/${report.id}`);
      if (!response.ok) throw new Error("Erro ao carregar relatório");

      const data = await response.json();
      setViewingReport(data.reportData);
    } catch (error) {
      toast({
        title: "Erro ao carregar relatório",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    if (!viewingReport) return;
    await exportReportToPDF(viewingReport);
  };

  const handleDownloadJSON = async (report: Report) => {
    try {
      const response = await fetch(`/api/reports/${report.id}`);
      if (!response.ok) throw new Error("Erro ao baixar");

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data.reportData, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = report.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: "Download iniciado" });
    } catch (error) {
      toast({
        title: "Erro ao baixar",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/reports?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({ title: "Relatório excluído" });
        fetchReports();
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
            Crie ou selecione um inventário para gerar relatórios.
          </p>
          <Link href="/dashboard/inventories/new">
            <Button>Criar Inventário</Button>
          </Link>
        </div>
      </Card>
    );
  }

  // If viewing a report, show the viewer
  if (viewingReport) {
    return (
      <ReportViewer
        data={viewingReport}
        onBack={() => setViewingReport(null)}
        onExportPDF={handleExportPDF}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Relatórios
          </h1>
          <p className="text-muted-foreground">
            Crie e visualize relatórios de emissões - {currentInventory.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Ano base: {currentInventory.baseYear}
          </Badge>
          <Button onClick={() => setIsWizardOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Relatório
          </Button>
        </div>
      </div>

      {/* Report Creation Wizard */}
      <ReportWizardModal
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onSubmit={handleCreateReport}
        inventoryYear={currentInventory.baseYear}
      />

      {/* Quick Create Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            type: "GHG_PROTOCOL",
            name: "GHG Protocol",
            description: "Relatório completo internacional",
            color: "bg-green-100 border-green-200 text-green-800",
          },
          {
            type: "EXECUTIVE_SUMMARY",
            name: "Sumário Executivo",
            description: "Resumo com indicadores",
            color: "bg-blue-100 border-blue-200 text-blue-800",
          },
          {
            type: "SBCE",
            name: "SBCE",
            description: "Sistema Brasileiro de Emissões",
            color: "bg-yellow-100 border-yellow-200 text-yellow-800",
          },
          {
            type: "CUSTOM",
            name: "Personalizado",
            description: "Configure suas opções",
            color: "bg-purple-100 border-purple-200 text-purple-800",
          },
        ].map((item) => (
          <Card
            key={item.type}
            className={`cursor-pointer hover:shadow-md transition-all border-2 ${item.color}`}
            onClick={() => setIsWizardOpen(true)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm opacity-80">{item.description}</p>
                </div>
                <Plus className="h-5 w-5 opacity-50" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generated Reports History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios Gerados
          </CardTitle>
          <CardDescription>
            Visualize, baixe ou exclua relatórios anteriores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Nenhum relatório gerado ainda</p>
              <p className="text-sm mb-4">
                Clique em &quot;Novo Relatório&quot; para começar
              </p>
              <Button onClick={() => setIsWizardOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Relatório
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-white shadow-sm">
                      {report.format === "PDF" ? (
                        <FileText className="h-5 w-5 text-red-500" />
                      ) : report.format === "XLSX" ? (
                        <FileSpreadsheet className="h-5 w-5 text-green-500" />
                      ) : (
                        <FileJson className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {typeLabels[report.type] || report.type} -{" "}
                        {report.inventory?.baseYear || currentInventory.baseYear}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(report.generatedAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {formatLabels[report.format] || report.format}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="gap-1 bg-green-600">
                      <CheckCircle className="h-3 w-3" />
                      Pronto
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReport(report)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadJSON(report)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      JSON
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === report.id}
                        >
                          {deletingId === report.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir relatório?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(report.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
