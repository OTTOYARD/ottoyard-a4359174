import React, { useEffect, useState } from 'react';
import {
  Calendar,
  DollarSign,
  Package,
  Car,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AccountStats {
  memberSince: string | null;
  lifetimeSpend: number;
  totalOrders: number;
  completedOrders: number;
  vehicleCount: number;
}

export const AccountOverview: React.FC = () => {
  const [stats, setStats] = useState<AccountStats>({
    memberSince: null,
    lifetimeSpend: 0,
    totalOrders: 0,
    completedOrders: 0,
    vehicleCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccountStats();
  }, []);

  const fetchAccountStats = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all stats in parallel
      const [ordersResult, vehiclesResult] = await Promise.all([
        supabase
          .from('service_orders')
          .select('total_amount, status, created_at')
          .eq('user_id', user.id),
        supabase
          .from('user_fleet_vehicles')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active'),
      ]);

      const orders = ordersResult.data || [];
      const vehicles = vehiclesResult.data || [];

      const completedOrders = orders.filter((o) => o.status === 'completed');
      const lifetimeSpend = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);
      
      // Get earliest order date or user created_at
      const earliestOrder = orders.length > 0
        ? orders.reduce((earliest, o) => 
            new Date(o.created_at) < new Date(earliest.created_at) ? o : earliest
          )
        : null;

      setStats({
        memberSince: user.created_at || earliestOrder?.created_at || null,
        lifetimeSpend,
        totalOrders: orders.length,
        completedOrders: completedOrders.length,
        vehicleCount: vehicles.length,
      });
    } catch (error) {
      console.error('Error fetching account stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMemberSince = (dateStr: string | null): string => {
    if (!dateStr) return 'New Member';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 bg-muted/50 rounded-lg border border-border animate-pulse">
            <div className="h-8 w-8 bg-muted rounded mb-2" />
            <div className="h-6 w-16 bg-muted rounded mb-1" />
            <div className="h-4 w-20 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      icon: Calendar,
      value: formatMemberSince(stats.memberSince),
      label: 'Member Since',
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: DollarSign,
      value: `$${(stats.lifetimeSpend / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      label: 'Lifetime Spend',
      iconColor: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      icon: Package,
      value: stats.completedOrders.toString(),
      label: 'Completed Orders',
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Car,
      value: stats.vehicleCount.toString(),
      label: 'Fleet Vehicles',
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statCards.map((card, index) => (
        <div
          key={index}
          className="p-4 bg-muted/50 rounded-lg border border-border hover:bg-muted/70 transition-colors"
        >
          <div className={`h-8 w-8 rounded-lg ${card.bgColor} flex items-center justify-center mb-2`}>
            <card.icon className={`h-4 w-4 ${card.iconColor}`} />
          </div>
          <p className="text-xl font-bold">{card.value}</p>
          <p className="text-xs text-muted-foreground">{card.label}</p>
        </div>
      ))}
    </div>
  );
};
