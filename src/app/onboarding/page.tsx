"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Leaf, Loader2, Building2, User as UserIcon } from "lucide-react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

const formSchema = z.object({
  userName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  organizationName: z.string().min(2, "Nome da empresa é obrigatório"),
  cnpj: z.string().regex(/^\d{14}$/, "CNPJ deve ter 14 dígitos (apenas números)"),
  sector: z.string().min(1, "Selecione um setor"),
  city: z.string().optional(),
  state: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const sectors = [
  { value: "industrial", label: "Industrial" },
  { value: "comercial", label: "Comercial" },
  { value: "servicos", label: "Serviços" },
  { value: "florestal", label: "Florestal" },
  { value: "agricola", label: "Agrícola" },
  { value: "energia", label: "Energia" },
  { value: "transporte", label: "Transporte e Logística" },
  { value: "construcao", label: "Construção Civil" },
  { value: "alimentos", label: "Alimentos e Bebidas" },
  { value: "quimica", label: "Química e Petroquímica" },
  { value: "mineracao", label: "Mineração" },
  { value: "outros", label: "Outros" },
];

const states = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userName: "",
      organizationName: "",
      cnpj: "",
      sector: "",
      city: "",
      state: "",
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro",
          description: result.error || "Erro ao criar organização",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Bem-vindo ao GEE Inventory!",
        description: "Sua organização foi criada com sucesso.",
      });

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Onboarding error:", error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2 rounded-xl bg-primary/10">
            <Leaf className="h-8 w-8 text-primary" />
          </div>
          <span className="text-2xl font-bold text-gray-900">GEE Inventory</span>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Configure sua conta</CardTitle>
            <CardDescription>
              Complete as informações abaixo para começar seu inventário de emissões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <UserIcon className="h-4 w-4" />
                    Seus dados
                  </div>

                  <FormField
                    control={form.control}
                    name="userName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seu nome</FormLabel>
                        <FormControl>
                          <Input placeholder="João Silva" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Organization Info */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    Dados da empresa
                  </div>

                  <FormField
                    control={form.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da empresa</FormLabel>
                        <FormControl>
                          <Input placeholder="Empresa LTDA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="00000000000000"
                            maxLength={14}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Apenas números, sem pontos ou traços
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Setor de atuação</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o setor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sectors.map((sector) => (
                              <SelectItem key={sector.value} value={sector.value}>
                                {sector.label}
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
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="São Paulo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="UF" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {states.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Configurando..." : "Começar a usar"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Suas informações estão protegidas e são usadas apenas para<br />
          personalizar seu inventário de emissões de GEE.
        </p>
      </div>
    </div>
  );
}
