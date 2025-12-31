"use client";

import { InventoryProvider } from "@/contexts/inventory-context";

export function InventoryProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <InventoryProvider>{children}</InventoryProvider>;
}
