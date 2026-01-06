"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  BarChart3,
  PieChart,
  Settings2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
} from "lucide-react";

const formSchema = z.object({
  title: z.string().min(3, "Título é obrigatório"),
  type: z.enum(["GHG_PROTOCOL", "EXECUTIVE_SUMMARY", "SBCE", "CUSTOM"]),
  description: z.string().optional(),
  includeCharts: z.boolean().default(true),
  includeDetails: z.boolean().default(true),
  includeMethodology: z.boolean().default(true),
  scopes: z.array(z.number()).min(1, "Selecione pelo menos um escopo"),
  categories: z.array(z.string()).optional(),
  dateRange: z.object({
    startMonth: z.number().optional(),
    endMonth: z.number().optional(),
  }).optional(),
  responsibleName: z.string().optional(),
  responsibleRole: z.string().optional(),
});

export type ReportFormData = z.infer<typeof formSchema>;

interface ReportWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ReportFormData) => Promise<void>;
  inventoryYear: number;
}

const reportTypes = [
  {
    id: "GHG_PROTOCOL",
    name: "GHG Protocol",
    description: "Relatório completo seguindo metodologia internacional",
    icon: FileText,
  },
  {
    id: "EXECUTIVE_SUMMARY",
    name: "Sumário Executivo",
    description: "Resumo com principais indicadores e gráficos",
    icon: BarChart3,
  },
  {
    id: "SBCE",
    name: "SBCE",
    description: "Formato para Sistema Brasileiro de Comércio de Emissões",
    icon: FileText,
  },
  {
    id: "CUSTOM",
    name: "Personalizado",
    description: "Configure exatamente o que deseja incluir",
    icon: Settings2,
  },
];

