import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Download, HardHat, Percent, Send, Star } from "lucide-react";
import Image from "next/image";

const stats = [
    { title: "Richieste Inviate", value: "1,250", icon: Send },
    { title: "Recensioni Ricevute", value: "82", icon: Star },
    { title: "Tasso Conversione", value: "6.56%", icon: Percent },
    { title: "Media Stelle", value: "4.8", icon: Star, color: "text-yellow-500" },
]

export default function ReviewsPage() {
    const qrCodeImage = PlaceHolderImages.find(p => p.id === 'qr-code');

    return (
        <div className="grid gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl md:text-3xl font-bold">Recensioni</h1>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map(stat => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color ?? ''}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Riepilogo Feedback AI</CardTitle>
                        <CardDescription>Un'analisi dei temi comuni emersi dalle recensioni a basso punteggio.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-8 text-center text-muted-foreground bg-muted rounded-lg flex flex-col items-center justify-center h-full">
                            <HardHat className="w-12 h-12 mb-4" />
                            <p className="font-semibold">Funzionalità in costruzione</p>
                            <p className="text-sm">Il nostro AI sta imparando a riassumere i feedback per te.</p>
                        </div>
                    </CardContent>
                </Card>

                 <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>QR Code per Recensioni</CardTitle>
                        <CardDescription>Esponi questo QR code nel tuo locale per raccogliere recensioni sul posto.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center gap-4">
                        {qrCodeImage && (
                            <Image 
                                src={qrCodeImage.imageUrl}
                                alt={qrCodeImage.description}
                                width={200}
                                height={200}
                                data-ai-hint={qrCodeImage.imageHint}
                                className="rounded-lg border p-2"
                            />
                        )}
                        <Button className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            Scarica PDF A4
                        </Button>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Impostazioni ReviewFlow</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h3 className="font-medium">Attiva/Disattiva ReviewFlow</h3>
                            <p className="text-sm text-muted-foreground">Abilita l'invio automatico di richieste di recensione.</p>
                        </div>
                        <Switch defaultChecked={true} />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
