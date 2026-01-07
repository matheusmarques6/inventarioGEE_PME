"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  Plus,
  Trash2,
  Save,
  X,
  Loader2,
  Copy,
  CheckSquare,
  Square,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface ColumnDef {
  id: string;
  header: string;
  type: "text" | "number" | "select" | "month" | "readonly";
  options?: { value: string; label: string }[];
  width?: string;
  required?: boolean;
  placeholder?: string;
  format?: (value: unknown) => string;
}

export interface DataRow {
  id: string;
  isNew?: boolean;
  isEditing?: boolean;
  isSelected?: boolean;
  [key: string]: unknown;
}

interface ActivityDataGridProps {
  columns: ColumnDef[];
  data: DataRow[];
  onSave: (rows: DataRow[]) => Promise<{ success: boolean; errors?: string[] }>;
  onDelete: (ids: string[]) => Promise<{ success: boolean; errors?: string[] }>;
  onRefresh: () => void;
  emptyMessage?: string;
  isLoading?: boolean;
  defaultNewRow?: Partial<DataRow>;
}

const months = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

export function ActivityDataGrid({
  columns,
  data,
  onSave,
  onDelete,
  onRefresh,
  emptyMessage = "Nenhum dado registrado",
  isLoading = false,
  defaultNewRow = {},
}: ActivityDataGridProps) {
  const [rows, setRows] = useState<DataRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with external data
  useEffect(() => {
    setRows(data.map(row => ({ ...row, isEditing: false, isSelected: false })));
    setSelectedIds(new Set());
    setPendingChanges(new Set());
  }, [data]);

  // Focus input when editing
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === rows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map(r => r.id)));
    }
  }, [rows, selectedIds.size]);

  const handleSelectRow = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleAddRow = useCallback(() => {
    const newRow: DataRow = {
      id: `new-${Date.now()}`,
      isNew: true,
      isEditing: true,
      ...defaultNewRow,
    };
    setRows(prev => [newRow, ...prev]);
    setPendingChanges(prev => new Set(prev).add(newRow.id));
  }, [defaultNewRow]);

  const handleAddMultipleRows = useCallback((count: number) => {
    const newRows: DataRow[] = [];
    for (let i = 0; i < count; i++) {
      newRows.push({
        id: `new-${Date.now()}-${i}`,
        isNew: true,
        isEditing: true,
        ...defaultNewRow,
      });
    }
    setRows(prev => [...newRows, ...prev]);
    setPendingChanges(prev => {
      const next = new Set(prev);
      newRows.forEach(r => next.add(r.id));
      return next;
    });
  }, [defaultNewRow]);

  const handleDuplicateRows = useCallback(() => {
    const selectedRows = rows.filter(r => selectedIds.has(r.id));
    const duplicates = selectedRows.map((row, idx) => ({
      ...row,
      id: `new-${Date.now()}-${idx}`,
      isNew: true,
      isEditing: true,
    }));
    setRows(prev => [...duplicates, ...prev]);
    setPendingChanges(prev => {
      const next = new Set(prev);
      duplicates.forEach(r => next.add(r.id));
      return next;
    });
    setSelectedIds(new Set());
    toast({ title: `${duplicates.length} linha(s) duplicada(s)` });
  }, [rows, selectedIds]);

  const handleCellChange = useCallback((rowId: string, colId: string, value: unknown) => {
    setRows(prev => prev.map(row => {
      if (row.id === rowId) {
        return { ...row, [colId]: value };
      }
      return row;
    }));
    setPendingChanges(prev => new Set(prev).add(rowId));
  }, []);

  const handleCancelNewRow = useCallback((rowId: string) => {
    setRows(prev => prev.filter(r => r.id !== rowId));
    setPendingChanges(prev => {
      const next = new Set(prev);
      next.delete(rowId);
      return next;
    });
  }, []);

  const handleSaveChanges = useCallback(async () => {
    const changedRows = rows.filter(r => pendingChanges.has(r.id));
    if (changedRows.length === 0) return;

    setIsSaving(true);
    try {
      const result = await onSave(changedRows);
      if (result.success) {
        toast({
          title: "Dados salvos",
          description: `${changedRows.length} registro(s) salvo(s) com sucesso.`,
        });
        setPendingChanges(new Set());
        onRefresh();
      } else if (result.errors && result.errors.length > 0) {
        toast({
          title: "Erro ao salvar",
          description: result.errors.join(", "),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [rows, pendingChanges, onSave, onRefresh]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    try {
      // Separate new (unsaved) rows from existing ones
      const newRowIds = Array.from(selectedIds).filter(id => id.startsWith("new-"));
      const existingIds = Array.from(selectedIds).filter(id => !id.startsWith("new-"));

      // Remove new rows locally
      if (newRowIds.length > 0) {
        setRows(prev => prev.filter(r => !newRowIds.includes(r.id)));
        newRowIds.forEach(id => {
          setPendingChanges(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        });
      }

      // Delete existing rows from API
      if (existingIds.length > 0) {
        const result = await onDelete(existingIds);
        if (result.success) {
          toast({
            title: "Registros excluídos",
            description: `${existingIds.length} registro(s) excluído(s) com sucesso.`,
          });
          onRefresh();
        } else if (result.errors && result.errors.length > 0) {
          toast({
            title: "Erro ao excluir",
            description: result.errors.join(", "),
            variant: "destructive",
          });
        }
      } else if (newRowIds.length > 0) {
        toast({
          title: "Linhas removidas",
          description: `${newRowIds.length} linha(s) removida(s).`,
        });
      }

      setSelectedIds(new Set());
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  }, [selectedIds, onDelete, onRefresh]);

  const renderCell = (row: DataRow, column: ColumnDef) => {
    const value = row[column.id];
    const isEditing = editingCell?.rowId === row.id && editingCell?.colId === column.id;
    const isNewRow = row.isNew;
    const hasChanges = pendingChanges.has(row.id);

    if (column.type === "readonly") {
      return (
        <span className={cn("tabular-nums", hasChanges && "text-orange-600 font-medium")}>
          {column.format ? column.format(value) : String(value ?? "-")}
        </span>
      );
    }

    if (column.type === "select") {
      return (
        <Select
          value={String(value ?? "")}
          onValueChange={(v) => handleCellChange(row.id, column.id, v)}
        >
          <SelectTrigger className={cn(
            "h-8 border-0 bg-transparent hover:bg-muted/50 focus:ring-1",
            hasChanges && "text-orange-600"
          )}>
            <SelectValue placeholder={column.placeholder || "Selecione"} />
          </SelectTrigger>
          <SelectContent>
            {column.options?.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (column.type === "month") {
      return (
        <Select
          value={value ? String(value) : ""}
          onValueChange={(v) => handleCellChange(row.id, column.id, v ? parseInt(v) : undefined)}
        >
          <SelectTrigger className={cn(
            "h-8 border-0 bg-transparent hover:bg-muted/50 focus:ring-1",
            hasChanges && "text-orange-600"
          )}>
            <SelectValue placeholder="Anual" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Anual</SelectItem>
            {months.map(m => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Text or number - show input on click
    if (isEditing || isNewRow) {
      return (
        <Input
          ref={isEditing ? inputRef : undefined}
          type={column.type === "number" ? "number" : "text"}
          step={column.type === "number" ? "0.01" : undefined}
          value={value !== undefined && value !== null ? String(value) : ""}
          onChange={(e) => {
            const val = column.type === "number"
              ? (e.target.value ? parseFloat(e.target.value) : undefined)
              : e.target.value;
            handleCellChange(row.id, column.id, val);
          }}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setEditingCell(null);
            }
            if (e.key === "Escape") {
              setEditingCell(null);
            }
          }}
          placeholder={column.placeholder}
          className={cn(
            "h-8 border-0 bg-transparent focus:bg-white focus:border focus:ring-1",
            hasChanges && "text-orange-600"
          )}
        />
      );
    }

    // Display mode - click to edit
    return (
      <div
        className={cn(
          "cursor-pointer px-2 py-1 rounded hover:bg-muted/50 min-h-[32px] flex items-center",
          hasChanges && "text-orange-600 font-medium"
        )}
        onClick={() => setEditingCell({ rowId: row.id, colId: column.id })}
      >
        {column.format ? column.format(value) : (value !== undefined && value !== null ? String(value) : "-")}
      </div>
    );
  };

  const hasSelection = selectedIds.size > 0;
  const hasPendingChanges = pendingChanges.size > 0;
  const allSelected = rows.length > 0 && selectedIds.size === rows.length;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleAddRow}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar 1 linha
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddMultipleRows(5)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar 5 linhas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddMultipleRows(10)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar 10 linhas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {hasSelection && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicateRows}
              >
                <Copy className="h-4 w-4 mr-1" />
                Duplicar ({selectedIds.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir ({selectedIds.size})
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasPendingChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              {pendingChanges.size} alteração(ões) pendente(s)
            </Badge>
          )}
          {hasPendingChanges && (
            <Button
              size="sm"
              onClick={handleSaveChanges}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Salvar Alterações
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
                {columns.map(col => (
                  <TableHead
                    key={col.id}
                    style={{ width: col.width }}
                    className={cn(col.required && "after:content-['*'] after:text-destructive after:ml-0.5")}
                  >
                    {col.header}
                  </TableHead>
                ))}
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="h-32 text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(row => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "group",
                      selectedIds.has(row.id) && "bg-primary/5",
                      row.isNew && "bg-green-50",
                      pendingChanges.has(row.id) && !row.isNew && "bg-orange-50"
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(row.id)}
                        onCheckedChange={() => handleSelectRow(row.id)}
                        aria-label={`Selecionar linha ${row.id}`}
                      />
                    </TableCell>
                    {columns.map(col => (
                      <TableCell key={col.id} className="p-1">
                        {renderCell(row, col)}
                      </TableCell>
                    ))}
                    <TableCell className="p-1">
                      {row.isNew ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100"
                          onClick={() => handleCancelNewRow(row.id)}
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              const duplicate: DataRow = {
                                ...row,
                                id: `new-${Date.now()}`,
                                isNew: true,
                              };
                              setRows(prev => [duplicate, ...prev]);
                              setPendingChanges(prev => new Set(prev).add(duplicate.id));
                            }}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedIds(new Set([row.id]));
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Stats */}
      {rows.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
          <span>{rows.length} registro(s)</span>
          {hasSelection && (
            <span>{selectedIds.size} selecionado(s)</span>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedIds.size} registro(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Os registros selecionados e suas
              emissões calculadas serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
