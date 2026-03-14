"use client";

import { useState, useEffect } from "react";
import { DraftingCompass, Building, Clock, LayoutGrid, Star, PartyPopper, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FloorPlanEditor } from "@/components/floor-plan-editor/editor";
import Link from "next/link";
import { useUser, useFirestore } from "@/firebase";
import { useRouter } from "next/navigation";
import { collection, doc, setDoc, writeBatch, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Ristorante } from "@/lib/types";

const steps = [
  { id: 1, title: "Dati Base", icon: Building },
  { id: 2, title: "Orari Apertura", icon: Clock },
  { id: 3, title: "Editor Piantina", icon: LayoutGrid },
  { id: 4, title: "ReviewFlow", icon: Star },
  { id: 5, title: "Completato", icon: PartyPopper },
];

const daysOfWeek = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

type OraInfo = { aperto: boolean; dalle: string; alle: string };

const defaultOrari = (): Record<string, OraInfo> =>
  Object.fromEntries(
    daysOfWeek.map(day => [day, { aperto: true, dalle: "19:00", alle: "23:00" }])
  );

interface Step1Props {
  nome: string; setNome: (v: string) => void;
  tipo: string; setTipo: (v: string) => void;
  indirizzo: string; setIndirizzo: (v: string) => void;
  telefono: string; setTelefono: (v: string) => void;
}

