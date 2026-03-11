"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Users, Calendar } from "lucide-react";
import type { Prenotazione, Tavolo } from "@/lib/types";

interface TopTablesProps {
  reservations: Prenotazione[];
  tables: Tavolo[];
  isLoading: boolean;
}

interface TableStat {
  tableId: string;
  tableNumber: number;
  reservationCount: number;
  totalGuests: number;
  capacity: number;
}

export function TopTables({ reservations, tables, isLoading }: TopTablesProps) {
  const topTables: TableStat[] = useMemo(() => {
    const tableStats = new Map<string, TableStat>();

    // Initialize with all tables
    tables.forEach((table) => {
      tableStats.set(table.id, {
        tableId: table.id,
        tableNumber: table.numero,
        reservationCount: 0,
        totalGuests: 0,
        capacity: table.capienza,
      });
    });

    // Count reservations per table
    reservations.forEach((res) => {
      if (res.stato === "cancellata") return;
      
      const stat = tableStats.get(res.tavoloId);
      if (stat) {
        stat.reservationCount += 1;
        stat.totalGuests += res.numeroPersone;
      }
    });

    // Convert to array and sort by reservation count
    return Array.from(tableStats.values())
      .filter((t) => t.reservationCount > 0)
      .sort((a, b) => b.reservationCount - a.reservationCount)
      .slice(0, 5);
  }, [reservations, tables]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (topTables.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Tavoli Più Prenotati
          </CardTitle>
          <CardDescription>
            I tavoli con più prenotazioni nel periodo selezionato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-sm">Nessun dato disponibile</p>
            <p className="text-xs mt-1">
              I tavoli più prenotati appariranno qui
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxReservations = Math.max(...topTables.map((t) => t.reservationCount));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Tavoli Più Prenotati
        </CardTitle>
        <CardDescription>
          I tavoli con più prenotazioni nel periodo selezionato
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topTables.map((table, index) => (
            <div
              key={table.tableId}
              className="relative flex items-center gap-4 p-3 rounded-lg bg-muted/50"
            >
              {/* Progress bar background */}
              <div
                className="absolute inset-0 rounded-lg bg-primary/10 transition-all"
                style={{
                  width: `${(table.reservationCount / maxReservations) * 100}%`,
                }}
              />
              
              {/* Rank badge */}
              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                {index + 1}
              </div>

              {/* Table info */}
              <div className="relative z-10 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Tavolo {table.tableNumber}</span>
                  <span className="text-sm text-muted-foreground">
                    {table.capacity} posti
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {table.reservationCount} prenotazioni
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {table.totalGuests} coperti
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
