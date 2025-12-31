"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Database,
  Settings,
  Building2,
  Calculator,
  Download,
  Users,
  Leaf,
  Factory,
  Truck,
  Zap,
  Flame,
  TreePine,
  Trash2,
} from "lucide-react";

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Inventários",
    href: "/dashboard/inventories",
    icon: FileText,
  },
  {
    title: "Unidades",
    href: "/dashboard/units",
    icon: Building2,
  },
];

const scopeNavItems = [
  {
    title: "Escopo 1",
    items: [
      { title: "Combustão Estacionária", href: "/dashboard/scope1/stationary", icon: Factory },
      { title: "Combustão Móvel", href: "/dashboard/scope1/mobile", icon: Truck },
      { title: "Fugitivas", href: "/dashboard/scope1/fugitive", icon: Flame },
      { title: "Florestas", href: "/dashboard/scope1/forest", icon: TreePine },
      { title: "Fertilizantes", href: "/dashboard/scope1/fertilizer", icon: Leaf },
    ],
  },
  {
    title: "Escopo 2",
    items: [
      { title: "Eletricidade", href: "/dashboard/scope2/electricity", icon: Zap },
    ],
  },
  {
    title: "Escopo 3",
    items: [
      { title: "Transporte", href: "/dashboard/scope3/transport", icon: Truck },
      { title: "Resíduos", href: "/dashboard/scope3/waste", icon: Trash2 },
    ],
  },
];

const bottomNavItems = [
  {
    title: "Relatórios",
    href: "/dashboard/reports",
    icon: Download,
  },
  {
    title: "Usuários",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Configurações",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <Leaf className="h-8 w-8 text-primary" />
        <span className="text-xl font-bold">GEE Inventory</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {/* Main Nav */}
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          ))}
        </div>

        {/* Scope Navigation */}
        {scopeNavItems.map((section) => (
          <div key={section.title} className="mt-6">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="mt-2 space-y-1">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Nav */}
      <div className="border-t py-4 px-3">
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