const Step1 = ({ nome, setNome, tipo, setTipo, indirizzo, setIndirizzo, telefono, setTelefono }: Step1Props) => (
  <div className="grid gap-6">
    <div className="grid md:grid-cols-2 gap-6">
      <div className="grid gap-2">
        <Label htmlFor="restaurant-name">Nome Ristorante</Label>
        <Input
          id="restaurant-name"
          placeholder="Es. Ristorante Da Pino"
          value={nome}
          onChange={e => setNome(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="restaurant-type">Tipo di Locale</Label>
        <Select value={tipo} onValueChange={setTipo}>
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
      <Input
        id="address"
        placeholder="Via, numero civico, città, CAP"
        value={indirizzo}
        onChange={e => setIndirizzo(e.target.value)}
      />
    </div>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="grid gap-2">
        <Label htmlFor="phone">Telefono</Label>
        <Input
          id="phone"
          placeholder="Per conferme prenotazioni"
          value={telefono}
          onChange={e => setTelefono(e.target.value)}
        />
      </div>
    </div>
  </div>
);

interface Step2Props {
  orari: Record<string, OraInfo>;
  setOrari: (v: Record<string, OraInfo>) => void;
}

const Step2 = ({ orari, setOrari }: Step2Props) => (
  <div className="grid gap-4">
    {daysOfWeek.map(day => (
      <div key={day} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <Checkbox
            id={`cb-${day}`}
            checked={orari[day].aperto}
            onCheckedChange={checked =>
              setOrari({ ...orari, [day]: { ...orari[day], aperto: !!checked } })
            }
          />
          <Label htmlFor={`cb-${day}`} className="font-medium w-24">{day}</Label>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            type="time"
            value={orari[day].dalle}
            disabled={!orari[day].aperto}
            onChange={e => setOrari({ ...orari, [day]: { ...orari[day], dalle: e.target.value } })}
          />
          <span>-</span>
          <Input
            type="time"
            value={orari[day].alle}
            disabled={!orari[day].aperto}
            onChange={e => setOrari({ ...orari, [day]: { ...orari[day], alle: e.target.value } })}
          />
        </div>
      </div>
    ))}
  </div>
);

const Step3 = () => (
  <div className="grid gap-4">
    <p className="text-sm text-muted-foreground">
      L&apos;editor piantina è disponibile nella Dashboard dopo la registrazione. Puoi configurare tavoli e zone in qualsiasi momento.
    </p>
    <div className="h-[400px] border-2 border-dashed rounded-xl overflow-hidden">
      <FloorPlanEditor />
    </div>
  </div>
);

interface Step4Props {
  googleLink: string;
  setGoogleLink: (v: string) => void;
}

const Step4 = ({ googleLink, setGoogleLink }: Step4Props) => (
  <div className="grid gap-6">
    <div className="grid gap-2">
      <Label htmlFor="google-link">Link Recensioni Google My Business</Label>
      <Input
        id="google-link"
        placeholder="https://g.page/r/..../review"
        value={googleLink}
        onChange={e => setGoogleLink(e.target.value)}
      />
      <p className="text-sm text-muted-foreground">
        Questo è il link diretto che i tuoi clienti useranno per lasciare una recensione.
        Puoi trovarlo su Google Business Profile. Campo opzionale — configurabile anche in seguito.
      </p>
    </div>
  </div>
);

const Step5 = () => (
  <div className="text-center flex flex-col items-center">
    <PartyPopper className="w-16 h-16 text-primary mb-4" />
    <h2 className="text-2xl font-bold mb-2">Configurazione completata!</h2>
    <p className="text-muted-foreground mb-6">
      Il tuo ristorante è pronto per accettare prenotazioni.
    </p>
  </div>
);

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Form state
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('ristorante');
  const [indirizzo, setIndirizzo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [orari, setOrari] = useState<Record<string, OraInfo>>(defaultOrari());
  const [googleLink, setGoogleLink] = useState('');

  const progress = (currentStep / steps.length) * 100;

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/signup');
    }
  }, [user, isUserLoading, router]);

  const handleNext = () => {
    if (currentStep < steps.length) setCurrentStep(s => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };

  const handleComplete = async () => {
    if (!user || !firestore) return;
    setIsSaving(true);
    try {
      const ristoranteRef = doc(collection(firestore, 'ristoranti'));
      const ristoranteId = ristoranteRef.id;
      const now = Timestamp.now();
      const trialEnd = Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));

      await setDoc(ristoranteRef, {
        id: ristoranteId,
        nome: nome.trim() || 'Il mio ristorante',
        tipo: (tipo as Ristorante['tipo']) || 'ristorante',
        indirizzo: indirizzo.trim(),
        telefono: telefono.trim(),
        email: user.email || '',
        proprietarioUid: user.uid,
        stato: 'trial',
        piano: 'free',
        trialEndsAt: trialEnd,
        durataTurnoDefault: 90,
        fusoOrario: 'Europe/Rome',
        onboardingCompletato: true,
        onboardingStep: 5,
        createdAt: now,
      });

      const batch = writeBatch(firestore);

      // Save daily opening hours
      daysOfWeek.forEach((day, idx) => {
        const info = orari[day];
        const orarioRef = doc(collection(firestore, 'ristoranti', ristoranteId, 'dailyOpeningHours'));
        batch.set(orarioRef, {
          id: orarioRef.id,
          ristoranteId,
          proprietarioUid: user.uid,
          dayOfWeek: day,
          aperto: info.aperto,
          dalle: info.dalle,
          alle: info.alle,
          slotIndex: idx,
        });
      });

      // Save ReviewFlow config if Google link provided
      if (googleLink.trim()) {
        const configRef = doc(collection(firestore, 'ristoranti', ristoranteId, 'reviewFlowConfiguration'));
        batch.set(configRef, {
          id: configRef.id,
          ristoranteId,
          proprietarioUid: user.uid,
          enabled: true,
          delayHours: 24,
          googleReviewLink: googleLink.trim(),
          sendEmail: true,
          showQRCode: true,
          createdAt: now,
          updatedAt: now,
        });
      }

      await batch.commit();
      router.push('/dashboard');
    } catch (e) {
      console.error(e);
      toast({ title: 'Errore', description: 'Impossibile salvare i dati. Riprova.' });
    } finally {
      setIsSaving(false);
    }
  };

  const currentStepInfo = steps[currentStep - 1];

  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1 nome={nome} setNome={setNome} tipo={tipo} setTipo={setTipo} indirizzo={indirizzo} setIndirizzo={setIndirizzo} telefono={telefono} setTelefono={setTelefono} />;
      case 2: return <Step2 orari={orari} setOrari={setOrari} />;
      case 3: return <Step3 />;
      case 4: return <Step4 googleLink={googleLink} setGoogleLink={setGoogleLink} />;
      case 5: return <Step5 />;
      default: return null;
    }
  };

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
                  {currentStep === 3 && "Configura la piantina del tuo ristorante."}
                  {currentStep === 4 && "Imposta la raccolta automatica delle recensioni."}
                  {currentStep === 5 && "Tutto pronto! Salva e accedi alla Dashboard."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="min-h-[300px]">
            {renderStep()}
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || isSaving}>
            Indietro
          </Button>
          {currentStep < steps.length ? (
            <Button onClick={handleNext} disabled={isSaving}>
              Avanti
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvataggio...</> : 'Salva e vai alla Dashboard'}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
