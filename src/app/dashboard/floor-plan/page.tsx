'use client';

import { useRef, useState, useEffect } from 'react';
import { FloorPlanEditor } from '@/components/floor-plan-editor/editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Circle, PenLine, Save, Layers, Square as SquareIcon, Loader2, Wrench } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { Ristorante } from '@/lib/types';

export default function FloorPlanPage() {
  const editorRef = useRef<{ publish: () => Promise<void> }>(null);
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);
  
  const firestore = useFirestore();
  const { user } = useUser();
  const [ristoranteId, setRistoranteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && firestore) {
      const q = query(collection(firestore, 'ristoranti'), where('proprietarioUid', '==', user.uid));
      getDocs(q).then(async (snapshot) => {
        if (!snapshot.empty) {
          // Assuming one user owns one restaurant for this context
          setRistoranteId(snapshot.docs[0].id);
          setLoading(false);
        } else {
          // No restaurant found, create a default one to unblock the user
          const newRistoranteRef = doc(collection(firestore, 'ristoranti'));
          const newRistoranteData: Partial<Ristorante> = {
            proprietarioUid: user.uid,
            nome: "Il Mio Ristorante",
            email: user.email || "",
            onboardingCompletato: false,
            onboardingStep: 3, // Let's assume they are at the floor plan step
            // Add other required default fields from your Ristorante type
            tipo: 'ristorante',
            indirizzo: '',
            telefono: '',
            stato: 'trial',
            piano: 'free',
            durataTurnoDefault: 60,
            fusoOrario: 'Europe/Rome',
            createdAt: new Date() as any, // Will be converted to Timestamp by Firestore
          };
          try {
            await setDoc(newRistoranteRef, newRistoranteData);
            setRistoranteId(newRistoranteRef.id);
            toast({
              title: "Profilo creato!",
              description: "Abbiamo creato un profilo di base per il tuo ristorante così puoi iniziare subito.",
            });
          } catch(err) {
             console.error("Error creating default restaurant: ", err);
              toast({
                title: "Errore",
                description: "Impossibile creare un profilo per il tuo ristorante. Ricarica la pagina.",
                variant: "destructive"
              })
          } finally {
            setLoading(false);
          }
        }
      }).catch(err => {
        console.error("Error fetching ristoranteId: ", err);
        setLoading(false);
        toast({
          title: "Errore di caricamento",
          description: "Impossibile verificare i dati del tuo ristorante.",
          variant: "destructive"
        })
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
          title: "Piantina pubblicata!",
          description: "Le modifiche alla piantina sono state salvate con successo.",
        });
      } catch (error) {
        console.error("Failed to publish floor plan:", error);
        toast({
          title: "Errore",
          description: "Non è stato possibile salvare la piantina. Riprova.",
          variant: "destructive",
        });
      } finally {
        setIsPublishing(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold">Piantina del Locale</h1>
            <p className="text-muted-foreground">Crea e gestisci la disposizione del tuo ristorante.</p>
        </div>
        <Button onClick={handlePublish} disabled={isPublishing || loading || !ristoranteId}>
          {isPublishing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Pubblica Piantina
        </Button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 flex-1">
        <div className="lg:col-span-3 flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Come funziona</CardTitle>
                    <CardDescription>Crea la tua piantina in 6 passaggi.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="flex gap-4 items-start">
                        <div className="flex items-center justify-center bg-muted rounded-full w-8 h-8 shrink-0">
                            <span className="font-bold text-primary">1</span>
                        </div>
                        <div>
                            <h3 className="font-semibold flex items-center gap-2"><SquareIcon className="w-4 h-4 text-muted-foreground" /> Disegna le Forme Base</h3>
                            <p className="text-sm text-muted-foreground mt-1">Usa gli strumenti "Rettangolo" o "Cerchio" per disegnare le aree principali. Clicca e trascina per creare le forme.</p>
                        </div>
                    </div>
                     <div className="flex gap-4 items-start">
                        <div className="flex items-center justify-center bg-muted rounded-full w-8 h-8 shrink-0">
                            <span className="font-bold text-primary">2</span>
                        </div>
                        <div>
                            <h3 className="font-semibold flex items-center gap-2"><Layers className="w-4 h-4 text-muted-foreground" /> Disegna a Mano Libera</h3>
                            <p className="text-sm text-muted-foreground mt-1">Per forme complesse, usa "Zona" per disegnare un perimetro punto per punto. Fai doppio click per finire.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="flex items-center justify-center bg-muted rounded-full w-8 h-8 shrink-0">
                             <span className="font-bold text-primary">3</span>
                        </div>
                        <div>
                            <h3 className="font-semibold flex items-center gap-2"><Layers className="w-4 h-4 text-muted-foreground" /> Definisci le Zone</h3>
                            <p className="text-sm text-muted-foreground mt-1">Seleziona una forma e assegnale un nome (es. 'Sala principale') e un colore dal pannello delle proprietà.</p>
                        </div>
                    </div>
                     <div className="flex gap-4 items-start">
                        <div className="flex items-center justify-center bg-muted rounded-full w-8 h-8 shrink-0">
                            <span className="font-bold text-primary">4</span>
                        </div>
                        <div>
                            <h3 className="font-semibold flex items-center gap-2"><PenLine className="w-4 h-4 text-muted-foreground" /> Aggiungi Dettagli</h3>
                            <p className="text-sm text-muted-foreground mt-1">Usa lo strumento "Muro" per aggiungere pareti interne o altri elementi strutturali.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="flex items-center justify-center bg-muted rounded-full w-8 h-8 shrink-0">
                           <span className="font-bold text-primary">5</span>
                        </div>
                        <div>
                            <h3 className="font-semibold flex items-center gap-2"><Circle className="w-4 h-4 text-muted-foreground" /> Inserisci i Tavoli</h3>
                            <p className="text-sm text-muted-foreground mt-1">Aggiungi i tavoli, assegnali a una zona, e definisci numero e capienza dal pannello delle proprietà.</p>
                        </div>
                    </div>
                     <div className="flex gap-4 items-start">
                        <div className="flex items-center justify-center bg-muted rounded-full w-8 h-8 shrink-0">
                           <span className="font-bold text-primary">6</span>
                        </div>
                        <div>
                            <h3 className="font-semibold flex items-center gap-2"><Save className="w-4 h-4 text-muted-foreground" /> Salva e Pubblica</h3>
                            <p className="text-sm text-muted-foreground mt-1">Una volta completata la piantina, clicca su "Pubblica Piantina" per salvare il tuo lavoro.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-9 border-2 border-dashed rounded-xl overflow-hidden">
           {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : ristoranteId ? (
            <FloorPlanEditor ref={editorRef} ristoranteId={ristoranteId} />
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 gap-4">
                <Wrench className="w-16 h-16 text-primary/70" />
                <p className="font-semibold text-lg">Profilo Ristorante non trovato</p>
                <p className="text-sm max-w-md">Sembra che il tuo profilo ristorante non sia stato ancora creato. Per favore, completa il processo di onboarding per poter creare e modificare la tua piantina.</p>
                <Button asChild>
                  <Link href="/onboarding">Vai alla Configurazione</Link>
                </Button>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
    
