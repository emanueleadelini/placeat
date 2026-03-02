import { FloorPlanEditor } from '@/components/floor-plan-editor/editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PenLine, Pentagon, RectangleHorizontal, Save } from 'lucide-react';

export default function FloorPlanPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Piantina del Locale</h1>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Salva Piantina
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 flex-1">
        <div className="lg:col-span-1 flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Come creare la tua piantina</CardTitle>
                    <CardDescription>Segui questi semplici passaggi per digitalizzare il tuo locale.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="flex gap-4 items-start">
                        <div className="flex items-center justify-center bg-muted rounded-full w-8 h-8 shrink-0">
                            <span className="font-bold text-primary">1</span>
                        </div>
                        <div>
                            <h3 className="font-semibold flex items-center gap-2"><PenLine className="w-4 h-4 text-muted-foreground" /> Disegna le Mura</h3>
                            <p className="text-sm text-muted-foreground mt-1">Seleziona lo strumento "Muro" e traccia le pareti perimetrali e interne del tuo ristorante per definirne la struttura.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="flex items-center justify-center bg-muted rounded-full w-8 h-8 shrink-0">
                             <span className="font-bold text-primary">2</span>
                        </div>
                        <div>
                            <h3 className="font-semibold flex items-center gap-2"><Pentagon className="w-4 h-4 text-muted-foreground" /> Definisci le Zone</h3>
                            <p className="text-sm text-muted-foreground mt-1">Usa lo strumento "Zona" per delimitare e dare un nome alle diverse aree: Sala Principale, Dehor, Terrazza, Sala Fumatori, ecc.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="flex items-center justify-center bg-muted rounded-full w-8 h-8 shrink-0">
                           <span className="font-bold text-primary">3</span>
                        </div>
                        <div>
                            <h3 className="font-semibold flex items-center gap-2"><RectangleHorizontal className="w-4 h-4 text-muted-foreground" /> Inserisci i Tavoli</h3>
                            <p className="text-sm text-muted-foreground mt-1">Seleziona lo strumento "Tavolo" e clicca sulla piantina per aggiungerli. Poi potrai spostarli, ruotarli e definirne la capienza.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2 border-2 border-dashed rounded-xl overflow-hidden">
          <FloorPlanEditor />
        </div>
      </div>
    </div>
  );
}
