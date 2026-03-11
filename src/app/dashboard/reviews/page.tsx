'use client';

import { useEffect, useState } from 'react';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Ristorante, ReviewRequest, ReviewStats } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  HardHat,
  Percent,
  Send,
  Star,
  TrendingUp,
  MousePointerClick,
  CheckCircle2,
  Loader2,
  Settings,
  RefreshCw,
  QrCode,
  Mail,
} from 'lucide-react';
import { QRCodeDisplay } from '@/components/reviewflow/qr-code-display';
import Link from 'next/link';

interface ReviewRequestWithDate extends ReviewRequest {
  createdAtDate?: Date;
  sentAtDate?: Date;
}

export default function ReviewsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [ristoranteId, setRistoranteId] = useState<string | null>(null);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [requests, setRequests] = useState<ReviewRequestWithDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReviewFlowEnabled, setIsReviewFlowEnabled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Get restaurant
  const ristorantiQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'ristoranti'), where('proprietarioUid', '==', user.uid));
  }, [user, firestore]);

  const { data: ristorantiData } = useCollection<Ristorante>(ristorantiQuery);
  const ristorante = ristorantiData?.[0];

  useEffect(() => {
    if (ristorante?.id) {
      setRistoranteId(ristorante.id);
      setIsReviewFlowEnabled(ristorante.reviewflow?.attivo ?? false);
    }
  }, [ristorante]);

  const loadStats = async () => {
    if (!ristoranteId) return;

    try {
      const response = await fetch(`/api/reviewflow/stats?ristoranteId=${ristoranteId}&includeRequests=true`);
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        // Convert timestamps to dates
        const requestsWithDates = (data.requests || []).map((req: ReviewRequest) => ({
          ...req,
          createdAtDate: req.createdAt ? new Date(req.createdAt.seconds * 1000) : undefined,
          sentAtDate: req.sentAt ? new Date(req.sentAt.seconds * 1000) : undefined,
        }));
        setRequests(requestsWithDates);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    if (ristoranteId) {
      loadStats().then(() => setLoading(false));
    }
  }, [ristoranteId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const toggleReviewFlow = async () => {
    if (!ristoranteId || !firestore) return;

    try {
      const newValue = !isReviewFlowEnabled;
      
      // Update via API
      const response = await fetch('/api/reviewflow/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId: `${ristoranteId}_config`,
          updates: { enabled: newValue },
        }),
      });

      if (response.ok) {
        setIsReviewFlowEnabled(newValue);
        toast({
          title: newValue ? 'ReviewFlow attivato' : 'ReviewFlow disattivato',
          description: newValue
            ? 'Le richieste di recensione verranno inviate automaticamente'
            : 'Le richieste automatiche sono state disattivate',
        });
      }
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile aggiornare le impostazioni',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge variant="default" className="gap-1">
            <Mail className="h-3 w-3" />
            Inviata
          </Badge>
        );
      case 'clicked':
        return (
          <Badge variant="secondary" className="gap-1">
            <MousePointerClick className="h-3 w-3" />
            Cliccata
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="bg-emerald-500 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Completata
          </Badge>
        );
      case 'failed':
        return <Badge variant="destructive">Fallita</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline">In attesa</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Richieste Inviate',
      value: stats?.totalSent?.toString() || '0',
      icon: Send,
      trend: `+${stats?.thisMonthSent || 0} questo mese`,
    },
    {
      title: 'Click Ricevuti',
      value: stats?.totalClicked?.toString() || '0',
      icon: MousePointerClick,
      trend: `${stats?.clickRate || 0}% click rate`,
    },
    {
      title: 'Conversioni',
      value: stats?.totalCompleted?.toString() || '0',
      icon: CheckCircle2,
      trend: `${stats?.conversionRate || 0}% conversione`,
    },
    {
      title: 'Tasso Apertura',
      value: `${stats?.clickRate || 0}%`,
      icon: TrendingUp,
      color: 'text-emerald-500',
    },
  ];

  return (
    <div className="grid gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Recensioni</h1>
          <p className="text-muted-foreground">
            Monitora e gestisci la raccolta delle recensioni dai tuoi clienti.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
          <Link href="/dashboard/settings/reviewflow">
            <Button size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configura
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color ?? ''}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.trend && (
                <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="requests">Richieste</TabsTrigger>
          <TabsTrigger value="qrcode">QR Code</TabsTrigger>
          <TabsTrigger value="settings">Impostazioni Rapide</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Storico Richieste</CardTitle>
              <CardDescription>
                Ultime richieste di recensione inviate e il loro stato.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requests.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {requests.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-semibold text-primary">
                              {req.clienteNome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{req.clienteNome}</p>
                            <p className="text-xs text-muted-foreground">{req.clienteEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            {getStatusBadge(req.status)}
                            {req.sentAtDate && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {req.sentAtDate.toLocaleDateString('it-IT')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nessuna richiesta inviata</p>
                  <p className="text-sm">
                    Inizia inviando richieste di recensione ai tuoi clienti.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qrcode">
          <div className="grid lg:grid-cols-2 gap-6">
            <QRCodeDisplay
              googleReviewLink={ristorante?.reviewflow?.googleLink}
              restaurantName={ristorante?.nome}
              size={280}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Come usare il QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-semibold text-primary text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Scarica il QR Code</p>
                      <p className="text-sm text-muted-foreground">
                        Clicca sul pulsante &quot;Scarica PNG&quot; per salvare il QR code in alta
                        risoluzione.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-semibold text-primary text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Stampa su materiale appropriato</p>
                      <p className="text-sm text-muted-foreground">
                        Carta lucida o adesivi vinilici per una migliore scansione.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-semibold text-primary text-sm">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Esposizione strategica</p>
                      <p className="text-sm text-muted-foreground">
                        Posiziona il QR code su tavoli, bancone, menu o portaconto.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      💡 Suggerimento
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      I clienti sono più propensi a lasciare una recensione subito dopo una buona
                      esperienza. Chiedi gentilmente al momento del pagamento!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni ReviewFlow</CardTitle>
              <CardDescription>
                Gestisci le impostazioni di base della raccolta recensioni.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isReviewFlowEnabled
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">ReviewFlow Automatico</h3>
                    <p className="text-sm text-muted-foreground">
                      Invia automaticamente richieste di recensione dopo ogni prenotazione
                    </p>
                  </div>
                </div>
                <Switch checked={isReviewFlowEnabled} onCheckedChange={toggleReviewFlow} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">QR Code nel locale</h3>
                    <p className="text-sm text-muted-foreground">
                      Esposizione fisica per raccogliere recensioni sul posto
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/settings/reviewflow">
                  <Button variant="outline" size="sm">
                    Configura
                  </Button>
                </Link>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Per impostazioni avanzate, vai alla pagina dedicata.
                </p>
                <Link href="/dashboard/settings/reviewflow">
                  <Button>Configurazione Completa</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Riepilogo Feedback AI</CardTitle>
          <CardDescription>
            Un&apos;analisi dei temi comuni emersi dalle recensioni a basso punteggio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-muted-foreground bg-muted rounded-lg flex flex-col items-center justify-center h-full">
            <HardHat className="w-12 h-12 mb-4" />
            <p className="font-semibold">Funzionalità in costruzione</p>
            <p className="text-sm">Il nostro AI sta imparando a riassumere i feedback per te.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
