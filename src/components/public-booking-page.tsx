'use client';

import { useState } from 'react';
import type { Ristorante, Tavolo, Zona, Muro } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, User, Minus, Plus } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { cn } from '@/lib/utils';
import { DraftingCompass } from 'lucide-react';
import Link from 'next/link';

// Simplified read-only version of table contents
const ReadOnlyTable = ({ x, y, width, height, rotation, type, number, capienza }: Tavolo) => {
  const isRound = type === 'rotondo';
  
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`} className="table-group">
      <rect 
        x={-width/2} 
        y={-height/2}
        width={width}
        height={height}
        rx={isRound ? width/2 : 8}
        ry={isRound ? height/2 : 8}
        className="fill-card stroke-border"
        strokeWidth="1"
      />
      <text textAnchor="middle" dy=".3em" className="fill-foreground font-bold text-sm select-none pointer-events-none">
        {number}
      </text>
       <text textAnchor="middle" dy="1.5em" className="fill-muted-foreground font-medium text-xs select-none pointer-events-none">
        {capienza} posti
      </text>
    </g>
  );
};


const getPolygonCentroid = (points: {x: number, y: number}[]) => {
    let centroid = { x: 0, y: 0 };
    if (!points || points.length === 0) return centroid;
    // Calculation from editor
    let signedArea = 0.0;
    let x0 = 0.0; let y0 = 0.0; let x1 = 0.0; let y1 = 0.0; let a = 0.0;
    let i = 0;
    for (i = 0; i < points.length - 1; ++i) {
        x0 = points[i].x; y0 = points[i].y; x1 = points[i+1].x; y1 = points[i+1].y;
        a = x0 * y1 - x1 * y0; signedArea += a; centroid.x += (x0 + x1) * a; centroid.y += (y0 + y1) * a;
    }
    x0 = points[i].x; y0 = points[i].y; x1 = points[0].x; y1 = points[0].y;
    a = x0 * y1 - x1 * y0; signedArea += a; centroid.x += (x0 + x1) * a; centroid.y += (y0 + y1) * a;
    if (Math.abs(signedArea) < 1e-7) return {x: points[0].x, y: points[0].y};
    signedArea *= 0.5; centroid.x /= (6.0 * signedArea); centroid.y /= (6.0 * signedArea);
    return centroid;
};

interface PublicBookingPageProps {
  ristorante: Ristorante;
  tavoli: Tavolo[];
  zone: Zona[];
  muri: Muro[];
}

export default function PublicBookingPage({ ristorante, tavoli, zone, muri }: PublicBookingPageProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [partySize, setPartySize] = useState(2);
  
  // This would eventually be dynamic based on opening hours
  const availableTimes = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];

  return (
    <div className="min-h-screen bg-muted/40">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="mr-4 flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <DraftingCompass className="h-6 w-6 text-primary" />
                        <span className="font-bold">PLACEAT</span>
                    </Link>
                </div>
            </div>
        </header>
        <main className="container py-12">
            <div className="grid lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1">
                    <h1 className="text-3xl font-bold tracking-tight">{ristorante.nome}</h1>
                    <p className="text-muted-foreground mt-1">{ristorante.indirizzo}</p>
                    
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Crea una prenotazione</CardTitle>
                            <CardDescription>Seleziona data, ora e numero di persone.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>Data</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP", { locale: it }) : <span>Scegli una data</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="party-size">Persone</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setPartySize(p => Math.max(1, p-1))}><Minus className="h-4 w-4"/></Button>
                                        <span className="font-bold text-lg w-8 text-center">{partySize}</span>
                                        <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setPartySize(p => p+1)}><Plus className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="time">Ora</Label>
                                    <Select onValueChange={setTime} value={time}>
                                        <SelectTrigger id="time" className="h-10">
                                            <SelectValue placeholder="Scegli" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableTimes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button className="w-full mt-4">Verifica Disponibilità</Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Piantina del locale</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[600px] bg-muted/50 rounded-lg border-2 border-dashed">
                             <svg className="w-full h-full" viewBox="0 0 2000 2000">
                                <rect width="2000" height="2000" fill="hsl(var(--muted))" />
                                
                                {zone.map(z => {
                                    const centroid = getPolygonCentroid(z.path);
                                    return (
                                        <g key={z.id}>
                                            <polygon
                                                points={z.path.map(p => `${p.x},${p.y}`).join(' ')}
                                                fill={z.colore}
                                                stroke={z.colore.replace(/[\d\.]+\)$/, '1)')}
                                                strokeWidth="2"
                                            />
                                            <text x={centroid.x} y={centroid.y} textAnchor="middle" dy=".3em" className="fill-foreground font-bold pointer-events-none select-none" fontSize="16">{z.nome}</text>
                                        </g>
                                    )
                                })}

                                {muri.map((wall) => (
                                    <line key={wall.id} x1={wall.points[0].x} y1={wall.points[0].y} x2={wall.points[1].x} y2={wall.points[1].y} strokeWidth={wall.spessore} className="stroke-foreground" strokeLinecap="round" />
                                ))}
                        
                                {tavoli.map(table => (
                                    <ReadOnlyTable key={table.id} {...table} />
                                ))}
                            </svg>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    </div>
  );
}
