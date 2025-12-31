"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface Inventory {
  id: string;
  name: string;
  baseYear: number;
  status: string;
  gwpReference: string;
  includeScope1: boolean;
  includeScope2: boolean;
  includeScope3: boolean;
  totalEmissionsScope1?: number;
  totalEmissionsScope2?: number;
  totalEmissionsScope3?: number;
  totalBiogenicEmissions?: number;
  totalRemovals?: number;
  _count?: {
    activityData: number;
    emissionResults: number;
  };
}

interface InventoryContextType {
  inventories: Inventory[];
  currentInventory: Inventory | null;
  isLoading: boolean;
  error: string | null;
  fetchInventories: () => Promise<void>;
  setCurrentInventory: (inventory: Inventory | null) => void;
  selectInventoryById: (id: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [currentInventory, setCurrentInventory] = useState<Inventory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/inventories");

      if (!response.ok) {
        throw new Error("Erro ao carregar inventários");
      }

      const data = await response.json();
      setInventories(data);

      // Auto-select the most recent inventory if none selected
      if (data.length > 0 && !currentInventory) {
        // Find draft or most recent
        const draft = data.find((inv: Inventory) => inv.status === "DRAFT");
        setCurrentInventory(draft || data[0]);
      }
    } catch (err) {
      console.error("Error fetching inventories:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  }, [currentInventory]);

  const selectInventoryById = useCallback((id: string) => {
    const inventory = inventories.find((inv) => inv.id === id);
    if (inventory) {
      setCurrentInventory(inventory);
    }
  }, [inventories]);

  useEffect(() => {
    fetchInventories();
  }, [fetchInventories]);

  return (
    <InventoryContext.Provider
      value={{
        inventories,
        currentInventory,
        isLoading,
        error,
        fetchInventories,
        setCurrentInventory,
        selectInventoryById,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
}
