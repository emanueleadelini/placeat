import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RistoranteClient from './ristorante-client';
import { getRestaurantById } from './actions';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://placeat.app';

interface Props {
  params: Promise<{
    ristoranteId: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ristoranteId } = await params;
  
  try {
    const ristorante = await getRestaurantById(ristoranteId);
    
    if (!ristorante) {
      return {
        title: 'Ristorante non trovato | Placeat',
        description: 'Il ristorante che stai cercando non è disponibile.',
      };
    }

    const restaurantName = ristorante.nome || 'Ristorante';
    const restaurantType = ristorante.tipo ? ristorante.tipo.charAt(0).toUpperCase() + ristorante.tipo.slice(1) : 'Ristorante';
    const restaurantAddress = ristorante.indirizzo || '';
    
    return {
      title: `${restaurantName} - Prenota il tuo tavolo`,
      description: `Prenota il tuo tavolo da ${restaurantName}. ${restaurantType} su Placeat. Visualizza la disponibilità e prenota online in pochi click.`,
      keywords: [
        ristorante.nome,
        ristorante.tipo,
        'prenotazione ristorante',
        'prenota tavolo',
        'ristorante online',
        ...(ristorante.indirizzo ? [ristorante.indirizzo] : []),
      ].filter(Boolean),
      openGraph: {
        title: `${restaurantName} - Prenota il tuo tavolo | Placeat`,
        description: `Prenota il tuo tavolo da ${restaurantName}. ${restaurantType}${restaurantAddress ? ` a ${restaurantAddress}` : ''}.`,
        url: `${SITE_URL}/ristorante/${ristoranteId}`,
        images: [
          {
            url: `${SITE_URL}/og-restaurant.jpg`,
            width: 1200,
            height: 630,
            alt: `${restaurantName} - Prenotazioni su Placeat`,
          },
        ],
      },
      twitter: {
        title: `${restaurantName} - Prenota il tuo tavolo | Placeat`,
        description: `Prenota il tuo tavolo da ${restaurantName}.`,
        images: [`${SITE_URL}/og-restaurant.jpg`],
      },
      alternates: {
        canonical: `${SITE_URL}/ristorante/${ristoranteId}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Ristorante | Placeat',
      description: 'Visualizza i dettagli del ristorante e prenota il tuo tavolo.',
    };
  }
}

export default async function RistorantePage({ params }: Props) {
  const { ristoranteId } = await params;
  
  return <RistoranteClient ristoranteId={ristoranteId} />;
}
