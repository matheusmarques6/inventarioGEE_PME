"use client";

import { useState } from "react";
import { Download, FileText, FileSpreadsheet, FileJson, Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const reportTypes = [
  {
    id: "ghg_protocol",
    name: "Relatório GHG Protocol",
    description: "Relatório completo seguindo metodologia GHG Protocol",
    icon: FileText,
    formats: ["PDF", "XLSX"],
  },
  {
    id: "executive",
    name: "Sumário Executivo",
    description: "Resumo das principais emissões e indicadores",
    icon: FileText,
    formats: ["PDF"],
  },
  {
    id: "detailed",
    name: "Relatório Detalhado",
    description: "Todos os dados de atividade e cálculos",
    icon: FileSpreadsheet,
    formats: ["XLSX", "CSV"],
  },
  {
    id: "sbce",
    name: "Relatório SBCE",
    description: "Formato para Sistema Brasileiro de Comércio de Emissões",
    icon: FileText,
    formats: ["PDF", "JSON"],
  },
];

const generatedReports = [
  { id: 1, name: "Relatório GHG Protocol 2024", type: "PDF", date: "28/12/2024", size: "2.4 MB" },
  { id: 2, name: "Dados Detalhados 2024", type: "XLSX", date: "27/12/2024", size: "1.8 MB" },
  { id: 3, name: "Sumário Executivo 2023", type: "PDF", date: "15/01/2024", size: "856 KB" },
];

export default function ReportsPage() {
  const [selectedYear, setSelectedYear] = useState("2024");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Download className="h-6 w-6 text-primary" />
            Relatórios
          </h1>
          <p className="text-muted-foreground">
            Gere e exporte relatórios do inventário de emissões
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label>Ano base:</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
                      {format}
                    </Badge>
                  ))}
                </div>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Gerar
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
          <div className="space-y-4">
            {generatedReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-white shadow-sm">
                    {report.type === "PDF" ? (
                      <FileText className="h-5 w-5 text-red-500" />
                    ) : report.type === "XLSX" ? (
                      <FileSpreadsheet className="h-5 w-5 text-green-500" />
                    ) : (
                      <FileJson className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {report.date}
                      </span>
                      <span>{report.size}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Pronto
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