const categoryLabels: Record<string, string> = {
  STATIONARY_COMBUSTION: "Combustão Estacionária",
  MOBILE_COMBUSTION: "Combustão Móvel",
  FUGITIVE_EMISSIONS: "Emissões Fugitivas",
  PROCESS_EMISSIONS: "Emissões de Processo",
  AGRICULTURAL: "Agrícola",
  LULUCF: "Mudança de Uso do Solo",
  PURCHASED_ELECTRICITY: "Energia Elétrica",
  PURCHASED_HEAT: "Calor/Vapor",
  UPSTREAM_TRANSPORT: "Transporte Upstream",
  DOWNSTREAM_TRANSPORT: "Transporte Downstream",
  WASTE_EXTERNAL: "Resíduos",
  BUSINESS_TRAVEL: "Viagens a Negócio",
  EMPLOYEE_COMMUTING: "Deslocamento de Funcionários",
};

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function ReportWizardModal({
  open,
  onOpenChange,
  onSubmit,
  inventoryYear,
}: ReportWizardModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: `Relatório de Emissões ${inventoryYear}`,
      type: "GHG_PROTOCOL",
      description: "",
      includeCharts: true,
      includeDetails: true,
      includeMethodology: true,
      scopes: [1, 2, 3],
      categories: [],
      responsibleName: "",
      responsibleRole: "",
    },
  });

  const selectedType = form.watch("type");
  const selectedScopes = form.watch("scopes");

  const handleClose = () => {
    setStep(1);
    form.reset();
    onOpenChange(false);
  };

  const handleNext = async () => {
    if (step === 1) {
      const valid = await form.trigger(["title", "type"]);
      if (valid) setStep(2);
    } else if (step === 2) {
      const valid = await form.trigger(["scopes"]);
      if (valid) setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      handleClose();
    } catch (error) {
      console.error("Error creating report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Criar Novo Relatório
          </DialogTitle>
          <DialogDescription>
            Configure as opções do relatório de emissões
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s === step
                    ? "bg-primary text-white"
                    : s < step
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-24 h-1 mx-2 rounded ${
                    s < step ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Informações Básicas</h3>

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Relatório</FormLabel>
                      <div className="grid grid-cols-2 gap-3">
                        {reportTypes.map((type) => (
                          <div
                            key={type.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              field.value === type.id
                                ? "border-primary bg-primary/5 ring-2 ring-primary"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => field.onChange(type.id)}
                          >
                            <div className="flex items-center gap-3">
                              <type.icon className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium">{type.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {type.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título do Relatório</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Inventário GEE 2024" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Descrição adicional do relatório..."
                          rows={2}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Scope & Filters */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Escopos e Filtros</h3>

                <FormField
                  control={form.control}
                  name="scopes"
                  render={() => (
                    <FormItem>
                      <FormLabel>Escopos a Incluir</FormLabel>
                      <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3].map((scope) => (
                          <FormField
                            key={scope}
                            control={form.control}
                            name="scopes"
                            render={({ field }) => (
                              <FormItem
                                className={`flex items-center space-x-3 space-y-0 p-4 border rounded-lg cursor-pointer transition-all ${
                                  field.value?.includes(scope)
                                    ? "border-primary bg-primary/5"
                                    : "border-gray-200"
                                }`}
                                onClick={() => {
                                  const newValue = field.value?.includes(scope)
                                    ? field.value.filter((v) => v !== scope)
                                    : [...(field.value || []), scope];
                                  field.onChange(newValue);
                                }}
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(scope)}
                                    onCheckedChange={(checked) => {
                                      const newValue = checked
                                        ? [...(field.value || []), scope]
                                        : field.value?.filter((v) => v !== scope);
                                      field.onChange(newValue);
                                    }}
                                  />
                                </FormControl>
                                <div>
                                  <FormLabel className="text-sm font-medium cursor-pointer">
                                    Escopo {scope}
                                  </FormLabel>
                                  <p className="text-xs text-muted-foreground">
                                    {scope === 1 && "Emissões diretas"}
                                    {scope === 2 && "Energia adquirida"}
                                    {scope === 3 && "Outras indiretas"}
                                  </p>
                                </div>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateRange.startMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mês Inicial (opcional)</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(parseInt(v))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Ano completo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {months.map((month, idx) => (
                              <SelectItem key={idx} value={(idx + 1).toString()}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateRange.endMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mês Final (opcional)</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(parseInt(v))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Ano completo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {months.map((month, idx) => (
                              <SelectItem key={idx} value={(idx + 1).toString()}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                {selectedType === "CUSTOM" && (
                  <FormField
                    control={form.control}
                    name="categories"
                    render={() => (
                      <FormItem>
                        <FormLabel>Categorias Específicas (opcional)</FormLabel>
                        <FormDescription>
                          Deixe vazio para incluir todas as categorias
                        </FormDescription>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                          {Object.entries(categoryLabels).map(([key, label]) => (
                            <FormField
                              key={key}
                              control={form.control}
                              name="categories"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(key)}
                                      onCheckedChange={(checked) => {
                                        const newValue = checked
                                          ? [...(field.value || []), key]
                                          : field.value?.filter((v) => v !== key);
                                        field.onChange(newValue);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    {label}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {/* Step 3: Options & Details */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Opções do Relatório</h3>

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="includeCharts"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <PieChart className="h-5 w-5 text-primary" />
                          <div>
                            <FormLabel className="cursor-pointer">Incluir Gráficos</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Gráficos de pizza e barras por escopo
                            </p>
                          </div>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="includeDetails"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="h-5 w-5 text-primary" />
                          <div>
                            <FormLabel className="cursor-pointer">Incluir Detalhamento</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Tabelas detalhadas por categoria
                            </p>
                          </div>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="includeMethodology"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <FormLabel className="cursor-pointer">Incluir Metodologia</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Descrição dos métodos de cálculo
                            </p>
                          </div>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-3">Responsável pelo Relatório (opcional)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="responsibleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome completo" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="responsibleRole"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Gerente de Sustentabilidade" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <h4 className="font-medium mb-2">Resumo do Relatório</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      <strong>Tipo:</strong>{" "}
                      {reportTypes.find((t) => t.id === selectedType)?.name}
                    </p>
                    <p>
                      <strong>Escopos:</strong>{" "}
                      {selectedScopes?.sort().join(", ") || "Nenhum"}
                    </p>
                    <p>
                      <strong>Ano Base:</strong> {inventoryYear}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={step === 1 ? handleClose : handleBack}
              >
                {step === 1 ? (
                  "Cancelar"
                ) : (
                  <>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </>
                )}
              </Button>

              {step < 3 ? (
                <Button type="button" onClick={handleNext}>
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Gerar Relatório
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
