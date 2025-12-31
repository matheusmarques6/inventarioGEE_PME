"use client";

import { useState } from "react";
import { Plus, Building2, MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function UnitsPage() {
  const [units] = useState([
    { id: "1", name: "Matriz", type: "ADMINISTRATIVO", city: "São Paulo", state: "SP", isActive: true },
    { id: "2", name: "Fábrica 1", type: "INDUSTRIAL", city: "Campinas", state: "SP", isActive: true },
    { id: "3", name: "Centro de Distribuição", type: "LOGISTICO", city: "Guarulhos", state: "SP", isActive: true },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Unidades Operacionais</h1>
          <p className="text-muted-foreground">
            Gerencie as unidades da sua organização
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Unidade
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {units.map((unit) => (
          <Card key={unit.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{unit.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {unit.city}, {unit.state}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={unit.isActive ? "success" : "secondary"}>
                  {unit.isActive ? "Ativa" : "Inativa"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="outline">{unit.type}</Badge>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
