"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  CalendarCheck, 
  TrendingUp, 
  Clock,
  Armchair,
  Euro
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  totalReservations: number;
  thisMonthReservations: number;
  thisWeekReservations: number;
  occupancyRate: number;
  averagePartySize: number;
  estimatedRevenue: number | null;
  isLoading: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  isLoading: boolean;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

function StatCard({ title, value, subtitle, icon, isLoading, className }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function StatsCards({
  totalReservations,
  thisMonthReservations,
  thisWeekReservations,
  occupancyRate,
  averagePartySize,
  estimatedRevenue,
  isLoading,
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        title="Prenotazioni Totali"
        value={totalReservations.toLocaleString("it-IT")}
        subtitle="Di sempre"
        icon={<CalendarCheck className="h-4 w-4" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Questo Mese"
        value={thisMonthReservations.toLocaleString("it-IT")}
        subtitle="Prenotazioni"
        icon={<TrendingUp className="h-4 w-4" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Questa Settimana"
        value={thisWeekReservations.toLocaleString("it-IT")}
        subtitle="Prenotazioni"
        icon={<Clock className="h-4 w-4" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Tasso Occupazione"
        value={`${occupancyRate.toFixed(1)}%`}
        subtitle="Tavoli prenotati"
        icon={<Armchair className="h-4 w-4" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Media Coperti"
        value={averagePartySize.toFixed(1)}
        subtitle="Per prenotazione"
        icon={<Users className="h-4 w-4" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Fatturato Stimato"
        value={estimatedRevenue !== null ? `€${estimatedRevenue.toLocaleString("it-IT")}` : "N/D"}
        subtitle={estimatedRevenue !== null ? "Basato su ticket medio" : "Imposta ticket medio"}
        icon={<Euro className="h-4 w-4" />}
        isLoading={isLoading}
        className={estimatedRevenue === null ? "opacity-75" : ""}
      />
    </div>
  );
}
