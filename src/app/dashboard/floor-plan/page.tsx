import { FloorPlanEditor } from '@/components/floor-plan-editor/editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleDot, PenLine, Save } from 'lucide-react';

export default function FloorPlanPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold">Piantina del Locale</h1>
            <p className="text-muted-foreground">Crea e gestisci la disposizione del tuo ristorante.</p>
        </div>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Pubblica Piantina
        </Button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 flex-1">
        <div className="lg:col-span-3 flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Come funziona</CardTitle>
                    <CardDescription>Crea la tua piantina in 3 passaggi.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="flex gap-4 items-start">
                        <div className="flex items-center justify-center bg-muted rounded-full w-8 h-8 shrink-0">
                            <span className="font-bold text-primary">1</span>
                        </div>
                        <div>
                            <h3 className="font-semibold flex items-center gap-2"><PenLine className="w-4 h-4 text-muted-foreground" /> Disegna le Mura</h3>
                            <p className="text-sm text-muted-foreground mt-1">Usa lo strumento "Muro" per tracciare le pareti del locale. Puoi disegnare linee rette per creare la struttura base.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="flex items-center justify-center bg-muted rounded-full w-8 h-8 shrink-0">
                             <span className="font-bold text-primary">2</span>
                        </div>
                        <div>
                            <h3 className="font-semibold flex items-center gap-2"><CircleDot className="w-4 h-4 text-muted-foreground" /> Inserisci i Tavoli</h3>
                            <p className="text-sm text-muted-foreground mt-1">Aggiungi i tavoli, poi selezionali per modificarne numero, capienza e forma dal pannello delle proprietà.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="flex items-center justify-center bg-muted rounded-full w-8 h-8 shrink-0">
                           <span className="font-bold text-primary">3</span>
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
          <FloorPlanEditor />
        </div>
      </div>
    </div>
  );
}
