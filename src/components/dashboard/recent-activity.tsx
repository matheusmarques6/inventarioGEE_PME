"use client";

import { useEffect, useState } from "react";
import { useInventory } from "@/contexts/inventory-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Plus,
  FileSpreadsheet,
  Calculator,
  Trash2,
  RefreshCw,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_email: string;
  created_at: string;
  new_value?: Record<string, unknown>;
  old_value?: Record<string, unknown>;
}

const ACTION_ICONS: Record<string, typeof Plus> = {
  CREATE: Plus,
  UPDATE: RefreshCw,
  DELETE: Trash2,
  CALCULATE: Calculator,
  BULK_IMPORT: FileSpreadsheet,
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Criou",
  UPDATE: "Atualizou",
  DELETE: "Excluiu",
  CALCULATE: "Calculou",
  BULK_IMPORT: "Importou",
};

const ENTITY_LABELS: Record<string, string> = {
  ActivityData: "dado de atividade",
  EmissionResult: "resultado de emissão",
  Inventory: "inventário",
};

export function RecentActivity() {
  const { currentInventory } = useInventory();
  const [activities, setActivities] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      if (!currentInventory) {
        setActivities([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/inventories/${currentInventory.id}/activity-log?limit=10`
        );
        if (response.ok) {
          const data = await response.json();
          setActivities(data.logs || []);
        } else {
          setActivities([]);
        }
      } catch (error) {
        console.error("Error fetching activity log:", error);
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivities();
  }, [currentInventory]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentInventory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">
            Selecione um inventário para ver a atividade
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Atividade Recente
        </CardTitle>
        <CardDescription>
          Últimas ações no inventário
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="h-[200px] flex flex-col items-center justify-center gap-2">
            <Clock className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">
              Nenhuma atividade registrada ainda
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[280px]">
            <div className="space-y-4">
              {activities.map((activity) => {
                const Icon = ACTION_ICONS[activity.action] || RefreshCw;
                const actionLabel = ACTION_LABELS[activity.action] || activity.action;
                const entityLabel = ENTITY_LABELS[activity.entity_type] || activity.entity_type;
                const timeAgo = formatDistanceToNow(new Date(activity.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                });

                // Get additional info from new_value
                let details = "";
                if (activity.new_value) {
                  if (activity.action === "BULK_IMPORT") {
                    const nv = activity.new_value as { successCount?: number; category?: string };
                    details = `${nv.successCount || 0} registros`;
                  } else if (activity.action === "CALCULATE") {
                    const nv = activity.new_value as { resultCount?: number };
                    details = `${nv.resultCount || 0} resultados`;
                  }
                }

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 pb-3 border-b last:border-0"
                  >
                    <div className="p-2 rounded-full bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{actionLabel}</span>{" "}
                        <span className="text-muted-foreground">{entityLabel}</span>
                        {details && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {details}
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.user_email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
