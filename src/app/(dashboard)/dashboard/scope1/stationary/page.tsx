"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Factory, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getStationaryFuelTypes } from "@/lib/calculation-engine/calculators/stationary";

const formSchema = z.object({
  sourceDescription: z.string().min(3, "Descrição é obrigatória"),
  activityType: z.string().min(1, "Combustível é obrigatório"),
  quantity: z.coerce.number().positive("Quantidade deve ser maior que zero"),
  quantityUnit: z.string().min(1, "Unidade é obrigatória"),
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2000).max(2100),
  dataSource: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// Mock data - in production, this would come from the API
const existingData = [
  {
    id: "1",
    sourceDescription: "Caldeira Industrial 01",
    activityType: "Gás Natural",
    quantity: 15000,
    quantityUnit: "m³",
    month: 1,
    year: 2024,
    co2e: 45.2,
  },
  {
    id: "2",
    sourceDescription: "Gerador Diesel",
    activityType: "Óleo Diesel",
    quantity: 2500,
    quantityUnit: "L",
    month: 1,
    year: 2024,
    co2e: 6.8,
  },
];

const fuelTypes = getStationaryFuelTypes();

const units: Record<string, string[]> = {
  "Gás Natural": ["m³", "GJ"],
  GLP: ["m³", "kg", "L"],
  "Óleo Diesel": ["L", "m³", "kg"],
  "Gasolina Automotiva": ["L", "m³"],
  "Álcool Etílico Anidro": ["L", "m³"],
  "Álcool Etílico Hidratado": ["L", "m³"],
  Biodiesel: ["L", "m³"],
  Biomassa: ["t", "kg"],
  Lenha: ["t", "kg", "m³"],
  "Carvão Mineral": ["t", "kg"],
  "Carvão Vegetal": ["t", "kg"],
  "Bagaço de Cana": ["t", "kg"],
  Default: ["L", "m³", "kg", "t", "GJ"],
};

export default function StationaryCombustionPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFuel, setSelectedFuel] = useState<string>("");

  const currentYear = new Date().getFullYear();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceDescription: "",
      activityType: "",
      quantity: 0,
      quantityUnit: "",
      year: currentYear,
      dataSource: "Manual",
      notes: "",
    },
  });

  const availableUnits = units[selectedFuel] || units.Default;

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      // TODO: Get inventoryId from context or URL
      const inventoryId = "current"; // Placeholder

      const response = await fetch(
        `/api/inventories/${inventoryId}/activity-data`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            category: "STATIONARY_COMBUSTION",
            scope: 1,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao salvar dados");
      }

      toast({
        title: "Dados salvos com sucesso",
        description: "As emissões foram calculadas automaticamente.",
      });

      form.reset();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-red-100">
          <Factory className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Combustão Estacionária</h1>
          <p className="text-muted-foreground">
            Escopo 1 - Caldeiras, geradores, fornos industriais
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Dados</CardTitle>
            <CardDescription>
              Registre o consumo de combustível em equipamentos estacionários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="sourceDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição da Fonte</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ex: Caldeira Industrial 01"
                        />
                      </FormControl>
                      <FormDescription>
                        Identifique o equipamento ou processo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="activityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Combustível</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedFuel(value);
                          form.setValue("quantityUnit", "");
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o combustível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fuelTypes.map((fuel) => (
                            <SelectItem key={fuel} value={fuel}>
                              {fuel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            placeholder="0.00"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantityUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Unidade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableUnits.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mês (opcional)</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(parseInt(v))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Anual" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">Janeiro</SelectItem>
                            <SelectItem value="2">Fevereiro</SelectItem>
                            <SelectItem value="3">Março</SelectItem>
                            <SelectItem value="4">Abril</SelectItem>
                            <SelectItem value="5">Maio</SelectItem>
                            <SelectItem value="6">Junho</SelectItem>
                            <SelectItem value="7">Julho</SelectItem>
                            <SelectItem value="8">Agosto</SelectItem>
                            <SelectItem value="9">Setembro</SelectItem>
                            <SelectItem value="10">Outubro</SelectItem>
                            <SelectItem value="11">Novembro</SelectItem>
                            <SelectItem value="12">Dezembro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Informações adicionais..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  <Plus className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Salvando..." : "Adicionar Registro"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Existing Data */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Registrados</CardTitle>
            <CardDescription>
              Combustão estacionária no inventário atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Combustível</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">tCO₂e</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {existingData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.sourceDescription}</div>
                      <div className="text-sm text-muted-foreground">
                        {row.month}/{row.year}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.activityType}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {row.quantity.toLocaleString("pt-BR")} {row.quantityUnit}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {row.co2e.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {existingData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado registrado ainda
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
