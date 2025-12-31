"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Building2,
  Download,
  Users,
  Leaf,
  Factory,
  Truck,
  Zap,
  Flame,
  TreePine,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

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
    color: "text-red-500",
    bgColor: "bg-red-50",
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
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    items: [
      { title: "Eletricidade", href: "/dashboard/scope2/electricity", icon: Zap },
    ],
  },
  {
    title: "Escopo 3",
    color: "text-green-500",
    bgColor: "bg-green-50",
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

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "Escopo 1": true,
    "Escopo 2": true,
    "Escopo 3": false,
  });

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isActiveRoute = (href: string) => pathname === href;
  const isSectionActive = (items: { href: string }[]) =>
    items.some((item) => pathname === item.href);

  return (
    <aside
      className={cn(
        "hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r overflow-hidden",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <div className="p-2 rounded-xl bg-primary/10">
          <Leaf className="h-6 w-6 text-primary" />
        </div>
        <div>
          <span className="text-lg font-bold text-foreground">GEE Inventory</span>
          <p className="text-xs text-muted-foreground">Inventário de Emissões</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        {/* Main Nav */}
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActiveRoute(item.href)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
            <button
              onClick={() => toggleSection(section.title)}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
                isSectionActive(section.items)
                  ? `${section.bgColor} ${section.color}`
                  : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    section.title === "Escopo 1" && "bg-red-500",
                    section.title === "Escopo 2" && "bg-blue-500",
                    section.title === "Escopo 3" && "bg-green-500"
                  )}
                />
                {section.title}
              </span>
              {expandedSections[section.title] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {expandedSections[section.title] && (
              <div className="mt-1 ml-4 space-y-0.5 animate-fade-in">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                      isActiveRoute(item.href)
                        ? `${section.bgColor} ${section.color} font-medium`
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom Nav */}
      <div className="border-t py-4 px-3 bg-gray-50/50">
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                isActiveRoute(item.href)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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

// Mobile sidebar content - same as above but for Sheet
export function MobileSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "Escopo 1": true,
    "Escopo 2": true,
    "Escopo 3": false,
  });

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isActiveRoute = (href: string) => pathname === href;
  const isSectionActive = (items: { href: string }[]) =>
    items.some((item) => pathname === item.href);

  const handleClick = () => {
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <div className="p-2 rounded-xl bg-primary/10">
          <Leaf className="h-6 w-6 text-primary" />
        </div>
        <div>
          <span className="text-lg font-bold text-foreground">GEE Inventory</span>
          <p className="text-xs text-muted-foreground">Inventário de Emissões</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        {/* Main Nav */}
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActiveRoute(item.href)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
            <button
              onClick={() => toggleSection(section.title)}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
                isSectionActive(section.items)
                  ? `${section.bgColor} ${section.color}`
                  : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    section.title === "Escopo 1" && "bg-red-500",
                    section.title === "Escopo 2" && "bg-blue-500",
                    section.title === "Escopo 3" && "bg-green-500"
                  )}
                />
                {section.title}
              </span>
              {expandedSections[section.title] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {expandedSections[section.title] && (
              <div className="mt-1 ml-4 space-y-0.5 animate-fade-in">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                      isActiveRoute(item.href)
                        ? `${section.bgColor} ${section.color} font-medium`
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom Nav */}
      <div className="border-t py-4 px-3 bg-gray-50/50">
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                isActiveRoute(item.href)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
