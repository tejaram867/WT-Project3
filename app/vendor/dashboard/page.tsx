'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Vendor } from '@/lib/supabase';
import VendorDashboardComponent from '@/components/VendorDashboard';

export default function VendorDashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && mounted) {
      if (!user) {
        router.push('/vendor-login');
      } else if (user.role !== 'vendor') {
        router.push('/customer/dashboard');
      }
    }
  }, [user, loading, router, mounted]);

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'vendor' || !profile) {
    return null;
  }

  return <VendorDashboardComponent vendor={profile as Vendor} />;
}
