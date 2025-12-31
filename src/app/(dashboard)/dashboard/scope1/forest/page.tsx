"use client";

import { useState } from "react";
import { Plus, TreePine, Leaf, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const forestTypes = [
  { value: "native", label: "Floresta Nativa" },
  { value: "planted_eucalyptus", label: "Floresta Plantada - Eucalipto" },
  { value: "planted_pine", label: "Floresta Plantada - Pinus" },
  { value: "restoration", label: "Área em Restauração" },
  { value: "agroforestry", label: "Sistema Agroflorestal" },
];

const activityTypes = [
  { value: "growth", label: "Crescimento/Sequestro" },
  { value: "harvest", label: "Colheita" },
  { value: "fire", label: "Queimada/Incêndio" },
  { value: "deforestation", label: "Desmatamento" },
  { value: "planting", label: "Plantio" },
];

export default function ForestPage() {
  const [records] = useState([
    { id: 1, type: "Eucalipto", activity: "Crescimento", area: 500, emissions: -850, isRemoval: true },
    { id: 2, type: "Pinus", activity: "Colheita", area: 100, emissions: 150, isRemoval: false },
    { id: 3, type: "Nativa", activity: "Conservação", area: 200, emissions: -120, isRemoval: true },
  ]);

  const totalRemovals = records.filter(r => r.isRemoval).reduce((acc, r) => acc + r.emissions, 0);
  const totalEmissions = records.filter(r => !r.isRemoval).reduce((acc, r) => acc + r.emissions, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TreePine className="h-6 w-6 text-green-600" />
            Florestas e Uso do Solo (LULUCF)
          </h1>
          <p className="text-muted-foreground">
            Mudanças no uso da terra, florestas e remoções de carbono
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <TrendingDown className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Remoções</p>
                <p className="text-2xl font-bold text-green-700">{Math.abs(totalRemovals).toFixed(0)} tCO2</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100">
                <Leaf className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">Emissões LULUCF</p>
                <p className="text-2xl font-bold text-orange-700">{totalEmissions.toFixed(0)} tCO2</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <TreePine className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Balanço Líquido</p>
                <p className="text-2xl font-bold text-blue-700">{(totalRemovals + totalEmissions).toFixed(0)} tCO2</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Registrar Atividade Florestal
          </CardTitle>
          <CardDescription>
            Adicione dados de crescimento, colheita ou mudanças de uso do solo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Tipo de Floresta</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {forestTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Atividade</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Área (hectares)</Label>
              <Input type="number" placeholder="0" step="0.1" />
            </div>

            <div className="space-y-2">
              <Label>Ano</Label>
              <Input type="number" placeholder="2024" />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registros Florestais</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Floresta</TableHead>
                <TableHead>Atividade</TableHead>
                <TableHead className="text-right">Área (ha)</TableHead>
                <TableHead className="text-right">Emissões/Remoções (tCO2)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.type}</TableCell>
                  <TableCell>{record.activity}</TableCell>
                  <TableCell className="text-right">{record.area.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={record.isRemoval ? "success" : "destructive"}>
                      {record.emissions > 0 ? "+" : ""}{record.emissions.toFixed(0)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
