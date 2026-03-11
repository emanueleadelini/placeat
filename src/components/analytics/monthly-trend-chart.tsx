"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subMonths, isSameMonth, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { Prenotazione } from "@/lib/types";

interface MonthlyTrendChartProps {
  reservations: Prenotazione[];
  isLoading: boolean;
  months?: number;
}

interface MonthlyData {
  month: string;
  label: string;
  count: number;
  guests: number;
}

export function MonthlyTrendChart({
  reservations,
  isLoading,
  months = 12,
}: MonthlyTrendChartProps) {
  const chartData: MonthlyData[] = useMemo(() => {
    const data: MonthlyData[] = [];
    const today = new Date();

    // Generate last N months
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(today, i);
      data.push({
        month: format(date, "yyyy-MM"),
        label: format(date, "MMM yyyy", { locale: it }),
        count: 0,
        guests: 0,
      });
    }

    // Count reservations for each month
    reservations.forEach((res) => {
      const resDate = res.data instanceof Date ? res.data : parseISO(res.data as unknown as string);
      const monthData = data.find((d) => isSameMonth(parseISO(d.month + "-01"), resDate));
      if (monthData && res.stato !== "cancellata") {
        monthData.count += 1;
        monthData.guests += res.numeroPersone;
      }
    });

    return data;
  }, [reservations, months]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return "neutral";
    const lastMonth = chartData[chartData.length - 1].count;
    const prevMonth = chartData[chartData.length - 2].count;
    if (lastMonth > prevMonth) return "up";
    if (lastMonth < prevMonth) return "down";
    return "neutral";
  }, [chartData]);

  const totalReservations = chartData.reduce((sum, d) => sum + d.count, 0);

  if (isLoading) {
    return (
      <Card>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Trend Mensile</span>
          <div className="flex items-center gap-2">
            <div className="text-sm font-normal">
              <span className="text-muted-foreground">Totale: </span>
              <span className="font-semibold">{totalReservations} prenotazioni</span>
            </div>
            {trend === "up" && (
              <span className="text-emerald-500 text-sm font-medium">↗ Crescita</span>
            )}
            {trend === "down" && (
              <span className="text-rose-500 text-sm font-medium">↗ Calo</span>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Andamento delle prenotazioni negli ultimi {months} mesi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                angle={-30}
                textAnchor="end"
                height={50}
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
                labelFormatter={(label) => `${label}`}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
