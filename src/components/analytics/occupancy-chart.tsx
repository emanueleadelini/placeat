"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Prenotazione, Tavolo } from "@/lib/types";

interface OccupancyChartProps {
  reservations: Prenotazione[];
  tables: Tavolo[];
  isLoading: boolean;
}

interface OccupancyData {
  name: string;
  value: number;
  color: string;
}

export function OccupancyChart({ reservations, tables, isLoading }: OccupancyChartProps) {
  const data: OccupancyData[] = useMemo(() => {
    const activeTables = tables.filter((t) => t.attivo !== false);
    const totalTables = activeTables.length;
    
    // Get unique table IDs from confirmed/completed reservations
    const bookedTableIds = new Set(
      reservations
        .filter((r) => r.stato !== "cancellata")
        .map((r) => r.tavoloId)
    );
    
    const bookedTables = bookedTableIds.size;
    const availableTables = totalTables - bookedTables;

    return [
      {
        name: "Occupati",
        value: bookedTables,
        color: "hsl(var(--primary))",
      },
      {
        name: "Disponibili",
        value: Math.max(0, availableTables),
        color: "hsl(var(--muted))",
      },
    ];
  }, [reservations, tables]);

  const occupancyRate = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return 0;
    const booked = data.find((d) => d.name === "Occupati")?.value || 0;
    return Math.round((booked / total) * 100);
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Occupazione Tavoli</span>
          <div className="text-lg font-bold text-primary">{occupancyRate}%</div>
        </CardTitle>
        <CardDescription>
          Stato attuale dei tavoli
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [`${value} tavoli`, name]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value: string) => (
                  <span className="text-sm text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div className="rounded-lg bg-muted p-2">
            <div className="text-2xl font-bold text-primary">
              {data.find((d) => d.name === "Occupati")?.value || 0}
            </div>
            <div className="text-xs text-muted-foreground">Occupati</div>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <div className="text-2xl font-bold">
              {data.find((d) => d.name === "Disponibili")?.value || 0}
            </div>
            <div className="text-xs text-muted-foreground">Disponibili</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
