"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Prenotazione } from "@/lib/types";

interface HourlyDistributionChartProps {
  reservations: Prenotazione[];
  isLoading: boolean;
}

interface HourData {
  hour: string;
  label: string;
  count: number;
  guests: number;
}

export function HourlyDistributionChart({
  reservations,
  isLoading,
}: HourlyDistributionChartProps) {
  const chartData: HourData[] = useMemo(() => {
    const hourMap = new Map<string, HourData>();

    // Initialize all hours from 08:00 to 23:00
    for (let i = 8; i <= 23; i++) {
      const hour = i.toString().padStart(2, "0") + ":00";
      hourMap.set(hour, {
        hour,
        label: hour,
        count: 0,
        guests: 0,
      });
    }

    // Count reservations for each hour
    reservations.forEach((res) => {
      if (res.stato === "cancellata") return;
      
      // Extract hour from time string (e.g., "19:30" -> "19:00")
      const hourStr = res.ora?.substring(0, 2) + ":00";
      const hourData = hourMap.get(hourStr);
      if (hourData) {
        hourData.count += 1;
        hourData.guests += res.numeroPersone;
      }
    });

    // Convert to array and sort by hour
    return Array.from(hourMap.values()).sort((a, b) => 
      a.hour.localeCompare(b.hour)
    );
  }, [reservations]);

  const peakHour = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((max, curr) => (curr.count > max.count ? curr : max), chartData[0]);
  }, [chartData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
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
          <span>Distribuzione Oraria</span>
          {peakHour && peakHour.count > 0 && (
            <div className="text-sm font-normal">
              <span className="text-muted-foreground">Picco: </span>
              <span className="font-semibold">{peakHour.hour}</span>
              <span className="text-muted-foreground"> ({peakHour.count} prenotazioni)</span>
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Prenotazioni distribuite per fascia oraria
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                interval={2}
                angle={-45}
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
                labelFormatter={(label) => `Ore: ${label}`}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
