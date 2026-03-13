'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarFooter,
  SidebarTrigger,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import {
  Calendar,
  ChevronUp,
  DraftingCompass,
  Eye,
  LogOut,
  Map,
  BarChart3,
  Settings,
  Star,
  User,
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

const navGroups = [
  {
    label: 'Gestione',
    items: [
      { href: '/dashboard/reservations', icon: Calendar, label: 'Prenotazioni' },
      { href: '/dashboard/floor-plan', icon: Map, label: 'Piantina' },
    ],
  },
  {
    label: 'Statistiche',
    items: [
      { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
      { href: '/dashboard/reviews', icon: Star, label: 'Recensioni' },
    ],
  },
  {
    label: '',
    items: [
      { href: '/dashboard/settings', icon: Settings, label: 'Impostazioni' },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar-1');
  const firestore = useFirestore();
  const [ristoranteId, setRistoranteId] = React.useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
    if (user && firestore) {
      const q = query(collection(firestore, 'ristoranti'), where('proprietarioUid', '==', user.uid));
      getDocs(q).then((snapshot) => {
        if (!snapshot.empty) {
          setRistoranteId(snapshot.docs[0].id);
        }
      });
    }
  }, [user, isUserLoading, router, firestore]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <DraftingCompass className="h-10 w-10 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground font-medium">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <DraftingCompass className="w-6 h-6 text-primary shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">PLACEAT</span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          {navGroups.map((group, i) => (
            <React.Fragment key={group.label || i}>
              {i > 0 && <SidebarSeparator />}
              <SidebarGroup>
                {group.label && (
                  <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                    {group.label}
                  </SidebarGroupLabel>
                )}
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <Link href={item.href} passHref>
                        <SidebarMenuButton
                          isActive={pathname.startsWith(item.href)}
                          tooltip={item.label}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            </React.Fragment>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="justify-start gap-2 w-full px-2 h-12">
                <Avatar className="h-8 w-8 shrink-0">
                  {user?.photoURL
                    ? <AvatarImage src={user.photoURL} alt="Avatar" />
                    : userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="Avatar" />
                  }
                  <AvatarFallback>
                    {user?.displayName?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="font-medium text-sm truncate">{user?.displayName ?? 'Utente'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 group-data-[collapsible=icon]:hidden" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel>Il mio account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profilo
              </DropdownMenuItem>
              {ristoranteId && (
                <DropdownMenuItem asChild>
                  <Link href={`/ristorante/${ristoranteId}`} target="_blank">
                    <Eye className="mr-2 h-4 w-4" />
                    Vedi pagina pubblica
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Impostazioni
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Esci
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="flex flex-col flex-1 min-h-0">
          {/* Mobile sticky header */}
          <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur sticky top-0 z-10 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
              <DraftingCompass className="w-6 h-6 text-primary" />
              <span>PLACEAT</span>
            </Link>
            <SidebarTrigger />
          </header>
          <div className="flex flex-col flex-1 min-h-0 p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
