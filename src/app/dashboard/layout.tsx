'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

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
} from '@/components/ui/sidebar';
import {
  Calendar,
  DraftingCompass,
  LayoutGrid,
  LogOut,
  Settings,
  Star,
  User,
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';

const navItems = [
  {
    href: '/dashboard/reservations',
    icon: Calendar,
    label: 'Prenotazioni',
  },
  {
    href: '/dashboard/floor-plan',
    icon: LayoutGrid,
    label: 'Piantina',
  },
  {
    href: '/dashboard/reviews',
    icon: Star,
    label: 'Recensioni',
  },
  {
    href: '/dashboard/settings',
    icon: Settings,
    label: 'Impostazioni',
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

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
      return (
        <div className="flex h-screen items-center justify-center">
            <p>Loading...</p>
        </div>
      );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
              <DraftingCompass className="w-6 h-6 text-primary" />
              <span className="group-data-[collapsible=icon]:hidden">PLACEAT</span>
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
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
        </SidebarContent>
        <SidebarFooter>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="justify-start gap-2 w-full px-2 h-12">
                     <Avatar className="h-8 w-8">
                        {user?.photoURL ? <AvatarImage src={user.photoURL} alt="User Avatar" /> : userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="User Avatar" />}
                        <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="text-left group-data-[collapsible=icon]:hidden">
                        <p className="font-medium text-sm truncate">{user?.displayName ?? 'Utente'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start">
              <DropdownMenuLabel>Il mio account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><User className="mr-2 h-4 w-4" />Profilo</DropdownMenuItem>
              <DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Impostazioni</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut} tooltip="Esci">
                    <LogOut />
                    <span>Esci</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 md:p-6 lg:p-8 flex-1">
          <div className="md:hidden flex items-center justify-between mb-4">
             <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
              <DraftingCompass className="w-6 h-6 text-primary" />
              <span>PLACEAT</span>
            </Link>
            <SidebarTrigger/>
          </div>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
    