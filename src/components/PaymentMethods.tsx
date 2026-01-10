import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Plus,
  Trash2,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface PaymentMethodsProps {
  onMethodSelected?: (methodId: string | null) => void;
  showAddButton?: boolean;
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  onMethodSelected,
  showAddButton = true,
}) => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
    
    // Check if returning from Stripe setup (handles both redirect modes)
    const urlParams = new URLSearchParams(window.location.search);
    const setupSuccess = urlParams.get('setup') === 'success';
    const setupIntent = urlParams.get('setup_intent');
    const redirectSuccess = urlParams.get('redirect_status') === 'succeeded';
    
    if (setupSuccess || setupIntent || redirectSuccess) {
      // Delay to allow webhook to process
      const timer = setTimeout(() => {
        fetchPaymentMethods();
        if (setupSuccess || redirectSuccess) {
          toast.success('Payment method added successfully!');
        }
        // Clean up URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('setup');
        newUrl.searchParams.delete('setup_intent');
        newUrl.searchParams.delete('setup_intent_client_secret');
        newUrl.searchParams.delete('redirect_status');
        window.history.replaceState({}, '', newUrl.toString());
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.log('No active session for fetching payment methods');
        setMethods([]);
        return;
      }

      const { data, error } = await supabase.functions.invoke('stripe-payment-methods', {
        method: 'GET',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      if (data?.payment_methods) {
        setMethods(data.payment_methods);
        // Select default method
        const defaultMethod = data.payment_methods.find((m: PaymentMethod) => m.is_default);
        if (defaultMethod) {
          setSelectedMethodId(defaultMethod.id);
          onMethodSelected?.(defaultMethod.id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching payment methods:', err);
      // Don't show error toast for new users without payment methods
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    setActionLoading('add');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to add a payment method');
        return;
      }

      const { data, error } = await supabase.functions.invoke('stripe-setup-intent', {
        body: {},
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.url) {
        // Redirect to Stripe's hosted setup page
        window.location.href = data.url;
      } else {
        throw new Error('No redirect URL received');
      }
    } catch (err: any) {
      console.error('Error creating setup session:', err);
      toast.error(err.message || 'Failed to add payment method');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    setActionLoading(methodId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in');
        return;
      }

      const { error } = await supabase.functions.invoke('stripe-payment-methods', {
        body: { 
          action: 'set_default',
          payment_method_id: methodId,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      toast.success('Default payment method updated');
      fetchPaymentMethods();
    } catch (err) {
      console.error('Error setting default:', err);
      toast.error('Failed to update default payment method');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (methodId: string) => {
    setActionLoading(methodId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in');
        return;
      }

      const { error } = await supabase.functions.invoke('stripe-payment-methods', {
        body: { 
          action: 'delete',
          payment_method_id: methodId,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      toast.success('Payment method removed');
      fetchPaymentMethods();
    } catch (err) {
      console.error('Error deleting payment method:', err);
      toast.error('Failed to remove payment method');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectMethod = (methodId: string) => {
    setSelectedMethodId(methodId);
    onMethodSelected?.(methodId);
  };

  const getCardIcon = (brand: string) => {
    // Return appropriate icon based on brand
    return <CreditCard className="h-5 w-5" />;
  };

  const formatBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {methods.length === 0 ? (
        <div className="text-center py-8 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No payment methods</p>
            <p className="text-sm text-muted-foreground">
              Add a payment method for faster checkout
            </p>
          </div>
          {showAddButton && (
            <Button onClick={handleAddPaymentMethod} disabled={actionLoading === 'add'}>
              {actionLoading === 'add' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Payment Method
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {methods.map((method) => (
              <div
                key={method.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                  selectedMethodId === method.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleSelectMethod(method.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-lg">
                    {getCardIcon(method.brand)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatBrand(method.brand)} •••• {method.last4}
                      </span>
                      {method.is_default && (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                          <Star className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year.toString().slice(-2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedMethodId === method.id && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                  {!method.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetDefault(method.id);
                      }}
                      disabled={actionLoading === method.id}
                      className="text-xs"
                    >
                      {actionLoading === method.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Set Primary'
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(method.id);
                    }}
                    disabled={actionLoading === method.id}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {showAddButton && (
            <Button
              variant="outline"
              onClick={handleAddPaymentMethod}
              disabled={actionLoading === 'add'}
              className="w-full"
            >
              {actionLoading === 'add' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add New Payment Method
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentMethods;
