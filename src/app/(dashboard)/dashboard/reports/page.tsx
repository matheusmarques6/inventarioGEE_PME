"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, FileText, FileSpreadsheet, FileJson, Calendar, CheckCircle, Loader2, AlertCircle, Trash2 } from "lucide-react";
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

const reportTypes = [
  {
    id: "GHG_PROTOCOL",
    name: "Relatório GHG Protocol",
    description: "Relatório completo seguindo metodologia GHG Protocol",
    icon: FileText,
    formats: ["JSON"] as const,
  },
  {
    id: "EXECUTIVE_SUMMARY",
    name: "Sumário Executivo",
    description: "Resumo das principais emissões e indicadores",
    icon: FileText,
    formats: ["JSON"] as const,
  },
  {
    id: "SBCE",
    name: "Relatório SBCE",
    description: "Formato para Sistema Brasileiro de Comércio de Emissões",
    icon: FileText,
    formats: ["JSON"] as const,
  },
  {
    id: "CUSTOM",
    name: "Relatório Detalhado",
    description: "Todos os dados de atividade e cálculos",
    icon: FileSpreadsheet,
    formats: ["JSON"] as const,
  },
];

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
  CUSTOM: "Detalhado",
  GRI: "GRI",
  CDP: "CDP",
};

export default function ReportsPage() {
  const { currentInventory, isLoading: inventoryLoading } = useInventory();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleGenerate = async (typeId: string, format: string) => {
    if (!currentInventory?.id) {
      toast({
        title: "Erro",
        description: "Selecione um inventário primeiro",
        variant: "destructive",
      });
      return;
    }

    setGeneratingType(typeId);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId: currentInventory.id,
          type: typeId,
          format,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao gerar relatório");
      }

      const result = await response.json();

      toast({
        title: "Relatório gerado",
        description: result.message,
      });

      // Download the report
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.report.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Refresh reports list
      fetchReports();
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setGeneratingType(null);
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      const response = await fetch(`/api/reports/download?id=${report.id}`);
      if (!response.ok) throw new Error("Erro ao baixar");

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Download className="h-6 w-6 text-primary" />
            Relatórios
          </h1>
          <p className="text-muted-foreground">
            Gere e exporte relatórios do inventário - {currentInventory.name}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Ano base: {currentInventory.baseYear}
        </Badge>
      </div>

      {/* Report Types */}
      <div className="grid gap-4 md:grid-cols-2">
        {reportTypes.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <report.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {report.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {report.formats.map((format) => (
                    <Badge key={format} variant="outline">
                      {formatLabels[format] || format}
                    </Badge>
                  ))}
                </div>
                <Button
                  onClick={() => handleGenerate(report.id, report.formats[0])}
                  disabled={generatingType !== null}
                >
                  {generatingType === report.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Gerar
                    </>
                  )}
                </Button>
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
            Histórico de relatórios disponíveis para download
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum relatório gerado ainda</p>
              <p className="text-sm">Use os botões acima para gerar relatórios</p>
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
                        {typeLabels[report.type] || report.type} - {report.inventory?.baseYear || currentInventory.baseYear}
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
                      onClick={() => handleDownload(report)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar
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
