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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Zap, Trash2, Info } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getGridFactor } from "@/lib/constants/grid-factors";

const formSchema = z.object({
  sourceDescription: z.string().min(3, "Descrição é obrigatória"),
  consumption: z.coerce.number().positive("Consumo deve ser maior que zero"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
  dataSource: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const months = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

// Mock data
const existingData = [
  { id: "1", source: "Unidade Principal", month: 1, year: 2024, consumption: 125000, co2e: 5.27 },
  { id: "2", source: "Unidade Principal", month: 2, year: 2024, consumption: 118000, co2e: 4.44 },
  { id: "3", source: "Unidade Principal", month: 3, year: 2024, consumption: 132000, co2e: 3.67 },
];

export default function ElectricityPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceDescription: "Unidade Principal",
      consumption: 0,
      month: currentMonth,
      year: currentYear,
      dataSource: "Fatura de energia",
    },
  });

  const selectedMonth = form.watch("month");
  const selectedYear = form.watch("year");
  const gridFactor = getGridFactor(selectedYear, selectedMonth);

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      // Calculate emissions
      const consumptionMWh = data.consumption / 1000;
      const co2e = consumptionMWh * gridFactor;

      toast({
        title: "Dados salvos com sucesso",
        description: `Emissões calculadas: ${co2e.toFixed(2)} tCO₂e`,
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

  const totalConsumption = existingData.reduce((sum, d) => sum + d.consumption, 0);
  const totalEmissions = existingData.reduce((sum, d) => sum + d.co2e, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-blue-100">
          <Zap className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Eletricidade</h1>
          <p className="text-muted-foreground">
            Escopo 2 - Consumo de energia elétrica
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="flex items-start gap-4 pt-4">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">
              Fatores de Emissão do Grid Brasileiro
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              Os fatores de emissão são obtidos do MCTI/SIRENE e variam mensalmente
              de acordo com a matriz energética do Sistema Interligado Nacional (SIN).
              Fator atual para {months.find(m => m.value === selectedMonth)?.label}/{selectedYear}:{" "}
              <strong>{gridFactor.toFixed(4)} tCO₂/MWh</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Consumo</CardTitle>
            <CardDescription>
              Registre o consumo mensal de energia elétrica
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
                      <FormLabel>Unidade/Local</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Unidade Principal" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consumption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consumo (kWh)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          placeholder="0"
                        />
                      </FormControl>
                      <FormDescription>
                        Consumo em kilowatt-hora conforme fatura
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mês</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(parseInt(v))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {months.map((month) => (
                              <SelectItem
                                key={month.value}
                                value={month.value.toString()}
                              >
                                {month.label}
                              </SelectItem>
                            ))}
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

                {/* Preview calculation */}
                {form.watch("consumption") > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Emissões estimadas:
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {((form.watch("consumption") / 1000) * gridFactor).toFixed(2)} tCO₂e
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  <Plus className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Salvando..." : "Adicionar Registro"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Summary and Data */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo Anual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Consumo Total</p>
                  <p className="text-2xl font-bold">
                    {(totalConsumption / 1000).toLocaleString("pt-BR")} MWh
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Emissões Totais</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totalEmissions.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    tCO₂e
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Registrados</CardTitle>
              <CardDescription>
                Consumo mensal de eletricidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Consumo (kWh)</TableHead>
                    <TableHead className="text-right">tCO₂e</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {months.find((m) => m.value === row.month)?.label}/
                          {row.year}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {row.consumption.toLocaleString("pt-BR")}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
