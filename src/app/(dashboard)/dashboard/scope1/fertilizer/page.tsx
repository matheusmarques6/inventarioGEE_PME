"use client";

import { useState } from "react";
import { Plus, Leaf, Droplets } from "lucide-react";
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

const fertilizerTypes = [
  { value: "urea", label: "Ureia" },
  { value: "ammonium_nitrate", label: "Nitrato de Amônio" },
  { value: "ammonium_sulfate", label: "Sulfato de Amônio" },
  { value: "npk", label: "NPK" },
  { value: "map", label: "MAP (Fosfato Monoamônico)" },
  { value: "organic", label: "Orgânico/Composto" },
];

const applicationMethods = [
  { value: "broadcast", label: "Aplicação a lanço" },
  { value: "incorporated", label: "Incorporado ao solo" },
  { value: "fertigation", label: "Fertirrigação" },
  { value: "foliar", label: "Foliar" },
];

export default function FertilizerPage() {
  const [records] = useState([
    { id: 1, type: "Ureia", area: 100, quantity: 5000, unit: "kg", emissions: 2.3 },
    { id: 2, type: "NPK", area: 50, quantity: 2500, unit: "kg", emissions: 0.8 },
    { id: 3, type: "Nitrato de Amônio", area: 75, quantity: 3000, unit: "kg", emissions: 1.5 },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Leaf className="h-6 w-6 text-green-500" />
            Fertilizantes e Agricultura
          </h1>
          <p className="text-muted-foreground">
            Emissões de N2O pelo uso de fertilizantes nitrogenados
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Droplets className="h-10 w-10 text-green-500" />
            <div>
              <h3 className="font-semibold">Emissões Agrícolas</h3>
              <p className="text-sm text-muted-foreground">
                A aplicação de fertilizantes nitrogenados resulta em emissões de óxido nitroso (N2O),
                um gás com potencial de aquecimento global 265x maior que o CO2.
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
            Registrar Aplicação de Fertilizante
          </CardTitle>
          <CardDescription>
            Adicione dados de uso de fertilizantes nitrogenados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label>Tipo de Fertilizante</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {fertilizerTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Método de Aplicação</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {applicationMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
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
              <Label>Quantidade (kg)</Label>
              <Input type="number" placeholder="0" />
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
          <CardTitle>Registros de Fertilizantes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fertilizante</TableHead>
                <TableHead className="text-right">Área (ha)</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Emissões N2O (tCO2e)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.type}</TableCell>
                  <TableCell className="text-right">{record.area}</TableCell>
                  <TableCell className="text-right">{record.quantity.toLocaleString()} {record.unit}</TableCell>
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
