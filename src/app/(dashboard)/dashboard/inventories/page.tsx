import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, MoreHorizontal, FileText, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data - will be replaced with real database queries
const inventories = [
  {
    id: "1",
    name: "Inventário 2024",
    baseYear: 2024,
    status: "DRAFT",
    totalEmissions: 12450.5,
    scope1: 5230.2,
    scope2: 3120.8,
    scope3: 4099.5,
    updatedAt: new Date("2024-12-15"),
  },
  {
    id: "2",
    name: "Inventário 2023",
    baseYear: 2023,
    status: "PUBLISHED",
    totalEmissions: 13200.0,
    scope1: 5800.0,
    scope2: 3400.0,
    scope3: 4000.0,
    updatedAt: new Date("2024-03-20"),
  },
  {
    id: "3",
    name: "Inventário 2022",
    baseYear: 2022,
    status: "VERIFIED",
    totalEmissions: 14100.0,
    scope1: 6100.0,
    scope2: 3600.0,
    scope3: 4400.0,
    updatedAt: new Date("2023-03-15"),
  },
];

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "info" }
> = {
  DRAFT: { label: "Rascunho", variant: "secondary" },
  IN_REVIEW: { label: "Em Revisão", variant: "warning" },
  SUBMITTED: { label: "Submetido", variant: "info" },
  VERIFIED: { label: "Verificado", variant: "success" },
  PUBLISHED: { label: "Publicado", variant: "success" },
};

export default async function InventoriesPage() {
  const { userId } = await auth();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventários</h1>
          <p className="text-muted-foreground">
            Gerencie seus inventários de emissões de GEE
          </p>
        </div>
        <Link href="/dashboard/inventories/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Inventário
          </Button>
        </Link>
      </div>

      {/* Inventories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Todos os Inventários</CardTitle>
          <CardDescription>
            Lista de todos os inventários da sua organização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Ano Base</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Escopo 1</TableHead>
                <TableHead className="text-right">Escopo 2</TableHead>
                <TableHead className="text-right">Escopo 3</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventories.map((inventory) => (
                <TableRow key={inventory.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/inventories/${inventory.id}`}
                      className="font-medium hover:underline"
                    >
                      {inventory.name}
                    </Link>
                  </TableCell>
                  <TableCell>{inventory.baseYear}</TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[inventory.status].variant}>
                      {statusConfig[inventory.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {inventory.scope1.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    {inventory.scope2.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    {inventory.scope3.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {inventory.totalEmissions.toLocaleString("pt-BR")} tCO₂e
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {inventory.updatedAt.toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/inventories/${inventory.id}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Exportar Relatório
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
