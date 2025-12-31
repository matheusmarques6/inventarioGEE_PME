"use client";

import { useState } from "react";
import { Plus, Truck, Package, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const transportModes = [
  { value: "road_truck", label: "Rodoviário - Caminhão" },
  { value: "road_van", label: "Rodoviário - Van/Furgão" },
  { value: "rail", label: "Ferroviário" },
  { value: "sea", label: "Marítimo" },
  { value: "air", label: "Aéreo" },
];

export default function TransportPage() {
  const [upstreamRecords] = useState([
    { id: 1, description: "Fornecedor SP-RJ", mode: "Rodoviário", distance: 450, weight: 15000, emissions: 2.8 },
    { id: 2, description: "Importação China", mode: "Marítimo", distance: 18000, weight: 5000, emissions: 1.2 },
  ]);

  const [downstreamRecords] = useState([
    { id: 1, description: "Distribuição SP", mode: "Rodoviário", distance: 200, weight: 8000, emissions: 1.1 },
    { id: 2, description: "Clientes Sul", mode: "Rodoviário", distance: 650, weight: 12000, emissions: 3.5 },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6 text-green-500" />
            Transporte e Distribuição
          </h1>
          <p className="text-muted-foreground">
            Escopo 3 - Transporte upstream e downstream
          </p>
        </div>
      </div>

      <Tabs defaultValue="upstream" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upstream" className="gap-2">
            <ArrowDownRight className="h-4 w-4" />
            Upstream (Fornecedores)
          </TabsTrigger>
          <TabsTrigger value="downstream" className="gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Downstream (Clientes)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upstream" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Transporte de Fornecedores
              </CardTitle>
              <CardDescription>
                Transporte de insumos e matérias-primas até sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input placeholder="Ex: Fornecedor X" />
                </div>
                <div className="space-y-2">
                  <Label>Modal</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {transportModes.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Distância (km)</Label>
                  <Input type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Peso (kg)</Label>
                  <Input type="number" placeholder="0" />
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

          <Card>
            <CardHeader>
              <CardTitle>Registros - Transporte Upstream</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Modal</TableHead>
                    <TableHead className="text-right">Distância (km)</TableHead>
                    <TableHead className="text-right">Peso (kg)</TableHead>
                    <TableHead className="text-right">Emissões (tCO2e)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upstreamRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.description}</TableCell>
                      <TableCell>{record.mode}</TableCell>
                      <TableCell className="text-right">{record.distance.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{record.weight.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">{record.emissions.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="downstream" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Distribuição para Clientes
              </CardTitle>
              <CardDescription>
                Transporte de produtos acabados até os clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input placeholder="Ex: Região Sul" />
                </div>
                <div className="space-y-2">
                  <Label>Modal</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {transportModes.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Distância (km)</Label>
                  <Input type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Peso (kg)</Label>
                  <Input type="number" placeholder="0" />
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

          <Card>
            <CardHeader>
              <CardTitle>Registros - Transporte Downstream</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Modal</TableHead>
                    <TableHead className="text-right">Distância (km)</TableHead>
                    <TableHead className="text-right">Peso (kg)</TableHead>
                    <TableHead className="text-right">Emissões (tCO2e)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {downstreamRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.description}</TableCell>
                      <TableCell>{record.mode}</TableCell>
                      <TableCell className="text-right">{record.distance.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{record.weight.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">{record.emissions.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
