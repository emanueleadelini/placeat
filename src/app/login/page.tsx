'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { DraftingCompass } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The useEffect above will handle the redirect to /dashboard
    } catch (error: any) {
      console.error('Login failed:', error);
      let description = 'Non è stato possibile completare l\'accesso. Riprova.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          description = 'Email o password non validi. Controlla e riprova.';
      } else {
          description = error.message;
      }
      toast({
        title: 'Errore di accesso',
        description: description,
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <DraftingCompass className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Bentornato in PLACEAT</CardTitle>
          <CardDescription>Accedi per gestire il tuo ristorante.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                id="email"
                type="email"
                placeholder="mario@rossi.it"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            <Button onClick={handleSignIn} className="w-full">
                Accedi
            </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Non hai un account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Registrati
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
