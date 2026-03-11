'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useUser } from '@/firebase';
import { db } from '@/firebase/config';
import type { AdminUser } from '@/lib/types';

interface UseAdminReturn {
  isAdmin: boolean;
  isLoading: boolean;
  adminData: AdminUser | null;
  error: Error | null;
}

export function useAdmin(): UseAdminReturn {
  const { user, isUserLoading: userLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminUser | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function checkAdminStatus() {
      if (userLoading) return;
      
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const adminDocRef = doc(db, 'admins', user.uid);
        const adminDoc = await getDoc(adminDocRef);
        
        if (adminDoc.exists()) {
          const data = adminDoc.data() as AdminUser;
          setIsAdmin(data.attivo === true);
          setAdminData(data);
        } else {
          setIsAdmin(false);
          setAdminData(null);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError(err as Error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminStatus();
  }, [user, userLoading]);

  return { isAdmin, isLoading, adminData, error };
}

export function useIsSuperAdmin(): boolean {
  const { isAdmin, adminData, isLoading } = useAdmin();
  
  if (isLoading || !isAdmin) return false;
  
  return adminData?.ruolo === 'superadmin';
}
