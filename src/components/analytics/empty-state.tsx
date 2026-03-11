"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  hasRistorante: boolean;
}

export function EmptyState({ hasRistorante }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle className="text-xl">Nessun dato disponibile</CardTitle>
        <CardDescription className="max-w-md mx-auto">
          {hasRistorante
            ? "Non hai ancora ricevuto prenotazioni. Inizia a ricevere prenotazioni per vedere le statistiche del tuo ristorante."
            : "Completa la configurazione del tuo ristorante per iniziare a ricevere prenotazioni e visualizzare le analytics."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center gap-4">
        {hasRistorante ? (
          <Link href="/ristorante" target="_blank">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Condividi Pagina Ristorante
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Link href="/dashboard/settings">
            <Button>
              Configura Ristorante
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
