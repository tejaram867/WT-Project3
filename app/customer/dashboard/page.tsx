'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Customer } from '@/lib/supabase';
import CustomerDashboardComponent from '@/components/CustomerDashboard';

export default function CustomerDashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && mounted) {
      if (!user) {
        router.push('/customer-login');
      } else if (user.role !== 'customer') {
        router.push('/vendor/dashboard');
      }
    }
  }, [user, loading, router, mounted]);

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'customer' || !profile) {
    return null;
  }

  return <CustomerDashboardComponent customer={profile as Customer} />;
}
