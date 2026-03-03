'use client';

import { useState, useMemo } from 'react';
import type { Prenotazione, Ristorante, Tavolo, Zona, Muro, DailyOpeningHours } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, User, Minus, Plus, PartyPopper } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, getDay } from "date-fns"
import { it } from "date-fns/locale"
import { cn } from '@/lib/utils';
import { DraftingCompass } from 'lucide-react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface ReadOnlyTableProps extends Tavolo {
  isSelectable?: boolean;
  isSelected?: boolean;
  isUnavailable?: boolean;
  onClick?: () => void;
}


// Simplified read-only version of table contents
const ReadOnlyTable = ({ x, y, width, height, rotation, type, number, capienza, isSelectable, isSelected, isUnavailable, onClick }: ReadOnlyTableProps) => {
  const isRound = type === 'rotondo';
  
  return (
     <g 
      transform={`translate(${x}, ${y}) rotate(${rotation})`} 
      className={cn(
          'table-group transition-opacity',
          isSelectable && 'cursor-pointer',
          isUnavailable && 'opacity-40 cursor-not-allowed'
      )}
      onClick={isSelectable ? onClick : undefined}
    >
      <rect 
        x={-width/2} 
        y={-height/2}
        width={width}
        height={height}
        rx={isRound ? width/2 : 8}
        ry={isRound ? height/2 : 8}
        className={cn(
          "fill-card transition-all",
          isSelectable && "hover:fill-primary/10",
        )}
        stroke={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
        strokeWidth={isSelected ? 2 : 1}
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
  openingHours: DailyOpeningHours[];
}

export default function PublicBookingPage({ ristorante, tavoli, zone, muri, openingHours }: PublicBookingPageProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [availability, setAvailability] = useState<{ checked: boolean, availableTableIds: string[] }>({ checked: false, availableTableIds: [] });
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const { toast } = useToast();
  const firestore = useFirestore();
  
  const availableTimes = useMemo(() => {
    if (!date) return [];

    const dayIndex = getDay(date);
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
  }, [date, openingHours, ristorante?.durataTurnoDefault]);
  
  const handleCheckAvailability = async () => {
    if (!date || !time) {
        toast({
            title: "Dati mancanti",
            description: "Per favore, seleziona data e ora.",
            variant: "destructive",
        });
        return;
    }

    if (!firestore) return;
    
    setBookingConfirmed(false);
    setSelectedTableId(null);

    const suitableTables = tavoli.filter(t => t.capienza >= partySize);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const prenotazioniRef = collection(firestore, 'ristoranti', ristorante.id, 'prenotazioni');
    const q = query(
        prenotazioniRef,
        where('data', '>=', Timestamp.fromDate(startOfDay)),
        where('data', '<=', Timestamp.fromDate(endOfDay))
    );

    try {
        const querySnapshot = await getDocs(q);
        const bookedTableIds = querySnapshot.docs
            .map(doc => doc.data() as Prenotazione)
            .filter(prenotazione => prenotazione.ora === time)
            .map(prenotazione => prenotazione.tavoloId);
        
        const availableTables = suitableTables.filter(table => !bookedTableIds.includes(table.id));
        
        setAvailability({
            checked: true,
            availableTableIds: availableTables.map(t => t.id)
        });

        if (availableTables.length === 0) {
            toast({
                title: "Nessuna disponibilità",
                description: "Nessun tavolo disponibile per i criteri selezionati.",
            });
        }

    } catch (error) {
        console.error("Error checking availability:", error);
        toast({
            title: "Errore",
            description: "Impossibile verificare la disponibilità. Riprova più tardi.",
            variant: "destructive",
        });
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedTableId || !date || !time || !customerName || !customerPhone) {
      toast({
        title: "Dati mancanti",
        description: "Assicurati di aver inserito nome e telefono.",
        variant: "destructive"
      });
      return;
    }

    if (!firestore) return;

    const newBooking: Omit<Prenotazione, 'id'> = {
      ristoranteId: ristorante.id,
      customerId: '', // Not using separate customers collection for now
      cliente: {
        nome: customerName,
        telefono: customerPhone,
      },
      data: Timestamp.fromDate(date),
      ora: time,
      tavoloId: selectedTableId,
      numeroPersone: partySize,
      stato: 'confermata',
      recensioneInviata: false,
      createdAt: Timestamp.now(),
    };

    try {
        const prenotazioniRef = collection(firestore, 'ristoranti', ristorante.id, 'prenotazioni');
        await addDoc(prenotazioniRef, newBooking);
        setBookingConfirmed(true);
    } catch (error) {
      console.error("Error confirming booking:", error);
      toast({
        title: "Errore di prenotazione",
        description: "Non è stato possibile confermare la prenotazione. Riprova.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setBookingConfirmed(false);
    setSelectedTableId(null);
    setAvailability({ checked: false, availableTableIds: [] });
    setDate(undefined);
    setTime('');
    setPartySize(2);
  }

  if (bookingConfirmed) {
      return (
          <div className="min-h-screen bg-muted/40 flex flex-col">
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
                <main className="flex-1 flex items-center justify-center">
                     <Card className="w-full max-w-md text-center p-8">
                        <PartyPopper className="w-16 h-16 text-primary mx-auto mb-4" />
                        <CardTitle className="text-2xl">Prenotazione Confermata!</CardTitle>
                        <CardDescription className="mt-2 mb-6">Grazie, {customerName}! La tua prenotazione per {partySize} persone da {ristorante.nome} il {date && format(date, "PPP", { locale: it })} alle {time} è stata confermata.</CardDescription>
                        <Button onClick={resetForm}>Effettua un'altra prenotazione</Button>
                    </Card>
                </main>
          </div>
      )
  }

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
                            <Button className="w-full mt-4" onClick={handleCheckAvailability}>Verifica Disponibilità</Button>
                        </CardContent>
                    </Card>

                    {selectedTableId && (
                        <Card className="mt-8">
                            <CardHeader>
                                <CardTitle>Completa la tua prenotazione</CardTitle>
                                <CardDescription>Tavolo {tavoli.find(t=>t.id === selectedTableId)?.numero} per {partySize} persone.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor='customer-name'>Nome</Label>
                                    <Input id="customer-name" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder='Mario Rossi'/>
                                </div>
                                 <div className="grid gap-2">
                                    <Label htmlFor='customer-phone'>Telefono</Label>
                                    <Input id="customer-phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder='3331234567'/>
                                </div>
                                <Button className="w-full mt-2" onClick={handleConfirmBooking}>Conferma Prenotazione</Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Piantina del locale</CardTitle>
                            {availability.checked && availability.availableTableIds.length > 0 && <CardDescription>Seleziona un tavolo disponibile per continuare.</CardDescription>}
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
                                    const isUnavailable = availability.checked && !availability.availableTableIds.includes(table.id);
                                    const isSelectable = availability.checked && !isUnavailable;
                                    const isSelected = table.id === selectedTableId;
                                    
                                    return <ReadOnlyTable 
                                        key={table.id}
                                        {...table}
                                        isUnavailable={isUnavailable}
                                        isSelectable={isSelectable}
                                        isSelected={isSelected}
                                        onClick={() => setSelectedTableId(table.id)}
                                    />
                                })}
                            </svg>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    </div>
  );
}
