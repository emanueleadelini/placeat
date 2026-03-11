'use client';

import { useState, useMemo } from 'react';
import { useCollection } from '@/firebase';
import { collection, query, doc, updateDoc, deleteDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { AdminUser } from '@/lib/types';
import { 
  Users, 
  Search, 
  Plus,
  MoreHorizontal,
  Trash2,
  Shield,
  UserCog,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    nome: '',
    cognome: '',
    ruolo: 'admin' as const,
  });

  const adminsQuery = useMemo(() => 
    query(collection(db, 'admins')), 
  []);
  const { data: admins, isLoading } = useCollection<AdminUser>(adminsQuery);

  const filteredAdmins = useMemo(() => {
    if (!admins) return [];
    if (!searchTerm) return admins;
    
    const term = searchTerm.toLowerCase();
    return admins.filter(a => 
      a.email.toLowerCase().includes(term) ||
      a.nome.toLowerCase().includes(term) ||
      a.cognome.toLowerCase().includes(term)
    );
  }, [admins, searchTerm]);

  const handleAddAdmin = async () => {
    try {
      await addDoc(collection(db, 'admins'), {
        ...newAdmin,
        attivo: true,
        createdAt: Timestamp.now(),
      });
      setIsAddDialogOpen(false);
      setNewAdmin({ email: '', nome: '', cognome: '', ruolo: 'admin' });
    } catch (error) {
      console.error('Error adding admin:', error);
      alert('Errore durante l\'aggiunta');
    }
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    try {
      await updateDoc(doc(db, 'admins', admin.id), {
        attivo: !admin.attivo
      });
    } catch (error) {
      console.error('Error updating admin:', error);
    }
  };

  const handleDelete = async (admin: AdminUser) => {
    if (!confirm(`Sei sicuro di voler eliminare ${admin.nome} ${admin.cognome}?`)) return;
    
    try {
      await deleteDoc(doc(db, 'admins', admin.id));
    } catch (error) {
      console.error('Error deleting admin:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Badge className="bg-red-500">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-blue-500">Admin</Badge>;
      case 'support':
        return <Badge className="bg-green-500">Support</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestione Admin</h1>
          <p className="text-muted-foreground">
            Gestisci gli utenti amministratori della piattaforma
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuovo Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aggiungi Nuovo Admin</DialogTitle>
              <DialogDescription>
                Crea un nuovo account amministratore
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="admin@esempio.com"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    placeholder="Mario"
                    value={newAdmin.nome}
                    onChange={(e) => setNewAdmin({ ...newAdmin, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cognome</Label>
                  <Input
                    placeholder="Rossi"
                    value={newAdmin.cognome}
                    onChange={(e) => setNewAdmin({ ...newAdmin, cognome: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ruolo</Label>
                <Select
                  value={newAdmin.ruolo}
                  onValueChange={(value) => setNewAdmin({ ...newAdmin, ruolo: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleAddAdmin}>
                Aggiungi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Amministratori</CardTitle>
              <CardDescription>
                {filteredAdmins.length} admin trovati
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca admin..."
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
                  <th className="text-left py-3 px-4 font-medium">Admin</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Ruolo</th>
                  <th className="text-left py-3 px-4 font-medium">Stato</th>
                  <th className="text-left py-3 px-4 font-medium">Ultimo Accesso</th>
                  <th className="text-right py-3 px-4 font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCog className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{admin.nome} {admin.cognome}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {admin.email}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getRoleBadge(admin.ruolo)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={admin.attivo ? 'default' : 'secondary'}>
                        {admin.attivo ? 'Attivo' : 'Disattivato'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {admin.lastLoginAt ? 
                        format(admin.lastLoginAt.toDate(), 'dd/MM/yy HH:mm', { locale: it }) :
                        'Mai'
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
                          <DropdownMenuItem onClick={() => handleToggleStatus(admin)}>
                            {admin.attivo ? 'Disattiva' : 'Attiva'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(admin)}
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
    </div>
  );
}
