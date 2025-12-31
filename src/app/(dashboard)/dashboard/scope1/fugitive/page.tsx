"use client";

import { useState } from "react";
import { Plus, Flame, Wind } from "lucide-react";
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

const gasTypes = [
  { value: "r410a", label: "R-410A (Ar condicionado)" },
  { value: "r134a", label: "R-134a (Refrigeração)" },
  { value: "r22", label: "R-22 (HCFC)" },
  { value: "co2_extinguisher", label: "CO2 (Extintores)" },
  { value: "sf6", label: "SF6 (Equipamentos elétricos)" },
  { value: "ch4_biogas", label: "CH4 (Vazamentos de biogás)" },
];

const sourceTypes = [
  { value: "ac", label: "Ar Condicionado" },
  { value: "refrigeration", label: "Refrigeração Industrial" },
  { value: "fire_extinguisher", label: "Extintores de Incêndio" },
  { value: "electrical", label: "Equipamentos Elétricos" },
  { value: "process", label: "Processo Industrial" },
];

export default function FugitiveEmissionsPage() {
  const [records] = useState([
    { id: 1, source: "Ar Condicionado", gas: "R-410A", quantity: 15, unit: "kg", emissions: 30.5 },
    { id: 2, source: "Extintores", gas: "CO2", quantity: 50, unit: "kg", emissions: 0.05 },
    { id: 3, source: "Refrigeração", gas: "R-134a", quantity: 8, unit: "kg", emissions: 10.4 },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Flame className="h-6 w-6 text-purple-500" />
            Emissões Fugitivas
          </h1>
          <p className="text-muted-foreground">
            Gases refrigerantes, extintores e vazamentos
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Wind className="h-10 w-10 text-purple-500" />
            <div>
              <h3 className="font-semibold">Emissões Fugitivas</h3>
              <p className="text-sm text-muted-foreground">
                Incluem vazamentos de gases refrigerantes (HFCs), SF6 de equipamentos elétricos,
                CO2 de extintores e outros gases de processo. Registre recargas e manutenções.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Registrar Emissão Fugitiva
          </CardTitle>
          <CardDescription>
            Adicione recargas de gases ou vazamentos identificados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Fonte</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {sourceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Gás</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {gasTypes.map((gas) => (
                    <SelectItem key={gas.value} value={gas.value}>
                      {gas.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade (kg)</Label>
              <Input type="number" placeholder="0" step="0.1" />
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" />
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
          <CardTitle>Registros de Emissões Fugitivas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fonte</TableHead>
                <TableHead>Gás</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Emissões (tCO2e)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.source}</TableCell>
                  <TableCell>{record.gas}</TableCell>
                  <TableCell className="text-right">{record.quantity} {record.unit}</TableCell>
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
