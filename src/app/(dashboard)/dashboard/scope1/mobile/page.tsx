"use client";

import { useState } from "react";
import { Plus, Truck, Fuel, Calendar } from "lucide-react";
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

const fuelTypes = [
  { value: "gasoline", label: "Gasolina Comum" },
  { value: "gasoline_premium", label: "Gasolina Aditivada" },
  { value: "ethanol", label: "Etanol" },
  { value: "diesel", label: "Diesel S10" },
  { value: "diesel_s500", label: "Diesel S500" },
  { value: "gnv", label: "GNV" },
];

const vehicleTypes = [
  { value: "car", label: "Automóvel" },
  { value: "light_truck", label: "Caminhão Leve" },
  { value: "heavy_truck", label: "Caminhão Pesado" },
  { value: "motorcycle", label: "Motocicleta" },
  { value: "bus", label: "Ônibus" },
];

export default function MobileCombustionPage() {
  const [records] = useState([
    { id: 1, vehicle: "Frota Leve", fuel: "Gasolina", quantity: 5000, unit: "L", month: "Janeiro", emissions: 11.5 },
    { id: 2, vehicle: "Caminhões", fuel: "Diesel S10", quantity: 15000, unit: "L", month: "Janeiro", emissions: 40.2 },
    { id: 3, vehicle: "Frota Leve", fuel: "Etanol", quantity: 2000, unit: "L", month: "Fevereiro", emissions: 0 },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6 text-orange-500" />
            Combustão Móvel
          </h1>
          <p className="text-muted-foreground">
            Frota de veículos próprios e arrendados
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Consumo
          </CardTitle>
          <CardDescription>
            Registre o consumo de combustível da frota
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Tipo de Veículo</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Combustível</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypes.map((fuel) => (
                    <SelectItem key={fuel.value} value={fuel.value}>
                      {fuel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade (Litros)</Label>
              <Input type="number" placeholder="0" />
            </div>

            <div className="space-y-2">
              <Label>Mês/Ano</Label>
              <Input type="month" />
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
          <CardTitle>Registros de Consumo</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo/Frota</TableHead>
                <TableHead>Combustível</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Emissões (tCO2e)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.vehicle}</TableCell>
                  <TableCell>{record.fuel}</TableCell>
                  <TableCell className="text-right">{record.quantity.toLocaleString()} {record.unit}</TableCell>
                  <TableCell>{record.month}</TableCell>
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
