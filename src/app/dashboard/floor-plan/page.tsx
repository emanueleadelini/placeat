'use client';

import { useRef, useState, useEffect } from 'react';
import { FloorPlanEditor } from '@/components/floor-plan-editor/editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Circle,
  ChevronDown,
  PenLine,
  Save,
  Layers,
  Square as SquareIcon,
  Loader2,
  Wrench,
} from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { Ristorante } from '@/lib/types';

const STEPS = [
  {
    icon: SquareIcon,
    title: 'Disegna le Forme Base',
    desc: 'Usa "Rettangolo" o "Cerchio" per le aree principali. Clicca e trascina.',
  },
  {
    icon: Layers,
    title: 'Disegna a Mano Libera',
    desc: 'Usa "Zona" per forme complesse punto per punto. Doppio click per finire.',
  },
  {
    icon: Layers,
    title: 'Definisci le Zone',
    desc: 'Seleziona una forma e assegnale nome e colore dal pannello proprietà.',
  },
  {
    icon: PenLine,
    title: 'Aggiungi Dettagli',
    desc: 'Usa "Muro" per aggiungere pareti interne o elementi strutturali.',
  },
  {
    icon: Circle,
    title: 'Inserisci i Tavoli',
    desc: 'Aggiungi tavoli, assegnali a una zona e definisci numero e capienza.',
  },
  {
    icon: Save,
    title: 'Salva e Pubblica',
    desc: 'Clicca "Pubblica Piantina" per salvare le modifiche.',
  },
];

export default function FloorPlanPage() {
  const editorRef = useRef<{ publish: () => Promise<void> }>(null);
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const firestore = useFirestore();
  const { user } = useUser();
  const [ristoranteId, setRistoranteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && firestore) {
      const q = query(collection(firestore, 'ristoranti'), where('proprietarioUid', '==', user.uid));
      getDocs(q).then(async (snapshot) => {
        if (!snapshot.empty) {
          setRistoranteId(snapshot.docs[0].id);
          setLoading(false);
        } else {
          const newRistoranteRef = doc(collection(firestore, 'ristoranti'));
          const newRistoranteData: Partial<Ristorante> = {
            proprietarioUid: user.uid,
            nome: 'Il Mio Ristorante',
            email: user.email || '',
            onboardingCompletato: false,
            onboardingStep: 3,
            tipo: 'ristorante',
            indirizzo: '',
            telefono: '',
            stato: 'trial',
            piano: 'free',
            durataTurnoDefault: 60,
            fusoOrario: 'Europe/Rome',
            createdAt: new Date() as any,
          };
          try {
            await setDoc(newRistoranteRef, newRistoranteData);
            setRistoranteId(newRistoranteRef.id);
            toast({
              title: 'Profilo creato!',
              description: 'Abbiamo creato un profilo di base per il tuo ristorante.',
            });
          } catch {
            toast({
              title: 'Errore',
              description: 'Impossibile creare un profilo. Ricarica la pagina.',
              variant: 'destructive',
            });
          } finally {
            setLoading(false);
          }
        }
      }).catch(() => {
        setLoading(false);
        toast({
          title: 'Errore di caricamento',
          description: 'Impossibile verificare i dati del tuo ristorante.',
          variant: 'destructive',
        });
      });
    } else if (!user) {
      setLoading(false);
    }
  }, [user, firestore, toast]);

  const handlePublish = async () => {
    if (editorRef.current) {
      setIsPublishing(true);
      try {
        await editorRef.current.publish();
        toast({
          title: 'Piantina pubblicata!',
          description: 'Le modifiche sono state salvate con successo.',
        });
      } catch {
        toast({
          title: 'Errore',
          description: 'Non è stato possibile salvare la piantina. Riprova.',
          variant: 'destructive',
        });
      } finally {
        setIsPublishing(false);
      }
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Piantina del Locale</h1>
          <p className="text-muted-foreground text-sm">Crea e gestisci la disposizione del tuo ristorante.</p>
        </div>
        <div className="flex items-center gap-2">
          <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1">
                Guida
                <ChevronDown className={`h-4 w-4 transition-transform ${guideOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
          <Button
            onClick={handlePublish}
            disabled={isPublishing || loading || !ristoranteId}
          >
            {isPublishing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Pubblica Piantina
          </Button>
        </div>
      </div>

      {/* Guida collassabile */}
      <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
        <CollapsibleContent>
          <Card className="shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Come funziona — 6 passaggi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {STEPS.map((step, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center bg-muted rounded-full w-6 h-6 shrink-0">
                        <span className="font-bold text-primary text-xs">{i + 1}</span>
                      </div>
                      <step.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <p className="font-semibold text-xs">{step.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Editor — prende tutto lo spazio rimanente */}
      <div className="flex-1 min-h-0 border-2 border-dashed rounded-xl overflow-hidden" style={{ minHeight: '500px' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full min-h-[500px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : ristoranteId ? (
          <FloorPlanEditor ref={editorRef} ristoranteId={ristoranteId} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center text-muted-foreground p-8 gap-4">
            <Wrench className="w-16 h-16 text-primary/70" />
            <p className="font-semibold text-lg">Profilo Ristorante non trovato</p>
            <p className="text-sm max-w-md">
              Completa il processo di onboarding per poter creare la tua piantina.
            </p>
            <Button asChild>
              <Link href="/onboarding">Vai alla Configurazione</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
