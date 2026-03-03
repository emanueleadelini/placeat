'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import type { Ristorante, Tavolo, Zona, Muro } from '@/lib/types';
import PublicBookingPage from '@/components/public-booking-page';
import { Loader2 } from 'lucide-react';

export default function RistorantePage() {
  const { ristoranteId } = useParams<{ ristoranteId: string }>();
  const firestore = useFirestore();
  
  const [ristorante, setRistorante] = useState<Ristorante | null>(null);
  const [tavoli, setTavoli] = useState<Tavolo[]>([]);
  const [zone, setZone] = useState<Zona[]>([]);
  const [muri, setMuri] = useState<Muro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ristoranteId || !firestore) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Ristorante
        const ristoranteRef = doc(firestore, 'ristoranti', ristoranteId);
        const ristoranteSnap = await getDoc(ristoranteRef);

        if (!ristoranteSnap.exists()) {
          setError('Ristorante non trovato.');
          setLoading(false);
          return;
        }
        setRistorante({ id: ristoranteSnap.id, ...ristoranteSnap.data() } as Ristorante);

        // Fetch Tavoli
        const tavoliCol = collection(firestore, 'ristoranti', ristoranteId, 'tavoli');
        const tavoliSnap = await getDocs(tavoliCol);
        setTavoli(tavoliSnap.docs.map(d => ({ id: d.id, ...d.data() } as Tavolo)));

        // Fetch Zone
        const zoneCol = collection(firestore, 'ristoranti', ristoranteId, 'zone');
        const zoneSnap = await getDocs(zoneCol);
        const zoneData = zoneSnap.docs.map(d => {
            const data = d.data();
            const path = (data.pathX || []).map((x: number, i: number) => ({ x, y: data.pathY[i] }));
            return { id: d.id, path, nome: data.nome, colore: data.colore } as Zona;
        });
        setZone(zoneData);
        
        // Fetch Muri
        const muriCol = collection(firestore, 'ristoranti', ristoranteId, 'muri');
        const muriSnap = await getDocs(muriCol);
        const muriData = muriSnap.docs.map(d => {
            const data = d.data();
            const points = (data.pointsX || []).map((x: number, i: number) => ({ x, y: data.pointsY[i] }));
            return { id: d.id, points, spessore: data.spessore } as Muro;
        });
        setMuri(muriData);

      } catch (err) {
        console.error("Error fetching public restaurant data:", err);
        setError("Impossibile caricare i dati del ristorante.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ristoranteId, firestore]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!ristorante) {
    return null;
  }

  return (
    <PublicBookingPage 
      ristorante={ristorante}
      tavoli={tavoli}
      zone={zone}
      muri={muri}
    />
  );
}
