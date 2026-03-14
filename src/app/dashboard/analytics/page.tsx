"use client";

import { useMemo, useState, useCallback } from "react";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, Timestamp } from "firebase/firestore";
import { format, subDays, isSameMonth, isSameWeek } from "date-fns";
import { it } from "date-fns/locale";
import type { Prenotazione, Tavolo, Ristorante } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Download,
  Loader2,
  TrendingUp,
  Users,
  Calendar,
  Armchair
} from "lucide-react";

import {
  StatsCards,
  WeeklyTrendChart,
  MonthlyTrendChart,
  HourlyDistributionChart,
  OccupancyChart,
  TopTables,
  EmptyState,
  DateRangeSelector,
  type DateRange,
} from "@/components/analytics";

// CSV Export utility
function downloadCSV(data: Prenotazione[], filename: string) {
  if (data.length === 0) return;

  const headers = ["ID", "Data", "Ora", "Cliente", "Telefono", "Persone", "Tavolo", "Stato"];
  
  const rows = data.map((res) => [
    res.id,
    res.data instanceof Date ? format(res.data, "dd/MM/yyyy") : format(new Date(res.data as unknown as string), "dd/MM/yyyy"),
    res.ora,
    res.cliente?.nome || "N/A",
    res.cliente?.telefono || "N/A",
    res.numeroPersone,
    res.tavoloId,
    res.stato,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function AnalyticsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [dateRange, setDateRange] = useState<DateRange>("30");
  const [isExporting, setIsExporting] = useState(false);

  // Fetch restaurant
  const ristoranteQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, "ristoranti"), where("proprietarioUid", "==", user.uid));
  }, [user, firestore]);

  const { data: ristorantiData, isLoading: isLoadingRistorante } = useCollection<Ristorante>(ristoranteQuery);
  const ristorante = useMemo(() => 
    ristorantiData && ristorantiData.length > 0 ? ristorantiData[0] : null, 
    [ristorantiData]
  );
  const ristoranteId = ristorante?.id;

  // Fetch reservations
  const reservationsQuery = useMemoFirebase(() => 
    ristoranteId ? collection(firestore, "ristoranti", ristoranteId, "prenotazioni") : null, 
    [firestore, ristoranteId]
  );
  const { data: reservationsRaw, isLoading: isLoadingReservations } = useCollection<Prenotazione>(reservationsQuery);

  // Fetch tables for occupancy and top tables
  const tablesQuery = useMemoFirebase(() => 
    ristoranteId ? collection(firestore, "ristoranti", ristoranteId, "tavoli") : null, 
    [firestore, ristoranteId]
  );
  const { data: tablesData, isLoading: isLoadingTables } = useCollection<Tavolo>(tablesQuery);
  const tables = tablesData || [];

  // Process reservations
  const allReservations = useMemo(() => {
    if (!reservationsRaw) return [];
    return reservationsRaw.map((res) => ({
      ...res,
      data: res.data instanceof Timestamp ? res.data.toDate() : new Date(res.data as unknown as string),
    }));
  }, [reservationsRaw]);

  // Filter reservations by date range
  const filteredReservations = useMemo(() => {
    const days = parseInt(dateRange);
    const cutoffDate = subDays(new Date(), days);
    
    return allReservations.filter((res) => {
      const resDate = res.data instanceof Date ? res.data : new Date(res.data as unknown as string);
      return resDate >= cutoffDate;
    });
  }, [allReservations, dateRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const confirmedReservations = allReservations.filter((r) => r.stato !== "cancellata");
    const confirmedFiltered = filteredReservations.filter((r) => r.stato !== "cancellata");

    // Total reservations
    const totalReservations = confirmedReservations.length;

    // This month
    const now = new Date();
    const thisMonthReservations = confirmedReservations.filter((r) => 
      isSameMonth(r.data instanceof Date ? r.data : new Date(r.data as unknown as string), now)
    ).length;

    // This week
    const thisWeekReservations = confirmedReservations.filter((r) => 
      isSameWeek(r.data instanceof Date ? r.data : new Date(r.data as unknown as string), now, { weekStartsOn: 1 })
    ).length;

    // Occupancy rate (reservations vs total tables in filtered period)
    const activeTables = tables.filter((t) => t.attivo !== false).length;
    const uniqueBookedTables = new Set(confirmedFiltered.map((r) => r.tavoloId)).size;
    const occupancyRate = activeTables > 0 ? (uniqueBookedTables / activeTables) * 100 : 0;

    // Average party size
    const totalGuests = confirmedFiltered.reduce((sum, r) => sum + r.numeroPersone, 0);
    const averagePartySize = confirmedFiltered.length > 0 ? totalGuests / confirmedFiltered.length : 0;

    // Estimated revenue (if average ticket is set - using placeholder of 30 EUR per person)
    const avgTicketPerPerson = 30; // This could be configurable in settings
    const estimatedRevenue = totalGuests * avgTicketPerPerson;

    return {
      totalReservations,
      thisMonthReservations,
      thisWeekReservations,
      occupancyRate,
      averagePartySize,
      estimatedRevenue,
    };
  }, [allReservations, filteredReservations, tables]);

  const isLoading = isLoadingRistorante || isLoadingReservations || isLoadingTables;

  // Handle CSV export
  const handleExportCSV = useCallback(() => {
    setIsExporting(true);
    try {
      const filename = `prenotazioni_${ristorante?.nome || "ristorante"}_${format(new Date(), "yyyy-MM-dd")}.csv`;
      downloadCSV(filteredReservations, filename);
    } finally {
      setIsExporting(false);
    }
  }, [filteredReservations, ristorante]);


  // Show empty state if no reservations
  const hasReservations = allReservations.length > 0;
  const hasRistorante = !!ristorante;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (!hasReservations) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Analytics
          </h1>
          <p className="text-muted-foreground">
            Statistiche e metriche del tuo ristorante
          </p>
        </div>
        <EmptyState hasRistorante={hasRistorante} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Analytics
          </h1>
          <p className="text-muted-foreground">
            Statistiche e metriche del tuo ristorante
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={isExporting || filteredReservations.length === 0}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards
        totalReservations={metrics.totalReservations}
        thisMonthReservations={metrics.thisMonthReservations}
        thisWeekReservations={metrics.thisWeekReservations}
        occupancyRate={metrics.occupancyRate}
        averagePartySize={metrics.averagePartySize}
        estimatedRevenue={metrics.estimatedRevenue}
        isLoading={isLoading}
      />

      {/* Weekly Trend Chart */}
      <WeeklyTrendChart
        reservations={filteredReservations}
        isLoading={isLoading}
        days={parseInt(dateRange) <= 30 ? parseInt(dateRange) : 30}
      />

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <HourlyDistributionChart
          reservations={filteredReservations}
          isLoading={isLoading}
        />
        <OccupancyChart
          reservations={filteredReservations}
          tables={tables}
          isLoading={isLoading}
        />
      </div>

      {/* Monthly Trend & Top Tables */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonthlyTrendChart
            reservations={allReservations}
            isLoading={isLoading}
            months={12}
          />
        </div>
        <div className="lg:col-span-1">
          <TopTables
            reservations={filteredReservations}
            tables={tables}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Summary Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Riepilogo Periodo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Periodo</p>
                <p className="font-semibold">
                  {dateRange === "365" ? "Anno corrente" : `Ultimi ${dateRange} giorni`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prenotazioni</p>
                <p className="font-semibold">
                  {filteredReservations.filter((r) => r.stato !== "cancellata").length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Coperti Totali</p>
                <p className="font-semibold">
                  {filteredReservations
                    .filter((r) => r.stato !== "cancellata")
                    .reduce((sum, r) => sum + r.numeroPersone, 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Armchair className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tavoli Attivi</p>
                <p className="font-semibold">
                  {tables.filter((t) => t.attivo !== false).length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
