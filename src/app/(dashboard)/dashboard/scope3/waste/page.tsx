"use client";

import { useState } from "react";
import { Plus, Trash2, Recycle, Factory } from "lucide-react";
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

const wasteTypes = [
  { value: "organic", label: "Resíduo Orgânico" },
  { value: "paper", label: "Papel/Papelão" },
  { value: "plastic", label: "Plástico" },
  { value: "metal", label: "Metal" },
  { value: "glass", label: "Vidro" },
  { value: "wood", label: "Madeira" },
  { value: "hazardous", label: "Resíduo Perigoso" },
  { value: "electronic", label: "Eletrônico" },
  { value: "construction", label: "Construção Civil" },
];

const treatmentMethods = [
  { value: "landfill", label: "Aterro Sanitário" },
  { value: "incineration", label: "Incineração" },
  { value: "recycling", label: "Reciclagem" },
  { value: "composting", label: "Compostagem" },
  { value: "coprocessing", label: "Coprocessamento" },
  { value: "biogas", label: "Biodigestão/Biogás" },
];

export default function WastePage() {
  const [records] = useState([
    { id: 1, type: "Orgânico", treatment: "Compostagem", quantity: 5000, unit: "kg", emissions: 0.2, isRecycled: true },
    { id: 2, type: "Papel/Papelão", treatment: "Reciclagem", quantity: 2000, unit: "kg", emissions: 0, isRecycled: true },
    { id: 3, type: "Plástico", treatment: "Aterro", quantity: 800, unit: "kg", emissions: 0.8, isRecycled: false },
    { id: 4, type: "Perigoso", treatment: "Coprocessamento", quantity: 150, unit: "kg", emissions: 0.3, isRecycled: false },
  ]);

  const totalWaste = records.reduce((acc, r) => acc + r.quantity, 0);
  const recycledWaste = records.filter(r => r.isRecycled).reduce((acc, r) => acc + r.quantity, 0);
  const recyclingRate = (recycledWaste / totalWaste * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-amber-500" />
            Resíduos Gerados
          </h1>
          <p className="text-muted-foreground">
            Escopo 3 - Tratamento de resíduos gerados nas operações
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-100">
                <Trash2 className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Gerado</p>
                <p className="text-2xl font-bold">{(totalWaste / 1000).toFixed(1)} t</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <Recycle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Reciclagem</p>
                <p className="text-2xl font-bold">{recyclingRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-100">
                <Factory className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Emissões</p>
                <p className="text-2xl font-bold">{records.reduce((acc, r) => acc + r.emissions, 0).toFixed(1)} tCO2e</p>
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
            Registrar Resíduo
          </CardTitle>
          <CardDescription>
            Adicione dados de resíduos gerados e seu tratamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label>Tipo de Resíduo</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {wasteTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tratamento/Destinação</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {treatmentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade (kg)</Label>
              <Input type="number" placeholder="0" />
            </div>

            <div className="space-y-2">
              <Label>Mês/Ano</Label>
              <Input type="month" />
            </div>

            <div className="flex items-end">
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Resíduos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Tratamento</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Emissões (tCO2e)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.type}</TableCell>
                  <TableCell>{record.treatment}</TableCell>
                  <TableCell className="text-right">{record.quantity.toLocaleString()} {record.unit}</TableCell>
                  <TableCell>
                    <Badge variant={record.isRecycled ? "success" : "secondary"}>
                      {record.isRecycled ? "Reciclado" : "Descartado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{record.emissions.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
