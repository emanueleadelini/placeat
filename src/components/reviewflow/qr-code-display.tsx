'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, RefreshCw, QrCode as QrCodeIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRCodeDisplayProps {
  googleReviewLink?: string;
  tripadvisorLink?: string;
  theforkLink?: string;
  restaurantName?: string;
  size?: number;
}

export function QRCodeDisplay({
  googleReviewLink,
  tripadvisorLink,
  theforkLink,
  restaurantName = 'Il nostro ristorante',
  size = 250,
}: QRCodeDisplayProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<'google' | 'tripadvisor' | 'thefork'>('google');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const platformLinks = {
    google: googleReviewLink,
    tripadvisor: tripadvisorLink,
    thefork: theforkLink,
  };

  const platformNames = {
    google: 'Google Reviews',
    tripadvisor: 'TripAdvisor',
    thefork: 'TheFork',
  };

  const generateQRCode = async () => {
    const url = customUrl || platformLinks[selectedPlatform];
    
    if (!url) {
      toast({
        title: 'Link mancante',
        description: `Inserisci un link per ${platformNames[selectedPlatform]}`,
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const QRCode = await import('qrcode');
      const canvas = document.createElement('canvas');
      
      await QRCode.toCanvas(canvas, url, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });

      // Add branding to the QR code
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Add a white circle in the center for logo
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const logoRadius = 35;

        ctx.beginPath();
        ctx.arc(centerX, centerY, logoRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Add restaurant initial
        ctx.fillStyle = '#007BFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const initial = restaurantName.charAt(0).toUpperCase();
        ctx.fillText(initial, centerX, centerY);
      }

      setQrCodeDataUrl(canvas.toDataURL('image/png'));
    } catch (error) {
      console.error('QR Code generation error:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile generare il QR code',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (googleReviewLink || tripadvisorLink || theforkLink) {
      generateQRCode();
    }
  }, [googleReviewLink, tripadvisorLink, theforkLink, selectedPlatform]);

  const handleDownload = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `qrcode-recensioni-${selectedPlatform}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'QR Code scaricato',
      description: 'Il QR code è stato scaricato con successo',
    });
  };

  const hasAnyLink = googleReviewLink || tripadvisorLink || theforkLink;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCodeIcon className="h-5 w-5" />
          QR Code Recensioni
        </CardTitle>
        <CardDescription>
          Genera QR code da stampare e esporre nel tuo locale per raccogliere recensioni.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Platform Selection */}
        <div className="space-y-2">
          <Label>Seleziona piattaforma</Label>
          <div className="flex flex-wrap gap-2">
            {(['google', 'tripadvisor', 'thefork'] as const).map((platform) => (
              <Button
                key={platform}
                type="button"
                variant={selectedPlatform === platform ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedPlatform(platform);
                  setCustomUrl('');
                }}
                disabled={!platformLinks[platform] && !customUrl}
              >
                {platformNames[platform]}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom URL Input */}
        <div className="space-y-2">
          <Label htmlFor="custom-url">URL personalizzato (opzionale)</Label>
          <Input
            id="custom-url"
            placeholder="https://..."
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Inserisci un URL personalizzato per sovrascrivere il link della piattaforma selezionata.
          </p>
        </div>

        {/* QR Code Preview */}
        <div className="flex flex-col items-center justify-center space-y-4">
          {qrCodeDataUrl ? (
            <div className="relative group">
              <img
                src={qrCodeDataUrl}
                alt="QR Code Recensioni"
                className="rounded-lg border-2 border-border p-2 transition-all group-hover:border-primary"
                style={{ width: size, height: size }}
              />
              <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Scarica
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center text-muted-foreground"
              style={{ width: size, height: size }}
            >
              {isGenerating ? (
                <RefreshCw className="h-8 w-8 animate-spin" />
              ) : (
                <>
                  <QrCodeIcon className="h-12 w-12 mb-2" />
                  <span className="text-sm">Nessun link configurato</span>
                </>
              )}
            </div>
          )}

          {/* Platform Badge */}
          {qrCodeDataUrl && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Piattaforma:</span>
              <span className="text-sm font-medium">
                {customUrl ? 'URL Personalizzato' : platformNames[selectedPlatform]}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={generateQRCode}
            disabled={isGenerating || (!hasAnyLink && !customUrl)}
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Rigenera
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleDownload}
            disabled={!qrCodeDataUrl}
          >
            <Download className="h-4 w-4" />
            Scarica PNG
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-muted rounded-lg p-4 text-sm space-y-2">
          <p className="font-medium">💡 Suggerimenti per l&apos;uso:</p>
          <ul className="text-muted-foreground space-y-1 list-disc list-inside">
            <li>Stampa il QR code su carta lucida per migliore scansione</li>
            <li>Esposilo in zone visibili: tavoli, bancone, cassa</li>
            <li>Includilo nel conto o nel menu</li>
            <li>Usa il QR code Google per maggiore impatto SEO</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Simple QR code display for inline use
export function SimpleQRCode({ url, size = 120 }: { url: string; size?: number }) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generate = async () => {
      try {
        const QRCode = await import('qrcode');
        const dataUrl = await QRCode.toDataURL(url, {
          width: size,
          margin: 1,
          errorCorrectionLevel: 'M',
        });
        setQrCodeDataUrl(dataUrl);
      } catch (error) {
        console.error('QR generation error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (url) {
      generate();
    }
  }, [url, size]);

  if (isLoading) {
    return (
      <div
        className="bg-muted rounded animate-pulse"
        style={{ width: size, height: size }}
      />
    );
  }

  if (!qrCodeDataUrl) {
    return (
      <div
        className="bg-muted rounded flex items-center justify-center text-muted-foreground"
        style={{ width: size, height: size }}
      >
        <QrCodeIcon className="h-8 w-8" />
      </div>
    );
  }

  return (
    <img
      src={qrCodeDataUrl}
      alt="QR Code"
      className="rounded border"
      style={{ width: size, height: size }}
    />
  );
}
