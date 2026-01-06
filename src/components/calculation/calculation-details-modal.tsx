"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  Database,
  Flame,
  Leaf,
  Info,
  BookOpen,
} from "lucide-react";

interface EmissionFactor {
  name: string;
  co2: number;
  ch4: number;
  n2o: number;
  energyContent: number;
  unit: string;
  density?: number;
  renewable: boolean;
  source: string;
}

interface FactorsSnapshot {
  emissionFactor?: EmissionFactor;
  energyContent?: number;
  fossilFraction?: number;
  renewableFraction?: number;
}

interface CalculationDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    sourceDescription: string;
    activityType: string;
    quantity: number;
    quantityUnit: string;
    year: number;
    co2Equivalent?: number;
    co2Mass?: number;
    ch4Mass?: number;
    n2oMass?: number;
    biogenicCo2?: number;
    factorsSnapshot?: FactorsSnapshot | null;
  } | null;
}

export function CalculationDetailsModal({
  open,
  onOpenChange,
  data,
}: CalculationDetailsModalProps) {
  if (!data) return null;

  const factors = data.factorsSnapshot;
  const emissionFactor = factors?.emissionFactor;

  // Calculate intermediate values for display
  const quantity = data.quantity;
  const unit = data.quantityUnit;

  // Energy calculation
  let energyGJ = 0;
  let convertedQuantity = quantity;

  if (emissionFactor) {
    // Unit conversion
    if (unit.toLowerCase() === "l" || unit.toLowerCase() === "litro") {
      convertedQuantity = quantity / 1000; // to m³
    } else if ((unit.toLowerCase() === "t" || unit.toLowerCase() === "ton") && emissionFactor.density) {
      convertedQuantity = (quantity * 1000) / emissionFactor.density; // to m³
    } else if (unit.toLowerCase() === "kg" && emissionFactor.density) {
      convertedQuantity = quantity / emissionFactor.density; // to m³
    }

    energyGJ = convertedQuantity * (factors?.energyContent || emissionFactor.energyContent);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Detalhes do Cálculo
          </DialogTitle>
          <DialogDescription>
            Metodologia e fatores de emissão utilizados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Activity Data Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Dados de Atividade
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Fonte:</span>
                <p className="font-medium">{data.sourceDescription}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Combustível:</span>
                <p className="font-medium">{data.activityType}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Quantidade:</span>
                <p className="font-medium">
                  {quantity.toLocaleString("pt-BR")} {unit}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Ano:</span>
                <p className="font-medium">{data.year}</p>
              </div>
            </div>
          </div>

          {/* Data Source */}
          {emissionFactor && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                Base de Dados
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-white">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {emissionFactor.source}
                </Badge>
                {emissionFactor.renewable ? (
                  <Badge className="bg-green-100 text-green-700">
                    <Leaf className="h-3 w-3 mr-1" />
                    Renovável
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-700">
                    Fóssil
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Os fatores de emissão seguem as diretrizes do IPCC 2006 para inventários nacionais de gases de efeito estufa.
              </p>
            </div>
          )}

          {/* Emission Factors Table */}
          {emissionFactor && (
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-purple-500" />
                Fatores de Emissão Utilizados
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Parâmetro</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Unidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Fator CO₂</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {emissionFactor.co2.toFixed(6)}
                      </TableCell>
                      <TableCell>tCO₂/GJ</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Fator CH₄</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {emissionFactor.ch4.toFixed(6)}
                      </TableCell>
                      <TableCell>tCH₄/GJ</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Fator N₂O</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {emissionFactor.n2o.toFixed(6)}
                      </TableCell>
                      <TableCell>tN₂O/GJ</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Conteúdo Energético</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {emissionFactor.energyContent.toFixed(4)}
                      </TableCell>
                      <TableCell>GJ/{emissionFactor.unit}</TableCell>
                    </TableRow>
                    {emissionFactor.density && (
                      <TableRow>
                        <TableCell className="font-medium">Densidade</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {emissionFactor.density}
                        </TableCell>
                        <TableCell>kg/{emissionFactor.unit}</TableCell>
                      </TableRow>
                    )}
                    {factors?.fossilFraction !== undefined && (
                      <TableRow>
                        <TableCell className="font-medium">Fração Fóssil</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {(factors.fossilFraction * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell>-</TableCell>
                      </TableRow>
                    )}
                    {factors?.renewableFraction !== undefined && factors.renewableFraction > 0 && (
                      <TableRow>
                        <TableCell className="font-medium">Fração Renovável</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {(factors.renewableFraction * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell>-</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <Separator />

          {/* Calculation Steps */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-green-500" />
              Memória de Cálculo
            </h3>
            <div className="space-y-3 text-sm">
              {emissionFactor && (
                <>
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-muted-foreground mb-1">1. Conversão de unidade:</p>
                    <p className="font-mono">
                      {quantity.toLocaleString("pt-BR")} {unit} → {convertedQuantity.toFixed(4)} {emissionFactor.unit}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-muted-foreground mb-1">2. Energia consumida:</p>
                    <p className="font-mono">
                      {convertedQuantity.toFixed(4)} {emissionFactor.unit} × {emissionFactor.energyContent} GJ/{emissionFactor.unit} = <strong>{energyGJ.toFixed(4)} GJ</strong>
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-muted-foreground mb-1">3. Emissões por gás:</p>
                    <div className="space-y-1 font-mono">
                      <p>CO₂: {energyGJ.toFixed(4)} GJ × {emissionFactor.co2} tCO₂/GJ = {(energyGJ * emissionFactor.co2).toFixed(6)} tCO₂</p>
                      <p>CH₄: {energyGJ.toFixed(4)} GJ × {emissionFactor.ch4} tCH₄/GJ = {(energyGJ * emissionFactor.ch4).toFixed(8)} tCH₄</p>
                      <p>N₂O: {energyGJ.toFixed(4)} GJ × {emissionFactor.n2o} tN₂O/GJ = {(energyGJ * emissionFactor.n2o).toFixed(8)} tN₂O</p>
                    </div>
                  </div>

                  {factors?.fossilFraction !== undefined && factors.fossilFraction < 1 && (
                    <div className="bg-yellow-50 rounded p-3">
                      <p className="text-muted-foreground mb-1">4. Aplicação da fração fóssil ({(factors.fossilFraction * 100).toFixed(1)}%):</p>
                      <p className="font-mono">
                        CO₂ antropogênico: {(energyGJ * emissionFactor.co2).toFixed(6)} × {factors.fossilFraction.toFixed(3)} = {(energyGJ * emissionFactor.co2 * factors.fossilFraction).toFixed(6)} tCO₂
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="bg-green-50 rounded p-3 border border-green-200">
                <p className="text-muted-foreground mb-1">Resultado Final (CO₂ equivalente):</p>
                <p className="font-mono text-lg">
                  <strong>{(data.co2Equivalent || 0).toFixed(4)} tCO₂e</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  * CO₂e calculado usando GWP: CO₂=1, CH₄=28, N₂O=265 (IPCC AR5)
                </p>
              </div>

              {data.biogenicCo2 !== undefined && data.biogenicCo2 > 0 && (
                <div className="bg-amber-50 rounded p-3 border border-amber-200">
                  <p className="text-muted-foreground mb-1">Emissões Biogênicas (reportadas separadamente):</p>
                  <p className="font-mono">
                    <strong>{data.biogenicCo2.toFixed(4)} tCO₂</strong>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Methodology Reference */}
          <div className="bg-gray-100 rounded-lg p-4 text-sm">
            <h4 className="font-medium mb-2">Referências Metodológicas</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• IPCC 2006 Guidelines for National Greenhouse Gas Inventories</li>
              <li>• GHG Protocol - Corporate Accounting and Reporting Standard</li>
              <li>• Programa Brasileiro GHG Protocol</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
