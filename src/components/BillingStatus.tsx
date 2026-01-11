import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BillingStatusProps {
  className?: string;
}

export const BillingStatus: React.FC<BillingStatusProps> = ({ className }) => {
  const [loading, setLoading] = useState(true);
  const [hasBillingAccount, setHasBillingAccount] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    checkBillingStatus();
  }, []);

  const checkBillingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasBillingAccount(false);
        return;
      }

      const { data } = await supabase
        .from('billing_customers')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      setHasBillingAccount(!!data?.stripe_customer_id);
    } catch (err) {
      console.error('Error checking billing status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-create-portal', {});
      
      if (error) {
        const errorMessage = error.message || '';
        if (errorMessage.includes('No billing account') || errorMessage.includes('make a purchase')) {
          toast.info('Complete a purchase to access billing management', {
            description: 'Add items to your cart and checkout to create a billing account.',
          });
          return;
        }
        throw error;
      }
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      if (error?.context?.body) {
        try {
          const body = JSON.parse(error.context.body);
          if (body.error?.includes('No billing account') || body.error?.includes('make a purchase')) {
            toast.info('Complete a purchase to access billing management', {
              description: 'Add items to your cart and checkout to create a billing account.',
            });
            return;
          }
        } catch {}
      }
      toast.error('Failed to open billing portal');
    } finally {
      setOpeningPortal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={className}>
      {hasBillingAccount ? (
        <div className="space-y-4">
          {/* Connected Status */}
          <div className="flex items-center gap-3 p-4 bg-success/10 rounded-lg border border-success/20">
            <div className="p-2 bg-success/20 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-success">Billing Account Active</p>
              <p className="text-sm text-muted-foreground">
                Your payments are securely managed by Stripe
              </p>
            </div>
            <Badge variant="outline" className="bg-background">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Secure
            </Badge>
          </div>

          {/* Manage Button */}
          <Button 
            onClick={handleOpenPortal} 
            disabled={openingPortal}
            variant="outline"
            className="w-full"
          >
            {openingPortal ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Manage Payment Methods & Invoices
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Opens Stripe's secure billing portal in a new tab
          </p>
        </div>
      ) : (
        <div className="text-center py-8 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No billing account yet</p>
            <p className="text-sm text-muted-foreground">
              Complete a purchase to set up your billing account
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            <span>Powered by Stripe</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingStatus;
