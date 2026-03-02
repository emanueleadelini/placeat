import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const daysOfWeek = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"];

export default function SettingsPage() {
    return (
        <div className="grid gap-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">Impostazioni</h1>
                <p className="text-muted-foreground">Gestisci le informazioni e le preferenze del tuo ristorante.</p>
            </div>
            
            <Tabs defaultValue="ristorante">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="ristorante">Ristorante</TabsTrigger>
                    <TabsTrigger value="piano">Piano e Fatturazione</TabsTrigger>
                    <TabsTrigger value="reviewflow">ReviewFlow</TabsTrigger>
                </TabsList>

                <TabsContent value="ristorante" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informazioni Ristorante</CardTitle>
                            <CardDescription>Dettagli base del tuo locale.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="restaurant-name">Nome Ristorante</Label>
                                    <Input id="restaurant-name" defaultValue="Da Pino" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="restaurant-type">Tipo di Locale</Label>
                                    <Select defaultValue="pizzeria">
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
                                <Input id="address" defaultValue="Via Roma, 1, 10121 Torino TO" />
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Telefono</Label>
                                    <Input id="phone" defaultValue="+39 011 123 4567" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" defaultValue="info@dapino.it" />
                                </div>
                            </div>
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
