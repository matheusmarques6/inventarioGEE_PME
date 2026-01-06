"use client";

import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import {
  Upload,
  Download,
  FileSpreadsheet,
  Check,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface FieldMapping {
  id: string;
  label: string;
  required: boolean;
  description?: string;
}

interface ExcelImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  fields: FieldMapping[];
  templateData: Record<string, string | number>[];
  templateFileName: string;
  onImport: (data: Record<string, unknown>[]) => Promise<{ success: number; errors: string[] }>;
}

type ImportStep = "upload" | "mapping" | "preview" | "importing" | "complete";

export function ExcelImportModal({
  open,
  onOpenChange,
  title,
  description,
  fields,
  templateData,
  templateFileName,
  onImport,
}: ExcelImportModalProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [excelData, setExcelData] = useState<Record<string, unknown>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const resetState = useCallback(() => {
    setStep("upload");
    setFile(null);
    setExcelColumns([]);
    setExcelData([]);
    setColumnMapping({});
    setImportProgress(0);
    setImportResult(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onOpenChange(false);
  }, [resetState, onOpenChange]);

  const downloadTemplate = useCallback(() => {
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");

    // Auto-size columns
    const colWidths = Object.keys(templateData[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, templateFileName);
    toast({
      title: "Modelo baixado",
      description: "Preencha a planilha e importe novamente.",
    });
  }, [templateData, templateFileName]);

  const processFile = useCallback(async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

      if (jsonData.length === 0) {
        toast({
          title: "Planilha vazia",
          description: "A planilha não contém dados.",
          variant: "destructive",
        });
        return;
      }

      // Get column names from first row
      const columns = Object.keys(jsonData[0]);
      setExcelColumns(columns);
      setExcelData(jsonData);
      setFile(file);

      // Try to auto-map columns based on similar names
      const autoMapping: Record<string, string> = {};
      fields.forEach((field) => {
        // Normalize strings for comparison (remove accents, lowercase)
        const normalizeStr = (str: string) =>
          str.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");

        const fieldLabelNorm = normalizeStr(field.label);
        const fieldIdNorm = normalizeStr(field.id);

        const matchingColumn = columns.find((col) => {
          const colNorm = normalizeStr(col);
          return (
            colNorm === fieldLabelNorm ||
            colNorm === fieldIdNorm ||
            colNorm.includes(fieldLabelNorm) ||
            fieldLabelNorm.includes(colNorm) ||
            // Also check without spaces
            colNorm.replace(/\s/g, "") === fieldLabelNorm.replace(/\s/g, "")
          );
        });
        if (matchingColumn) {
          autoMapping[field.id] = matchingColumn;
        }
      });
      setColumnMapping(autoMapping);

      setStep("mapping");
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Erro ao processar arquivo",
        description: "Verifique se o arquivo é uma planilha válida.",
        variant: "destructive",
      });
    }
  }, [fields]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls"))) {
        processFile(droppedFile);
      } else {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls)",
          variant: "destructive",
        });
      }
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        processFile(selectedFile);
      }
    },
    [processFile]
  );

  const validateMapping = useCallback(() => {
    const missingRequired = fields
      .filter((f) => f.required && !columnMapping[f.id])
      .map((f) => f.label);

    if (missingRequired.length > 0) {
      toast({
        title: "Campos obrigatórios não mapeados",
        description: `Mapeie: ${missingRequired.join(", ")}`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  }, [fields, columnMapping]);

  const handleProceedToPreview = useCallback(() => {
    if (validateMapping()) {
      setStep("preview");
    }
  }, [validateMapping]);

  const getMappedData = useCallback(() => {
    return excelData.map((row) => {
      const mappedRow: Record<string, unknown> = {};
      Object.entries(columnMapping).forEach(([fieldId, columnName]) => {
        if (columnName) {
          mappedRow[fieldId] = row[columnName];
        }
      });
      return mappedRow;
    });
  }, [excelData, columnMapping]);

  const handleImport = useCallback(async () => {
    setStep("importing");
    setImportProgress(0);

    const mappedData = getMappedData();

    // Simulate progress
    const progressInterval = setInterval(() => {
      setImportProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const result = await onImport(mappedData);
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(result);
      setStep("complete");
    } catch (error) {
      clearInterval(progressInterval);
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      setStep("preview");
    }
  }, [getMappedData, onImport]);

  const previewData = step === "preview" ? getMappedData().slice(0, 5) : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Step: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-gray-200"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                Arraste sua planilha aqui
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                ou clique para selecionar um arquivo Excel (.xlsx, .xls)
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="excel-upload"
              />
              <label htmlFor="excel-upload">
                <Button variant="outline" asChild>
                  <span>Selecionar Arquivo</span>
                </Button>
              </label>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>ou</span>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={downloadTemplate}
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar Planilha Modelo
            </Button>
          </div>
        )}

        {/* Step: Mapping */}
        {step === "mapping" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{file?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {excelData.length} linhas encontradas
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={resetState}>
                Trocar arquivo
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Campo do Sistema</TableHead>
                    <TableHead className="w-1/3">Coluna da Planilha</TableHead>
                    <TableHead className="w-1/3">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{field.label}</span>
                          {field.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                          {field.description && (
                            <p className="text-xs text-muted-foreground">
                              {field.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={columnMapping[field.id] || "__none__"}
                          onValueChange={(value) =>
                            setColumnMapping((prev) => ({
                              ...prev,
                              [field.id]: value === "__none__" ? "" : value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Não mapear</SelectItem>
                            {excelColumns.map((col) => (
                              <SelectItem key={col} value={col}>
                                {col}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {columnMapping[field.id] ? (
                          <Badge variant="success" className="bg-green-100 text-green-700">
                            <Check className="h-3 w-3 mr-1" />
                            Mapeado
                          </Badge>
                        ) : field.required ? (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Obrigatório
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Opcional</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={resetState}>
                Voltar
              </Button>
              <Button onClick={handleProceedToPreview}>
                Continuar para Prévia
              </Button>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>{excelData.length}</strong> registros serão importados.
                Confira os primeiros 5 abaixo:
              </p>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {fields
                      .filter((f) => columnMapping[f.id])
                      .map((field) => (
                        <TableHead key={field.id}>{field.label}</TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, idx) => (
                    <TableRow key={idx}>
                      {fields
                        .filter((f) => columnMapping[f.id])
                        .map((field) => (
                          <TableCell key={field.id}>
                            {String(row[field.id] ?? "-")}
                          </TableCell>
                        ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("mapping")}>
                Voltar ao Mapeamento
              </Button>
              <Button onClick={handleImport}>
                Importar {excelData.length} Registros
              </Button>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === "importing" && (
          <div className="py-8 space-y-4 text-center">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <p className="font-medium">Importando dados...</p>
            <Progress value={importProgress} className="max-w-md mx-auto" />
            <p className="text-sm text-muted-foreground">
              {importProgress}% concluído
            </p>
          </div>
        )}

        {/* Step: Complete */}
        {step === "complete" && importResult && (
          <div className="py-8 space-y-4 text-center">
            {importResult.success > 0 ? (
              <div className="bg-green-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            ) : (
              <div className="bg-red-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto">
                <X className="h-8 w-8 text-red-600" />
              </div>
            )}

            <div>
              <p className="font-medium text-lg">Importação Concluída</p>
              <p className="text-sm text-muted-foreground">
                {importResult.success} registro(s) importado(s) com sucesso
              </p>
            </div>

            {importResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left max-h-40 overflow-y-auto">
                <p className="font-medium text-red-800 mb-2">
                  Erros ({importResult.errors.length}):
                </p>
                <ul className="text-sm text-red-700 space-y-1">
                  {importResult.errors.slice(0, 10).map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                  {importResult.errors.length > 10 && (
                    <li>... e mais {importResult.errors.length - 10} erros</li>
                  )}
                </ul>
              </div>
            )}

            <Button onClick={handleClose}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
