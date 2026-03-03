'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import type { Ristorante, Prenotazione, Tavolo, Zona, Muro, DailyOpeningHours } from '@/lib/types';
import { format, startOfWeek, addDays, isSameDay, getDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Reusable components from other files. I can define them here to avoid creating new files.

interface ReadOnlyTableProps extends Tavolo {
  status?: 'free' | 'booked';
  bookingDetails?: Prenotazione;
}

const ReadOnlyTable = ({ x, y, width, height, rotation, type, number, capienza, status, bookingDetails }: ReadOnlyTableProps) => {
  const isRound = type === 'rotondo';
  const tableColor = status === 'booked' ? 'fill-destructive/20' : 'fill-card';
  const strokeColor = status === 'booked' ? 'hsl(var(--destructive))' : 'hsl(var(--border))';

  const content = (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      <rect 
        x={-width/2} 
        y={-height/2}
        width={width}
        height={height}
        rx={isRound ? width/2 : 8}
        ry={isRound ? height/2 : 8}
        className={cn("transition-colors", tableColor)}
        stroke={strokeColor}
        strokeWidth={1.5}
      />
      <text textAnchor="middle" dy=".3em" className="fill-foreground font-bold text-sm select-none pointer-events-none">
        {number}
      </text>
      <text textAnchor="middle" dy="1.5em" className="fill-muted-foreground font-medium text-xs select-none pointer-events-none">
        {capienza} posti
      </text>
    </g>
  );

  if (status === 'booked' && bookingDetails) {
    return (
      <Popover>
        <PopoverTrigger asChild className="cursor-pointer">
          {content}
        </PopoverTrigger>
        <PopoverContent className="w-60">
          <div className="grid gap-2">
            <h4 className="font-medium leading-none">Prenotazione</h4>
            <p className="text-sm text-muted-foreground">
              Tavolo {number} - Ore {bookingDetails.ora}
            </p>
            <div className="grid grid-cols-2 gap-2">
                <div>Cliente:</div>
                <div className="font-semibold">{bookingDetails.cliente.nome}</div>
                <div>Persone:</div>
                <div className="font-semibold">{bookingDetails.numeroPersone}</div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return content;
};

const getPolygonCentroid = (points: {x: number, y: number}[]) => {
    let centroid = { x: 0, y: 0 };
    if (!points || points.length === 0) return centroid;
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


// Main page component
export default function ReservationsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [loading, setLoading] = useState(true);
  const [ristorante, setRistorante] = useState<Ristorante | null>(null);
  const [tavoli, setTavoli] = useState<Tavolo[]>([]);
  const [zone, setZone] = useState<Zona[]>([]);
  const [muri, setMuri] = useState<Muro[]>([]);
  const [openingHours, setOpeningHours] = useState<DailyOpeningHours[]>([]);
  const [reservations, setReservations] = useState<Prenotazione[]>([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const weekStartsOn = 1; // Monday
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  // Data fetching effect
  useEffect(() => {
    if (!user || !firestore) return;

    setLoading(true);
    const fetchAllData = async () => {
      try {
        const q = query(collection(firestore, 'ristoranti'), where('proprietarioUid', '==', user.uid));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setLoading(false);
          return;
        }
        const ristoranteDoc = snapshot.docs[0];
        const ristoranteData = { id: ristoranteDoc.id, ...ristoranteDoc.data() } as Ristorante;
        setRistorante(ristoranteData);
        const ristoranteId = ristoranteDoc.id;

        const [tavoliSnap, zoneSnap, muriSnap, hoursSnap, reservationsSnap] = await Promise.all([
          getDocs(collection(firestore, 'ristoranti', ristoranteId, 'tavoli')),
          getDocs(collection(firestore, 'ristoranti', ristoranteId, 'zone')),
          getDocs(collection(firestore, 'ristoranti', ristoranteId, 'muri')),
          getDocs(collection(firestore, 'ristoranti', ristoranteId, 'dailyOpeningHours')),
          getDocs(collection(firestore, 'ristoranti', ristoranteId, 'prenotazioni')),
        ]);

        setTavoli(tavoliSnap.docs.map(d => ({ id: d.id, ...d.data() } as Tavolo)));
        setZone(zoneSnap.docs.map(d => {
            const data = d.data();
            const path = (data.pathX || []).map((x: number, i: number) => ({ x, y: (data.pathY || [])[i] ?? 0 }));
            return { id: d.id, path, nome: data.nome, colore: data.colore } as Zona;
        }));
        setMuri(muriSnap.docs.map(d => {
            const data = d.data();
            const points = (data.pointsX || []).map((x: number, i: number) => ({ x, y: (data.pointsY || [])[i] ?? 0 }));
            return { id: d.id, points, spessore: data.spessore } as Muro;
        }));
        setOpeningHours(hoursSnap.docs.map(d => ({ id: d.id, ...d.data() } as DailyOpeningHours)));
        setReservations(reservationsSnap.docs.map(d => {
          const data = d.data();
          return { id: d.id, ...data, data: (data.data as Timestamp).toDate() } as Prenotazione;
        }));
        
      } catch (error) {
        console.error("Error fetching reservation data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [user, firestore]);

  const timeSlots = useMemo(() => {
    const dayIndex = getDay(selectedDate);
    const dayName = ['domenica', 'lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato'][dayIndex];
    
    const daySlots = openingHours
        .filter(h => h.dayOfWeek === dayName && h.aperto)
        .sort((a, b) => a.dalle.localeCompare(b.dalle));

    if (daySlots.length === 0) return [];

    const allSlots: string[] = [];
    const turnDuration = ristorante?.durataTurnoDefault || 60;

    daySlots.forEach(slot => {
        let currentTime = new Date(`1970-01-01T${slot.dalle}:00`);
        const endTime = new Date(`1970-01-01T${slot.alle}:00`);
        
        while (currentTime < endTime) {
            allSlots.push(format(currentTime, 'HH:mm'));
            currentTime.setMinutes(currentTime.getMinutes() + turnDuration);
        }
    });

    return allSlots;
  }, [selectedDate, openingHours, ristorante]);

  useEffect(() => {
    // When selected day changes, select the first available time slot automatically
    if (timeSlots.length > 0) {
      setSelectedTime(timeSlots[0]);
    } else {
      setSelectedTime(null);
    }
  }, [timeSlots]);

  const reservationsForSelectedSlot = useMemo(() => {
    if (!selectedTime) return [];
    return reservations.filter(r => isSameDay(r.data, selectedDate) && r.ora === selectedTime);
  }, [reservations, selectedDate, selectedTime]);


  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'confermata': return 'default';
        case 'completata': return 'secondary';
        case 'cancellata': return 'destructive';
        case 'no-show': return 'destructive';
        default: return 'outline';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ristorante) {
     return (
        <div className="text-center">
            <p>Nessun ristorante trovato. Completa la configurazione nelle impostazioni.</p>
        </div>
     );
  }

  return (
    <div className="grid gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Prenotazioni</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendario Settimanale</CardTitle>
          <div className="flex items-center justify-between">
            <CardDescription>
                Seleziona un giorno e una fascia oraria per visualizzare lo stato dei tavoli.
            </CardDescription>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(d => addDays(d, -7))}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(d => addDays(d, 7))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 border-b pb-4">
            {weekDays.map(day => (
              <Button 
                key={day.toString()} 
                variant={isSameDay(day, selectedDate) ? 'default' : 'ghost'}
                onClick={() => setSelectedDate(day)}
                className="flex flex-col h-auto p-2"
              >
                <span className="text-xs font-normal">{format(day, 'EEE', { locale: it })}</span>
                <span className="text-lg font-bold">{format(day, 'd')}</span>
              </Button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto py-4">
            {timeSlots.length > 0 ? timeSlots.map(slot => (
              <Button 
                key={slot} 
                variant={selectedTime === slot ? 'secondary' : 'outline'}
                className="shrink-0"
                onClick={() => setSelectedTime(slot)}
              >
                {slot}
              </Button>
            )) : <p className="text-sm text-muted-foreground">Nessuna fascia oraria disponibile per questo giorno.</p>}
          </div>

          <Card className="h-[600px] bg-muted/50 rounded-lg border-2 border-dashed mt-4">
            <CardContent className="h-full p-0">
                 <svg className="w-full h-full" viewBox="0 0 2000 2000">
                    <rect width="2000" height="2000" fill="hsl(var(--muted))" />
                    
                    {zone.map(z => {
                        const centroid = getPolygonCentroid(z.path);
                        return (
                            <g key={z.id}>
                                <polygon
                                    points={z.path.map(p => `${p.x},${p.y}`).join(' ')}
                                    fill={z.colore}
                                    stroke={z.colore ? z.colore.substring(0, 7) : 'hsl(var(--border))'}
                                    strokeWidth="2"
                                />
                                <text x={centroid.x} y={centroid.y} textAnchor="middle" dy=".3em" className="fill-foreground font-bold pointer-events-none select-none" fontSize="16">{z.nome}</text>
                            </g>
                        )
                    })}

                    {muri.map((wall) => (
                        <line key={wall.id} x1={wall.points[0].x} y1={wall.points[0].y} x2={wall.points[1].x} y2={wall.points[1].y} strokeWidth={wall.spessore} className="stroke-foreground" strokeLinecap="round" />
                    ))}
            
                    {tavoli.map(table => {
                        const booking = reservationsForSelectedSlot.find(r => r.tavoloId === table.id);
                        return <ReadOnlyTable 
                            key={table.id}
                            {...table}
                            status={booking ? 'booked' : 'free'}
                            bookingDetails={booking as Prenotazione | undefined}
                        />
                    })}
                </svg>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Prenotazioni del {format(selectedDate, "PPP", { locale: it })} {selectedTime ? `alle ${selectedTime}`: ''}</CardTitle>
        </CardHeader>
        <CardContent>
            {reservationsForSelectedSlot.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Orario</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead className="text-center">Persone</TableHead>
                            <TableHead>Tavolo</TableHead>
                            <TableHead className="text-right">Stato</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reservationsForSelectedSlot.map(res => {
                            const table = tavoli.find(t => t.id === res.tavoloId);
                            return (
                            <TableRow key={res.id}>
                                <TableCell className="font-medium">{res.ora}</TableCell>
                                <TableCell>{res.cliente.nome}</TableCell>
                                <TableCell className="text-center">{res.numeroPersone}</TableCell>
                                <TableCell>{table ? `Tavolo ${table.numero}` : 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={getStatusVariant(res.stato)}>
                                        {res.stato}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        )})}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center text-muted-foreground p-8">
                    Nessuna prenotazione per questa fascia oraria.
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
