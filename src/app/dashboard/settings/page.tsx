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
import { collection, doc, getDocs, query, where, writeBatch, setDoc } from "firebase/firestore";
import type { DailyOpeningHours, Ristorante } from "@/lib/types";
import { Loader2 } from "lucide-react";

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

type OpeningHoursState = {
    [key: string]: {
        aperto: boolean;
        dalle: string;
        alle: string;
    }
}

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
                    let hasData = false;
                    daysOfWeek.forEach(day => {
                        const dayDoc = hoursSnap.docs.find(d => d.id === day);
                        if (dayDoc) {
                            hasData = true;
                            const data = dayDoc.data() as DailyOpeningHours;
                            hoursData[day] = { aperto: data.aperto, dalle: data.dalle, alle: data.alle };
                        }
                    });

                    if (!hasData) {
                         daysOfWeek.forEach(day => {
                            hoursData[day] = { aperto: true, dalle: "19:00", alle: "23:00" };
                         });
                    }
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

    const handleHourChange = (day: string, field: 'aperto' | 'dalle' | 'alle', value: string | boolean) => {
        setOpeningHours(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [field]: value
            }
        }));
    };
    
    const handleInfoChange = (field: keyof Ristorante, value: any) => {
        setRistorante(prev => ({ ...prev, [field]: value }));
    }

    const handleSave = async () => {
        if (!firestore || !ristoranteId || !user) return;
        setIsSaving(true);
        try {
            const batch = writeBatch(firestore);

            // Save restaurant info
            const ristoranteRef = doc(firestore, 'ristoranti', ristoranteId);
            batch.update(ristoranteRef, {
                nome: ristorante.nome,
                tipo: ristorante.tipo,
                indirizzo: ristorante.indirizzo,
                telefono: ristorante.telefono,
                email: ristorante.email
            });

            // Save opening hours
            const hoursColRef = collection(firestore, 'ristoranti', ristoranteId, 'dailyOpeningHours');
            for (const day of daysOfWeek) {
                const dayRef = doc(hoursColRef, day);
                const data = {
                    ...openingHours[day],
                    dayOfWeek: day,
                    ristoranteId: ristoranteId,
                    proprietarioUid: user.uid,
                };
                batch.set(dayRef, data);
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
                            <CardDescription>Definisci quando il tuo ristorante è aperto al pubblico.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {daysOfWeek.map(day => (
                                <div key={day} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3 mb-4 sm:mb-0">
                                    <Checkbox 
                                        id={`cb-${day}`} 
                                        checked={openingHours[day]?.aperto ?? false} 
                                        onCheckedChange={(checked) => handleHourChange(day, 'aperto', !!checked)}
                                    />
                                    <Label htmlFor={`cb-${day}`} className="font-medium w-24 capitalize">{displayDays[day]}</Label>
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Input 
                                        type="time" 
                                        value={openingHours[day]?.dalle || ''} 
                                        onChange={e => handleHourChange(day, 'dalle', e.target.value)}
                                        disabled={!openingHours[day]?.aperto}
                                    />
                                    <span>-</span>
                                    <Input 
                                        type="time" 
                                        value={openingHours[day]?.alle || ''}
                                        onChange={e => handleHourChange(day, 'alle', e.target.value)}
                                        disabled={!openingHours[day]?.aperto}
                                    />
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
