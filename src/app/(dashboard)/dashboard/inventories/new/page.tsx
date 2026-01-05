"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/use-toast";
import { useInventory } from "@/contexts/inventory-context";

const formSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  baseYear: z.coerce
    .number()
    .min(2000, "Ano deve ser maior que 2000")
    .max(2100, "Ano deve ser menor que 2100"),
  reportingPeriod: z.string().min(1, "Período é obrigatório"),
  gwpReference: z.enum(["AR4", "AR5", "AR6"]),
  consolidationApproach: z.enum([
    "OPERATIONAL_CONTROL",
    "FINANCIAL_CONTROL",
    "EQUITY_SHARE",
  ]),
  includeScope1: z.boolean().default(true),
  includeScope2: z.boolean().default(true),
  includeScope3: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export default function NewInventoryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setCurrentInventory } = useInventory();

  const currentYear = new Date().getFullYear();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: `Inventário ${currentYear}`,
      baseYear: currentYear,
      reportingPeriod: String(currentYear),
      gwpReference: "AR5",
      consolidationApproach: "OPERATIONAL_CONTROL",
      includeScope1: true,
      includeScope2: true,
      includeScope3: false,
    },
  });

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/inventories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar inventário");
      }

      const inventory = await response.json();

      // Set as current inventory (use full inventory object from API)
      setCurrentInventory({
        id: inventory.id,
        name: inventory.name || `Inventário ${inventory.baseYear}`,
        baseYear: inventory.baseYear,
        status: inventory.status || "DRAFT",
        gwpReference: inventory.gwpReference || data.gwpReference,
        includeScope1: inventory.includeScope1 ?? data.includeScope1,
        includeScope2: inventory.includeScope2 ?? data.includeScope2,
        includeScope3: inventory.includeScope3 ?? data.includeScope3,
        totalEmissionsScope1: inventory.totalEmissionsScope1,
        totalEmissionsScope2: inventory.totalEmissionsScope2,
        totalEmissionsScope3: inventory.totalEmissionsScope3,
      });

      toast({
        title: "Inventário criado com sucesso!",
        description: `${data.name} está pronto para receber dados de emissões.`,
      });

      // Redirect to dashboard to start adding data
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao criar inventário",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/inventories">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Novo Inventário</h1>
          <p className="text-muted-foreground">
            Configure um novo inventário de emissões
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Defina o nome e período do inventário
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Inventário</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Inventário 2024" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="baseYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano Base</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Ano de referência das emissões
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reportingPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Período de Reporte</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="2024 ou 2024-Q1" />
                      </FormControl>
                      <FormDescription>
                        Período coberto pelo inventário
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Methodology */}
          <Card>
            <CardHeader>
              <CardTitle>Metodologia</CardTitle>
              <CardDescription>
                Configure as referências metodológicas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="gwpReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referência GWP</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a referência" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AR4">IPCC AR4 (2007)</SelectItem>
                        <SelectItem value="AR5">IPCC AR5 (2014)</SelectItem>
                        <SelectItem value="AR6">IPCC AR6 (2021)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Valores de GWP utilizados para conversão em CO₂e
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consolidationApproach"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abordagem de Consolidação</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a abordagem" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OPERATIONAL_CONTROL">
                          Controle Operacional
                        </SelectItem>
                        <SelectItem value="FINANCIAL_CONTROL">
                          Controle Financeiro
                        </SelectItem>
                        <SelectItem value="EQUITY_SHARE">
                          Participação Societária
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Define como as emissões são atribuídas à organização
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href="/dashboard/inventories">
              <Button variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  Criar Inventário
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
