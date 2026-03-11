'use client';

import { useMemo } from 'react';
import { useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Ristorante, Prenotazione, PlatformStats } from '@/lib/types';
import { 
  Store, 
  Users, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Activity,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function AdminDashboardPage() {
  // Fetch all restaurants
  const restaurantsQuery = useMemo(() => 
    query(collection(db, 'ristoranti')), 
  []);
  const { data: restaurants, isLoading: loadingRestaurants } = useCollection<Ristorante>(restaurantsQuery);

  // Fetch all reservations (this might need pagination in production)
  const reservationsQuery = useMemo(() => 
    query(collection(db, 'prenotazioni')), 
  []);
  const { data: reservations, isLoading: loadingReservations } = useCollection<Prenotazione>(reservationsQuery);

  // Fetch platform stats
  const statsQuery = useMemo(() => 
    query(collection(db, 'platform')), 
  []);
  const { data: platformStats } = useCollection<PlatformStats>(statsQuery);

  const stats = useMemo(() => {
    if (!restaurants) return null;

    const totalRestaurants = restaurants.length;
    const activeRestaurants = restaurants.filter(r => r.stato === 'active').length;
    const trialRestaurants = restaurants.filter(r => r.stato === 'trial').length;
    const payingRestaurants = restaurants.filter(r => r.piano === 'pro' || r.piano === 'multi').length;
    
    const totalReservations = reservations?.length || 0;
    
    // Calcolo MRR approssimativo (29€ per piano pro, 79€ per multi)
    const mrr = restaurants.reduce((acc, r) => {
      if (r.stato !== 'active') return acc;
      if (r.piano === 'pro') return acc + 29;
      if (r.piano === 'multi') return acc + 79;
      return acc;
    }, 0);

    return {
      totalRestaurants,
      activeRestaurants,
      trialRestaurants,
      payingRestaurants,
      totalReservations,
      mrr,
    };
  }, [restaurants, reservations]);

  const recentRestaurants = useMemo(() => {
    if (!restaurants) return [];
    return [...restaurants]
      .sort((a, b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.())
      .slice(0, 5);
  }, [restaurants]);

  if (loadingRestaurants || loadingReservations) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Panoramica della piattaforma
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ristoranti Totali</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRestaurants || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeRestaurants || 0} attivi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prenotazioni</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReservations || 0}</div>
            <p className="text-xs text-muted-foreground">
              Totali nel sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats?.mrr || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.payingRestaurants || 0} clienti paganti
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Trial</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.trialRestaurants || 0}</div>
            <p className="text-xs text-muted-foreground">
              Da convertire
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Crescita Ristoranti</CardTitle>
            <CardDescription>
              Nuovi ristoranti registrati negli ultimi mesi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-end justify-between gap-2">
              {/* Placeholder per grafico - in produzione usare recharts */}
              {[40, 65, 45, 80, 95, 70, 85, 90, 100, 120, 110, 130].map((value, i) => (
                <div
                  key={i}
                  className="bg-primary/20 rounded-t w-full"
                  style={{ height: `${value}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Gen</span>
              <span>Dic</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuzione Piani</CardTitle>
            <CardDescription>
              Piano attuale dei ristoranti
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Free</span>
              <span className="font-medium">
                {restaurants?.filter(r => r.piano === 'free').length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Pro</span>
              <span className="font-medium">
                {restaurants?.filter(r => r.piano === 'pro').length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Multi</span>
              <span className="font-medium">
                {restaurants?.filter(r => r.piano === 'multi').length || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Restaurants */}
      <Card>
        <CardHeader>
          <CardTitle>Ristoranti Recenti</CardTitle>
          <CardDescription>
            Ultimi ristoranti registrati sulla piattaforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{restaurant.nome}</p>
                  <p className="text-sm text-muted-foreground">{restaurant.email}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    restaurant.stato === 'active' ? 'bg-green-100 text-green-800' :
                    restaurant.stato === 'trial' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {restaurant.stato}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {restaurant.createdAt ? 
                      format(restaurant.createdAt.toDate(), 'dd/MM/yyyy', { locale: it }) :
                      'N/A'
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
