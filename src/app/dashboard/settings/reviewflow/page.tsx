'use client';

import { useEffect, useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';
import type { Ristorante, ReviewFlowConfig } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Save,
  Mail,
  Clock,
  MessageSquare,
  Link as LinkIcon,
  QrCode,
  CheckCircle2,
  Star,
  Send,
} from 'lucide-react';
import { QRCodeDisplay } from '@/components/reviewflow/qr-code-display';

const delayOptions = [
  { value: 0, label: 'Stesso giorno', description: 'Invia subito dopo la prenotazione' },
  { value: 24, label: '1 giorno dopo', description: 'Invia il giorno successivo' },
  { value: 72, label: '3 giorni dopo', description: 'Dà tempo al cliente di riflettere' },
  { value: 168, label: '7 giorni dopo', description: 'Per clienti che tornano a casa' },
];

export default function ReviewFlowSettingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [ristorante, setRistorante] = useState<Ristorante | null>(null);
  const [config, setConfig] = useState<Partial<ReviewFlowConfig>>({
    enabled: false,
    delayHours: 24,
    customMessage: '',
    googleReviewLink: '',
    tripadvisorLink: '',
    theforkLink: '',
    sendEmail: true,
    showQRCode: true,
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [ristoranteId, setRistoranteId] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (user && firestore) {
      loadData();
    }
  }, [user, firestore]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get restaurant
      const ristorantiQuery = query(
        collection(firestore, 'ristoranti'),
        where('proprietarioUid', '==', user?.uid)
      );
      const ristorantiSnap = await getDocs(ristorantiQuery);

      if (!ristorantiSnap.empty) {
        const ristoranteDoc = ristorantiSnap.docs[0];
        const ristoranteData = { ...ristoranteDoc.data(), id: ristoranteDoc.id } as Ristorante;
        setRistorante(ristoranteData);
        setRistoranteId(ristoranteDoc.id);

        // Get or create ReviewFlow config
        await loadOrCreateConfig(ristoranteDoc.id, ristoranteData);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare le impostazioni ReviewFlow',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOrCreateConfig = async (restId: string, ristoranteData: Ristorante) => {
    try {
      // Check if config exists in Firestore
      const configsQuery = query(
        collection(firestore, 'reviewflowConfigs'),
        where('ristoranteId', '==', restId)
      );
      const configsSnap = await getDocs(configsQuery);

      if (!configsSnap.empty) {
        const configDoc = configsSnap.docs[0];
        const configData = configDoc.data();
        setConfigId(configDoc.id);
        setConfig({
          enabled: configData.enabled ?? false,
          delayHours: configData.delayHours ?? 24,
          customMessage: configData.customMessage ?? '',
          googleReviewLink: configData.googleReviewLink ?? ristoranteData.reviewflow?.googleLink ?? '',
          tripadvisorLink: configData.tripadvisorLink ?? '',
          theforkLink: configData.theforkLink ?? '',
          sendEmail: configData.sendEmail ?? true,
          showQRCode: configData.showQRCode ?? true,
        });
      } else {
        // Use default values, potentially from existing ristorante.reviewflow
        setConfig({
          enabled: ristoranteData.reviewflow?.attivo ?? false,
          delayHours: ristoranteData.reviewflow?.timingInvio ?? 24,
          customMessage: '',
          googleReviewLink: ristoranteData.reviewflow?.googleLink ?? '',
          tripadvisorLink: '',
          theforkLink: '',
          sendEmail: true,
          showQRCode: true,
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const handleSave = async () => {
    if (!firestore || !ristoranteId) return;

    setIsSaving(true);
    try {
      const configData = {
        ristoranteId,
        enabled: config.enabled,
        delayHours: config.delayHours,
        customMessage: config.customMessage || '',
        googleReviewLink: config.googleReviewLink || '',
        tripadvisorLink: config.tripadvisorLink || '',
        theforkLink: config.theforkLink || '',
        sendEmail: config.sendEmail,
        showQRCode: config.showQRCode,
        updatedAt: Timestamp.now(),
      };

      if (configId) {
        // Update existing config
        await setDoc(doc(firestore, 'reviewflowConfigs', configId), configData, { merge: true });
      } else {
        // Create new config
        const newConfigRef = doc(collection(firestore, 'reviewflowConfigs'));
        await setDoc(newConfigRef, {
          ...configData,
          createdAt: Timestamp.now(),
        });
        setConfigId(newConfigRef.id);
      }

      // Also update the ristorante document for backwards compatibility
      await setDoc(
        doc(firestore, 'ristoranti', ristoranteId),
        {
          reviewflow: {
            attivo: config.enabled,
            googleLink: config.googleReviewLink,
            timingInvio: config.delayHours,
            qrCodeUrl: '', // Will be generated dynamically
          },
        },
        { merge: true }
      );

      toast({
        title: 'Impostazioni salvate',
        description: 'Le impostazioni ReviewFlow sono state aggiornate con successo.',
      });
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast({
        title: 'Errore',
        description: `Impossibile salvare le impostazioni: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getDelayLabel = (hours: number) => {
    const option = delayOptions.find((o) => o.value === hours);
    return option?.label || `${hours} ore`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">ReviewFlow</h1>
          <p className="text-muted-foreground">
            Automatizza la raccolta delle recensioni dai tuoi clienti.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" />
          Salva Impostazioni
        </Button>
      </div>

      {/* Status Banner */}
      <div
        className={`p-4 rounded-lg border flex items-center gap-4 ${
          config.enabled
            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900'
            : 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            config.enabled
              ? 'bg-emerald-100 text-emerald-600'
              : 'bg-amber-100 text-amber-600'
          }`}
        >
          {config.enabled ? <CheckCircle2 className="h-5 w-5" /> : <Send className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          <p className="font-medium">
            ReviewFlow è {config.enabled ? 'attivo' : 'disattivato'}
          </p>
          <p className="text-sm text-muted-foreground">
            {config.enabled
              ? `Le richieste di recensione verranno inviate automaticamente ${getDelayLabel(
                  config.delayHours || 24
                ).toLowerCase()}`
              : 'Attiva ReviewFlow per iniziare a raccogliere recensioni automaticamente'}
          </p>
        </div>
        <Switch
          checked={config.enabled || false}
          onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Generale</TabsTrigger>
          <TabsTrigger value="message">Messaggio</TabsTrigger>
          <TabsTrigger value="qrcode">QR Code</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timing Invio
              </CardTitle>
              <CardDescription>
                Quando vuoi inviare la richiesta di recensione ai tuoi clienti?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Ritardo invio</Label>
                  <Badge variant="secondary">{getDelayLabel(config.delayHours || 24)}</Badge>
                </div>
                <Slider
                  value={[config.delayHours || 24]}
                  onValueChange={(value) => setConfig({ ...config, delayHours: value[0] })}
                  max={168}
                  step={1}
                  min={0}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Stesso giorno</span>
                  <span>1 giorno</span>
                  <span>3 giorni</span>
                  <span>1 settimana</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Invia email automatiche
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Invia automaticamente le richieste via email
                  </p>
                </div>
                <Switch
                  checked={config.sendEmail ?? true}
                  onCheckedChange={(checked) => setConfig({ ...config, sendEmail: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    Mostra QR Code
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Abilita la visualizzazione del QR code nel pannello recensioni
                  </p>
                </div>
                <Switch
                  checked={config.showQRCode ?? true}
                  onCheckedChange={(checked) => setConfig({ ...config, showQRCode: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Link Recensioni
              </CardTitle>
              <CardDescription>
                Configura i link alle piattaforme di recensione dove vuoi ricevere feedback.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="google-link" className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Google My Business
                </Label>
                <Input
                  id="google-link"
                  placeholder="https://g.page/r/.../review"
                  value={config.googleReviewLink || ''}
                  onChange={(e) => setConfig({ ...config, googleReviewLink: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Il link diretto alla pagina di recensione Google.{' '}
                  <a
                    href="https://support.google.com/business/answer/3474122"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Come trovarlo
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tripadvisor-link" className="flex items-center gap-2">
                  <span className="text-green-600 font-bold text-sm">TA</span>
                  TripAdvisor
                </Label>
                <Input
                  id="tripadvisor-link"
                  placeholder="https://www.tripadvisor.com/..."
                  value={config.tripadvisorLink || ''}
                  onChange={(e) => setConfig({ ...config, tripadvisorLink: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thefork-link" className="flex items-center gap-2">
                  <span className="text-orange-500 font-bold text-sm">TF</span>
                  TheFork
                </Label>
                <Input
                  id="thefork-link"
                  placeholder="https://www.thefork.com/..."
                  value={config.theforkLink || ''}
                  onChange={(e) => setConfig({ ...config, theforkLink: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Message Settings */}
        <TabsContent value="message" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messaggio Personalizzato
              </CardTitle>
              <CardDescription>
                Aggiungi un messaggio personalizzato alle email di richiesta recensione.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-message">Messaggio (opzionale)</Label>
                <Textarea
                  id="custom-message"
                  placeholder="Es: Grazie per essere stati con noi! Il tuo feedback è prezioso..."
                  value={config.customMessage || ''}
                  onChange={(e) => setConfig({ ...config, customMessage: e.target.value })}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Questo testo verrà aggiunto all&apos;email di richiesta recensione. Lascia vuoto per
                  usare il messaggio predefinito.
                </p>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Anteprima Email:</p>
                <div className="bg-white dark:bg-gray-900 rounded border p-4 space-y-3">
                  <p className="text-sm">
                    Ciao <strong>[Nome Cliente]</strong>,
                  </p>
                  <p className="text-sm">
                    Grazie per aver scelto <strong>{ristorante?.nome || 'Il nostro ristorante'}</strong>!
                    Speriamo che la tua esperienza sia stata fantastica.
                  </p>
                  {config.customMessage && (
                    <div className="text-sm italic border-l-2 border-primary pl-3 py-1 bg-muted/50">
                      {config.customMessage}
                    </div>
                  )}
                  <p className="text-sm">
                    Ci faresti un enorme favore lasciando una recensione?
                  </p>
                  <div className="flex gap-2 pt-2">
                    {config.googleReviewLink && (
                      <Badge variant="default">⭐ Google Reviews</Badge>
                    )}
                    {config.tripadvisorLink && <Badge variant="secondary">🌐 TripAdvisor</Badge>}
                    {config.theforkLink && <Badge variant="outline">🍴 TheFork</Badge>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QR Code Settings */}
        <TabsContent value="qrcode" className="mt-6">
          <QRCodeDisplay
            googleReviewLink={config.googleReviewLink}
            tripadvisorLink={config.tripadvisorLink}
            theforkLink={config.theforkLink}
            restaurantName={ristorante?.nome}
            size={280}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
