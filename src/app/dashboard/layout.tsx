'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar-1');

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
                    isActive={pathname === item.href}
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
                        {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="User Avatar" />}
                        <AvatarFallback>MR</AvatarFallback>
                    </Avatar>
                    <div className="text-left group-data-[collapsible=icon]:hidden">
                        <p className="font-medium text-sm">Mario Rossi</p>
                        <p className="text-xs text-muted-foreground">Da Pino</p>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start">
              <DropdownMenuLabel>Il mio account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><User className="mr-2 h-4 w-4" />Profilo</DropdownMenuItem>
              <DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Impostazioni</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem><LogOut className="mr-2 h-4 w-4" />Esci</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
