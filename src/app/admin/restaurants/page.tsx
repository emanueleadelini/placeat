'use client';

import { useState, useMemo } from 'react';
import { useCollection } from '@/firebase';
import { collection, query, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Ristorante } from '@/lib/types';
import { 
  Store, 
  Search, 
  MoreHorizontal, 
  Trash2, 
  Ban,
  CheckCircle,
  Mail,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function AdminRestaurantsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Ristorante | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const restaurantsQuery = useMemo(() => 
    query(collection(db, 'ristoranti')), 
  []);
  const { data: restaurants, isLoading } = useCollection<Ristorante>(restaurantsQuery);

  const filteredRestaurants = useMemo(() => {
    if (!restaurants) return [];
    if (!searchTerm) return restaurants;
    
    const term = searchTerm.toLowerCase();
    return restaurants.filter(r => 
      r.nome.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      r.indirizzo.toLowerCase().includes(term)
    );
  }, [restaurants, searchTerm]);

  const handleDelete = async () => {
    if (!selectedRestaurant) return;
    
    try {
      await deleteDoc(doc(db, 'ristoranti', selectedRestaurant.id));
      setIsDeleteDialogOpen(false);
      setSelectedRestaurant(null);
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      alert('Errore durante l\'eliminazione');
    }
  };

  const handleStatusChange = async (restaurant: Ristorante, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'ristoranti', restaurant.id), {
        stato: newStatus
      });
    } catch (error) {
      console.error('Error updating restaurant:', error);
      alert('Errore durante l\'aggiornamento');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Attivo</Badge>;
      case 'trial':
        return <Badge className="bg-blue-500">Trial</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-500">Pagamento Scaduto</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancellato</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'free':
        return <Badge variant="outline">Free</Badge>;
      case 'pro':
        return <Badge className="bg-purple-500">Pro</Badge>;
      case 'multi':
        return <Badge className="bg-orange-500">Multi</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestione Ristoranti</h1>
        <p className="text-muted-foreground">
          Gestisci tutti i ristoranti sulla piattaforma
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tutti i Ristoranti</CardTitle>
              <CardDescription>
                {filteredRestaurants.length} ristoranti trovati
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca ristorante..."
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
                  <th className="text-left py-3 px-4 font-medium">Contatto</th>
                  <th className="text-left py-3 px-4 font-medium">Stato</th>
                  <th className="text-left py-3 px-4 font-medium">Piano</th>
                  <th className="text-left py-3 px-4 font-medium">Registrato</th>
                  <th className="text-right py-3 px-4 font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredRestaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{restaurant.nome}</p>
                        <p className="text-sm text-muted-foreground">{restaurant.indirizzo}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {restaurant.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {restaurant.telefono}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(restaurant.stato)}
                    </td>
                    <td className="py-3 px-4">
                      {getPlanBadge(restaurant.piano)}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {restaurant.createdAt ? 
                        format(restaurant.createdAt.toDate(), 'dd/MM/yy', { locale: it }) :
                        'N/A'
                      }
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(restaurant, 'active')}
                            disabled={restaurant.stato === 'active'}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Attiva
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(restaurant, 'cancelled')}
                            disabled={restaurant.stato === 'cancelled'}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Sospendi
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedRestaurant(restaurant);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
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
              Questa azione eliminerà permanentemente il ristorante &quot;{selectedRestaurant?.nome}&quot; 
              e tutti i dati associati. Questa azione non può essere annullata.
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
