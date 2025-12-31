"use client";

import { useInventory } from "@/contexts/inventory-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2 } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" }> = {
  DRAFT: { label: "Rascunho", variant: "secondary" },
  IN_REVIEW: { label: "Em Revisão", variant: "warning" },
  SUBMITTED: { label: "Submetido", variant: "default" },
  VERIFIED: { label: "Verificado", variant: "success" },
  PUBLISHED: { label: "Publicado", variant: "success" },
};

export function InventorySelector() {
  const { inventories, currentInventory, isLoading, selectInventoryById } = useInventory();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Carregando...</span>
      </div>
    );
  }

  if (inventories.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span className="text-sm">Nenhum inventário</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Select
        value={currentInventory?.id || ""}
        onValueChange={(value) => selectInventoryById(value)}
      >
        <SelectTrigger className="w-[220px] bg-white">
          <SelectValue placeholder="Selecione um inventário" />
        </SelectTrigger>
        <SelectContent>
          {inventories.map((inventory) => (
            <SelectItem key={inventory.id} value={inventory.id}>
              <div className="flex items-center gap-2">
                <span>{inventory.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({inventory.baseYear})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentInventory && (
        <Badge variant={statusConfig[currentInventory.status]?.variant || "secondary"}>
          {statusConfig[currentInventory.status]?.label || currentInventory.status}
        </Badge>
      )}
    </div>
  );
}
