'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useFirestore, useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import type { DailyOpeningHours, Ristorante } from "@/lib/types";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";

const daysOfWeek = ["lunedi", "martedi", "mercoledi", "giovedi", "venerdi", "sabato", "domenica"];
const displayDays: { [key: string]: string } = {
    "lunedi": "Lunedì",
    "martedi": "Martedì",
    "mercoledi": "Mercoledì",
    "giovedi": "Giovedì",
    "venerdi": "Venerdì",
    "sabato": "Sabato",
    "domenica": "Domenica"
};

type Slot = {
    id?: string;
    aperto: boolean;
    dalle: string;
    alle: string;
};

type OpeningHoursState = {
    [key: string]: Slot[];
};

export default function SettingsPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [ristorante, setRistorante] = useState<Partial<Ristorante>>({});
    const [openingHours, setOpeningHours] = useState<OpeningHoursState>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [ristoranteId, setRistoranteId] = useState<string | null>(null);

    useEffect(() => {
        if (user && firestore) {
            setLoading(true);
            const q = query(collection(firestore, 'ristoranti'), where('proprietarioUid', '==', user.uid));
            getDocs(q).then(async (snapshot) => {
                if (!snapshot.empty) {
                    const ristoranteDoc = snapshot.docs[0];
                    setRistoranteId(ristoranteDoc.id);
                    const ristoranteData = ristoranteDoc.data() as Ristorante;
                    setRistorante(ristoranteData);

                    const hoursCol = collection(firestore, 'ristoranti', ristoranteDoc.id, 'dailyOpeningHours');
                    const hoursSnap = await getDocs(hoursCol);
                    
                    const hoursData: OpeningHoursState = {};
                    daysOfWeek.forEach(day => hoursData[day] = []);

                    hoursSnap.docs.forEach(docSnap => {
                        const data = docSnap.data() as DailyOpeningHours;
                        if (hoursData[data.dayOfWeek]) {
                             hoursData[data.dayOfWeek].push({
                                id: docSnap.id,
                                aperto: data.aperto,
                                dalle: data.dalle,
                                alle: data.alle,
                            });
                        }
                    });

                    // Ensure every day has at least one slot for the UI and sort them
                    daysOfWeek.forEach(day => {
                        if (hoursData[day].length === 0) {
                            hoursData[day].push({ aperto: true, dalle: "19:00", alle: "23:00" });
                        } else {
                            hoursData[day].sort((a, b) => (a.dalle || "").localeCompare(b.dalle || ""));
                        }
                    });

                    setOpeningHours(hoursData);
                }
                setLoading(false);
            }).catch(err => {
                console.error("Error fetching restaurant data: ", err);
                toast({ title: "Errore", description: "Impossibile caricare i dati del ristorante.", variant: "destructive" });
                setLoading(false);
            });
        }
    }, [user, firestore, toast]);

    const handleHourChange = (day: string, slotIndex: number, field: 'aperto' | 'dalle' | 'alle', value: string | boolean) => {
        setOpeningHours(prev => {
            const newDaySlots = [...(prev[day] || [])];
            if (newDaySlots[slotIndex]) {
                (newDaySlots[slotIndex] as any)[field] = value;
            }
            return { ...prev, [day]: newDaySlots };
        });
    };

    const addSlot = (day: string) => {
        setOpeningHours(prev => {
            const daySlots = prev[day] || [];
            if (daySlots.length < 2) {
                const newSlots = [...daySlots, { aperto: true, dalle: "12:00", alle: "15:00" }];
                return { ...prev, [day]: newSlots };
            }
            return prev;
        });
    };

    const removeSlot = (day: string, slotIndex: number) => {
        setOpeningHours(prev => {
            const daySlots = [...(prev[day] || [])];
            if (daySlots.length > 1) {
                daySlots.splice(slotIndex, 1);
                return { ...prev, [day]: daySlots };
            }
            return prev;
        });
    };
    
    const handleInfoChange = (field: keyof Ristorante, value: any) => {
        setRistorante(prev => ({ ...prev, [field]: value }));
    }

    const handleSave = async () => {
        if (!firestore || !ristoranteId || !user) return;
        setIsSaving(true);
        try {
            const batch = writeBatch(firestore);

            const ristoranteRef = doc(firestore, 'ristoranti', ristoranteId);
            batch.update(ristoranteRef, {
                nome: ristorante.nome,
                tipo: ristorante.tipo,
                indirizzo: ristorante.indirizzo,
                telefono: ristorante.telefono,
                email: ristorante.email
            });

            const hoursColRef = collection(firestore, 'ristoranti', ristoranteId, 'dailyOpeningHours');
            const existingHoursSnap = await getDocs(hoursColRef);
            existingHoursSnap.forEach(doc => {
                batch.delete(doc.ref);
            });

            for (const day of daysOfWeek) {
                const slots = openingHours[day] || [];
                slots.forEach((slot, index) => {
                    const isDayChecked = slot.aperto; 
                    if (isDayChecked && slot.dalle && slot.alle) {
                        const newHourRef = doc(collection(firestore, 'ristoranti', ristoranteId, 'dailyOpeningHours'));
                        const data = {
                            dayOfWeek: day,
                            aperto: true,
                            dalle: slot.dalle,
                            alle: slot.alle,
                            slotIndex: index + 1,
                            ristoranteId: ristoranteId,
                            proprietarioUid: user.uid,
                        };
                        batch.set(newHourRef, data);
                    }
                });
            }


            await batch.commit();
            toast({ title: "Successo", description: "Impostazioni salvate correttamente." });
        } catch (error: any) {
            console.error("Error saving settings: ", error);
            toast({ title: "Errore", description: `Impossibile salvare le impostazioni: ${error.message}`, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="grid gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Impostazioni</h1>
                    <p className="text-muted-foreground">Gestisci le informazioni e le preferenze del tuo ristorante.</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salva Modifiche
                </Button>
            </div>
            
            <Tabs defaultValue="ristorante">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="ristorante">Ristorante</TabsTrigger>
                    <TabsTrigger value="piano">Piano e Fatturazione</TabsTrigger>
                    <TabsTrigger value="reviewflow">ReviewFlow</TabsTrigger>
                </TabsList>

                <TabsContent value="ristorante" className="mt-6 grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informazioni Ristorante</CardTitle>
                            <CardDescription>Dettagli base del tuo locale.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="restaurant-name">Nome Ristorante</Label>
                                    <Input id="restaurant-name" value={ristorante.nome || ''} onChange={e => handleInfoChange('nome', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="restaurant-type">Tipo di Locale</Label>
                                    <Select value={ristorante.tipo || ''} onValueChange={value => handleInfoChange('tipo', value)}>
                                        <SelectTrigger id="restaurant-type">
                                            <SelectValue placeholder="Seleziona tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pizzeria">Pizzeria</SelectItem>
                                            <SelectItem value="ristorante">Ristorante</SelectItem>
                                            <SelectItem value="trattoria">Trattoria</SelectItem>
                                            <SelectItem value="sushi">Sushi</SelectItem>
                                            <SelectItem value="bar">Bar</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Indirizzo</Label>
                                <Input id="address" value={ristorante.indirizzo || ''} onChange={e => handleInfoChange('indirizzo', e.target.value)} />
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Telefono</Label>
                                    <Input id="phone" value={ristorante.telefono || ''} onChange={e => handleInfoChange('telefono', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={ristorante.email || ''} onChange={e => handleInfoChange('email', e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Orari di Apertura</CardTitle>
                            <CardDescription>Definisci quando il tuo ristorante è aperto, anche su più turni (es. pranzo e cena).</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {daysOfWeek.map(day => (
                                <div key={day} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id={`cb-${day}`}
                                                checked={openingHours[day]?.[0]?.aperto ?? false}
                                                onCheckedChange={(checked) => handleHourChange(day, 0, 'aperto', !!checked)}
                                            />
                                            <Label htmlFor={`cb-${day}`} className="font-medium text-lg capitalize">{displayDays[day]}</Label>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => addSlot(day)}
                                            disabled={(openingHours[day]?.length ?? 0) >= 2 || !openingHours[day]?.[0]?.aperto}
                                        >
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Aggiungi turno
                                        </Button>
                                    </div>
                                    <div className="grid gap-4">
                                    {(openingHours[day] || []).map((slot, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input
                                                type="time"
                                                value={slot.dalle}
                                                onChange={e => handleHourChange(day, index, 'dalle', e.target.value)}
                                                disabled={!slot.aperto}
                                            />
                                            <span>-</span>
                                            <Input
                                                type="time"
                                                value={slot.alle}
                                                onChange={e => handleHourChange(day, index, 'alle', e.target.value)}
                                                disabled={!slot.aperto}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeSlot(day, index)}
                                                disabled={(openingHours[day]?.length ?? 0) <= 1}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="piano" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Il Tuo Piano</CardTitle>
                            <CardDescription>Attualmente sei sul piano Pro.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted/50 p-6 rounded-xl border">
                                <h3 className="text-lg font-semibold">Piano Pro</h3>
                                <p className="text-3xl font-bold mt-2">€49 <span className="text-lg font-normal text-muted-foreground">/mese</span></p>
                                <p className="text-sm text-muted-foreground mt-1">Il tuo abbonamento si rinnoverà il 15 del mese prossimo.</p>
                                <Button className="mt-4">Gestisci Abbonamento</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reviewflow" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configurazione ReviewFlow</CardTitle>
                            <CardDescription>Personalizza come e quando richiedere recensioni.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="google-link">Link Recensioni Google My Business</Label>
                                <Input id="google-link" placeholder="https://g.page/r/..../review" />
                            </div>
                            <div className="grid gap-4">
                                <Label>Quando inviare la richiesta?</Label>
                                <div className="flex items-center gap-4">
                                    <Slider defaultValue={[24]} max={72} step={1} className="flex-1" />
                                    <div className="font-bold w-12 text-center">24h</div>
                                </div>
                                <p className="text-sm text-muted-foreground -mt-2">Ore dopo il termine della prenotazione.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
