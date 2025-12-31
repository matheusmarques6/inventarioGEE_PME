import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(
  value: number | string | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined) return "-";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "-";
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCO2e(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "-";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "-";

  if (Math.abs(num) >= 1000000) {
    return `${formatNumber(num / 1000000)} MtCO₂e`;
  } else if (Math.abs(num) >= 1000) {
    return `${formatNumber(num / 1000)} ktCO₂e`;
  }
  return `${formatNumber(num)} tCO₂e`;
}

export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return `${formatNumber(value * 100, 1)}%`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("pt-BR");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function validateCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, "");

  if (cnpj.length !== 14) return false;

  // Check for known invalid patterns
  if (/^(\d)\1+$/.test(cnpj)) return false;

  // Validate first check digit
  let sum = 0;
  let weight = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj[i]) * weight[i];
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cnpj[12]) !== digit) return false;

  // Validate second check digit
  sum = 0;
  weight = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj[i]) * weight[i];
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cnpj[13]) !== digit) return false;

  return true;
}

export function formatCNPJ(cnpj: string): string {
  cnpj = cnpj.replace(/[^\d]/g, "");
  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

export function getScopeColor(scope: number): string {
  switch (scope) {
    case 1:
      return "hsl(0, 84%, 60%)"; // Red
    case 2:
      return "hsl(217, 91%, 60%)"; // Blue
    case 3:
      return "hsl(142, 71%, 45%)"; // Green
    default:
      return "hsl(215, 16%, 47%)"; // Gray
  }
}

export function getScopeName(scope: number): string {
  switch (scope) {
    case 1:
      return "Escopo 1 - Emissões Diretas";
    case 2:
      return "Escopo 2 - Energia Indireta";
    case 3:
      return "Escopo 3 - Outras Indiretas";
    default:
      return `Escopo ${scope}`;
  }
}
