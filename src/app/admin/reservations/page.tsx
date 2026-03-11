'use client';

import { useState, useMemo } from 'react';
import { useCollection } from '@/firebase';
import { collection, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Prenotazione, Ristorante } from '@/lib/types';
import { 
  Calendar, 
  Search, 
  Trash2,
  MapPin,
  Users,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AdminReservationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Prenotazione | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch all reservations
  const reservationsQuery = useMemo(() => 
    query(collection(db, 'prenotazioni')), 
  []);
  const { data: reservations, isLoading: loadingReservations } = useCollection<Prenotazione>(reservationsQuery);

  // Fetch all restaurants to show names
  const restaurantsQuery = useMemo(() => 
    query(collection(db, 'ristoranti')), 
  []);
  const { data: restaurants } = useCollection<Ristorante>(restaurantsQuery);

  const restaurantMap = useMemo(() => {
    const map = new Map<string, Ristorante>();
    restaurants?.forEach(r => map.set(r.id, r));
    return map;
  }, [restaurants]);

  const filteredReservations = useMemo(() => {
    if (!reservations) return [];
    if (!searchTerm) return reservations;
    
    const term = searchTerm.toLowerCase();
    return reservations.filter(r => 
      r.cliente.nome.toLowerCase().includes(term) ||
      r.cliente.telefono.toLowerCase().includes(term) ||
      r.ristoranteId.toLowerCase().includes(term)
    );
  }, [reservations, searchTerm]);

  const sortedReservations = useMemo(() => {
    return [...filteredReservations].sort((a, b) => {
      const dateA = a.data instanceof Date ? a.data : a.data?.toDate?.() || new Date(0);
      const dateB = b.data instanceof Date ? b.data : b.data?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredReservations]);

  const handleDelete = async () => {
    if (!selectedReservation) return;
    
    try {
      await deleteDoc(doc(db, 'prenotazioni', selectedReservation.id));
      setIsDeleteDialogOpen(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error('Error deleting reservation:', error);
      alert('Errore durante l\'eliminazione');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confermata':
        return <Badge className="bg-green-500">Confermata</Badge>;
      case 'completata':
        return <Badge className="bg-blue-500">Completata</Badge>;
      case 'cancellata':
        return <Badge variant="destructive">Cancellata</Badge>;
      case 'no-show':
        return <Badge className="bg-yellow-500">No Show</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loadingReservations) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tutte le Prenotazioni</h1>
        <p className="text-muted-foreground">
          Visualizza e gestisci tutte le prenotazioni sulla piattaforma
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totali</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservations?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confermate</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reservations?.filter(r => r.stato === 'confermata').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completate</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reservations?.filter(r => r.stato === 'completata').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancellate</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reservations?.filter(r => r.stato === 'cancellata').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista Prenotazioni</CardTitle>
              <CardDescription>
                {filteredReservations.length} prenotazioni trovate
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome, telefono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-[300px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Ristorante</th>
                  <th className="text-left py-3 px-4 font-medium">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium">Data & Ora</th>
                  <th className="text-left py-3 px-4 font-medium">Persone</th>
                  <th className="text-left py-3 px-4 font-medium">Stato</th>
                  <th className="text-right py-3 px-4 font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {sortedReservations.slice(0, 100).map((reservation) => {
                  const restaurant = restaurantMap.get(reservation.ristoranteId);
                  const date = reservation.data instanceof Date 
                    ? reservation.data 
                    : reservation.data?.toDate?.() || new Date();
                  
                  return (
                    <tr key={reservation.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">
                            {restaurant?.nome || 'Sconosciuto'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{reservation.cliente.nome}</p>
                          <p className="text-sm text-muted-foreground">{reservation.cliente.telefono}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <div>
                            <p className="text-sm">{format(date, 'dd/MM/yyyy', { locale: it })}</p>
                            <p className="text-sm text-muted-foreground">{reservation.ora}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {reservation.numeroPersone}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(reservation.stato)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            setSelectedReservation(reservation);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione eliminerà permanentemente la prenotazione di &quot;{selectedReservation?.cliente.nome}&quot;.
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
