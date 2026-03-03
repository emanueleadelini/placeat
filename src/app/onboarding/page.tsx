"use client";

import { useState, useEffect } from "react";
import { DraftingCompass, Building, Clock, LayoutGrid, Star, PartyPopper } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FloorPlanEditor } from "@/components/floor-plan-editor/editor";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";

const steps = [
  { id: 1, title: "Dati Base", icon: Building },
  { id: 2, title: "Orari Apertura", icon: Clock },
  { id: 3, title: "Editor Piantina", icon: LayoutGrid },
  { id: 4, title: "ReviewFlow", icon: Star },
  { id: 5, title: "Completato", icon: PartyPopper },
];

const daysOfWeek = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

const Step1 = () => (
    <div className="grid gap-6">
        <div className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-2">
                <Label htmlFor="restaurant-name">Nome Ristorante</Label>
                <Input id="restaurant-name" placeholder="Es. Ristorante Da Pino" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="restaurant-type">Tipo di Locale</Label>
                <Select>
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
            <Input id="address" placeholder="Via, numero civico, città, CAP" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input id="phone" placeholder="Per conferme prenotazioni" />
            </div>
        </div>
    </div>
);

const Step2 = () => (
  <div className="grid gap-4">
    {daysOfWeek.map(day => (
      <div key={day} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <Checkbox id={`cb-${day}`} defaultChecked />
          <Label htmlFor={`cb-${day}`} className="font-medium w-24">{day}</Label>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input type="time" defaultValue="19:00" />
          <span>-</span>
          <Input type="time" defaultValue="23:00" />
        </div>
      </div>
    ))}
  </div>
);

const Step3 = () => (
    <div className="h-[500px] border-2 border-dashed rounded-xl overflow-hidden">
        <FloorPlanEditor />
    </div>
);


const Step4 = () => (
    <div className="grid gap-6">
        <div className="grid gap-2">
            <Label htmlFor="google-link">Link Recensioni Google My Business</Label>
            <Input id="google-link" placeholder="https://g.page/r/..../review" />
            <p className="text-sm text-muted-foreground">
                Questo è il link diretto che i tuoi clienti useranno per lasciare una recensione.
            </p>
        </div>
    </div>
);

const Step5 = () => {
    const qrCodeImage = PlaceHolderImages.find(p => p.id === 'qr-code');
    return (
        <div className="text-center flex flex-col items-center">
            <PartyPopper className="w-16 h-16 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Configurazione completata!</h2>
            <p className="text-muted-foreground mb-6">Il tuo ristorante è pronto per accettare prenotazioni. Ecco il tuo QR code personale.</p>
            {qrCodeImage && (
                <Image
                    src={qrCodeImage.imageUrl}
                    alt={qrCodeImage.description}
                    width={150}
                    height={150}
                    data-ai-hint={qrCodeImage.imageHint}
                    className="rounded-lg border p-2 mb-4"
                />
            )}
        </div>
    );
};


export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const progress = (currentStep / steps.length) * 100;

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/signup');
    }
  }, [user, isUserLoading, router]);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const CurrentStepComponent = () => {
    switch(currentStep) {
        case 1: return <Step1 />;
        case 2: return <Step2 />;
        case 3: return <Step3 />;
        case 4: return <Step4 />;
        case 5: return <Step5 />;
        default: return null;
    }
  }

  const currentStepInfo = steps[currentStep - 1];

  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col">
        <header className="p-4 border-b bg-background flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
                <DraftingCompass className="h-6 w-6 text-primary" />
                <span className="font-bold">PLACEAT</span>
            </Link>
             <Button variant="ghost" asChild>
                <Link href="/dashboard">Esci</Link>
             </Button>
        </header>

        <main className="flex-1 container max-w-4xl mx-auto py-8 md:py-12">
            <div className="mb-8">
                <Progress value={progress} className="mb-2" />
                <p className="text-sm text-muted-foreground">Passo {currentStep} di {steps.length}: {currentStepInfo.title}</p>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <currentStepInfo.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle>{currentStepInfo.title}</CardTitle>
                            <CardDescription>
                                {currentStep === 1 && "Inserisci i dati principali del tuo locale."}
                                {currentStep === 2 && "Definisci gli orari di apertura settimanali."}
                                {currentStep === 3 && "Disegna la piantina del tuo ristorante."}
                                {currentStep === 4 && "Imposta la raccolta automatica delle recensioni."}
                                {currentStep === 5 && "Tutto pronto! Sei pronto a partire."}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="min-h-[300px]">
                    <CurrentStepComponent />
                </CardContent>
            </Card>

            <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
                    Indietro
                </Button>
                {currentStep < steps.length ? (
                    <Button onClick={handleNext}>
                        Avanti
                    </Button>
                ) : (
                    <Button asChild>
                        <Link href="/dashboard">Vai alla Dashboard</Link>
                    </Button>
                )}
            </div>
        </main>
    </div>
  );
}

    
