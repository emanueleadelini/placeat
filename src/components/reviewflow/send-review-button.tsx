'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Prenotazione } from '@/lib/types';

interface SendReviewButtonProps {
  prenotazione: Prenotazione;
  ristoranteId: string;
  restaurantName?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
}

export function SendReviewButton({
  prenotazione,
  ristoranteId,
  restaurantName = 'Il nostro ristorante',
  variant = 'outline',
  size = 'sm',
  disabled = false,
}: SendReviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const handleSend = async () => {
    setIsSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/reviewflow/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenotazioneId: prenotazione.id,
          ristoranteId,
          manual: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: `Richiesta di recensione inviata con successo a ${prenotazione.cliente.nome}!`,
        });
        toast({
          title: 'Richiesta inviata',
          description: `Email inviata a ${prenotazione.cliente.email}`,
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Errore durante l\'invio della richiesta',
        });
        toast({
          title: 'Errore',
          description: data.error || 'Impossibile inviare la richiesta',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Errore di rete',
      });
      toast({
        title: 'Errore',
        description: 'Errore di rete durante l\'invio',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setResult(null);
  };

  const canSend = prenotazione.cliente?.email && !prenotazione.recensioneInviata;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || !canSend}
          className="gap-1"
          title={!prenotazione.cliente?.email ? 'Email mancante' : 'Invia richiesta recensione'}
        >
          <Send className="h-4 w-4" />
          {size !== 'icon' && 'Invia Recensione'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invia Richiesta Recensione</DialogTitle>
          <DialogDescription>
            Vuoi inviare una richiesta di recensione a questo cliente?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="font-medium">{prenotazione.cliente.nome}</p>
            <p className="text-sm text-muted-foreground">{prenotazione.cliente.email}</p>
            <p className="text-sm text-muted-foreground">
              {prenotazione.numeroPersone} persone •{' '}
              {prenotazione.data instanceof Date
                ? prenotazione.data.toLocaleDateString('it-IT')
                : new Date(prenotazione.data.seconds * 1000).toLocaleDateString('it-IT')}{' '}
              alle {prenotazione.ora}
            </p>
          </div>

          {prenotazione.recensioneInviata && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Attenzione: una richiesta di recensione è già stata inviata per questa prenotazione.
                Potrebbe essere inviata di nuovo.
              </p>
            </div>
          )}

          {result && (
            <div
              className={`mt-4 p-3 rounded-lg flex items-start gap-2 ${
                result.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/30'
                  : 'bg-red-50 dark:bg-red-950/30'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p
                className={`text-sm ${
                  result.success
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-red-700 dark:text-red-300'
                }`}
              >
                {result.message}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Chiudi
          </Button>
          {!result?.success && (
            <Button onClick={handleSend} disabled={isSending}>
              {isSending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Send className="h-4 w-4 mr-2" />
              Invia Richiesta
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Compact version for table/list views
export function SendReviewButtonCompact({
  prenotazione,
  ristoranteId,
  restaurantName,
}: Omit<SendReviewButtonProps, 'variant' | 'size'>) {
  return (
    <SendReviewButton
      prenotazione={prenotazione}
      ristoranteId={ristoranteId}
      restaurantName={restaurantName}
      variant="ghost"
      size="icon"
    />
  );
}
