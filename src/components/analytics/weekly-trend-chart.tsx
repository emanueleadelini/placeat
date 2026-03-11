"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, isSameDay, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { Prenotazione } from "@/lib/types";

interface WeeklyTrendChartProps {
  reservations: Prenotazione[];
  isLoading: boolean;
  days?: number;
}

interface ChartData {
  date: string;
  label: string;
  count: number;
  guests: number;
}

export function WeeklyTrendChart({
  reservations,
  isLoading,
  days = 7,
}: WeeklyTrendChartProps) {
  const chartData: ChartData[] = useMemo(() => {
    const data: ChartData[] = [];
    const today = new Date();

    // Generate last N days
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      data.push({
        date: format(date, "yyyy-MM-dd"),
        label: format(date, "EEE d", { locale: it }),
        count: 0,
        guests: 0,
      });
    }

    // Count reservations for each day
    reservations.forEach((res) => {
      const resDate = res.data instanceof Date ? res.data : parseISO(res.data as unknown as string);
      const dayData = data.find((d) => isSameDay(parseISO(d.date), resDate));
      if (dayData && res.stato !== "cancellata") {
        dayData.count += 1;
        dayData.guests += res.numeroPersone;
      }
    });

    return data;
  }, [reservations, days]);

  const totalReservations = chartData.reduce((sum, d) => sum + d.count, 0);
  const totalGuests = chartData.reduce((sum, d) => sum + d.guests, 0);

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Trend Settimanale</span>
          <div className="flex gap-4 text-sm font-normal">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Totale:</span>
              <span className="font-semibold">{totalReservations} prenotazioni</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Coperti:</span>
              <span className="font-semibold">{totalGuests} persone</span>
            </div>
          </div>
        </CardTitle>
        <CardDescription>
          Andamento delle prenotazioni negli ultimi {days} giorni
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReservations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value} prenotazioni`, "Prenotazioni"]}
                labelFormatter={(label) => `Giorno: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorReservations)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
