import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  CreditCard,
  Loader2,
  MapPin,
  Calendar,
  Clock,
  Truck,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Star,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { CartItem } from './CartButton';
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

interface OrderReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onConfirmCheckout: () => void;
  isLoading: boolean;
}

const TAX_RATE = 0.0825; // 8.25%

export const OrderReviewDialog: React.FC<OrderReviewDialogProps> = ({
  open,
  onOpenChange,
  items,
  onConfirmCheckout,
  isLoading,
}) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'saved' | 'new'>('new');
  const [processingPayment, setProcessingPayment] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;

  useEffect(() => {
    if (open) {
      fetchPaymentMethods();
    }
  }, [open]);

  const fetchPaymentMethods = async () => {
    setLoadingMethods(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setPaymentMethods([]);
        setPaymentMode('new');
        return;
      }

      const { data, error } = await supabase.functions.invoke('stripe-payment-methods', {
        method: 'GET',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      if (data?.payment_methods && data.payment_methods.length > 0) {
        setPaymentMethods(data.payment_methods);
        const defaultMethod = data.payment_methods.find((m: PaymentMethod) => m.is_default);
        if (defaultMethod) {
          setSelectedMethodId(defaultMethod.id);
          setPaymentMode('saved');
        } else {
          setSelectedMethodId(data.payment_methods[0].id);
          setPaymentMode('saved');
        }
      } else {
        setPaymentMethods([]);
        setPaymentMode('new');
      }
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setPaymentMethods([]);
      setPaymentMode('new');
    } finally {
      setLoadingMethods(false);
    }
  };

  const handlePayWithSavedMethod = async () => {
    if (!selectedMethodId) {
      toast.error('Please select a payment method');
      return;
    }

    setProcessingPayment(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to complete payment');
        return;
      }

      const { data, error } = await supabase.functions.invoke('stripe-charge-saved-method', {
        body: {
          items,
          payment_method_id: selectedMethodId,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Payment successful!');
        // Redirect to success page with order info
        window.location.href = `/?checkout=success&session_id=${data.order_id}`;
      } else {
        throw new Error(data?.error || 'Payment failed');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      toast.error(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleConfirmPayment = () => {
    if (paymentMode === 'saved' && selectedMethodId) {
      handlePayWithSavedMethod();
    } else {
      onConfirmCheckout();
    }
  };

  const formatBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Order Review
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] px-6 py-4">
          <div className="space-y-4">
            {/* Order Items */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Services ({items.length})
              </h3>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-3 bg-muted/50 rounded-lg border border-border/50"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{item.serviceName}</h4>
                      <Badge variant="outline" className="text-xs">
                        {item.service}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Truck className="h-3 w-3" />
                      <span>{item.vehicleName}</span>
                    </div>
                    {item.depot && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{item.depot}</span>
                      </div>
                    )}
                    {item.date && item.time && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{item.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="font-semibold text-lg">
                    ${item.price.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Order Summary */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Order Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Sales Tax ({(TAX_RATE * 100).toFixed(2)}%)
                  </span>
                  <span>${tax.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">${total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Payment Method
              </h3>
              
              {loadingMethods ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : paymentMethods.length > 0 ? (
                <RadioGroup
                  value={paymentMode}
                  onValueChange={(value) => setPaymentMode(value as 'saved' | 'new')}
                  className="space-y-3"
                >
                  {/* Saved Payment Methods */}
                  <div className="space-y-2">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                          paymentMode === 'saved' && selectedMethodId === method.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => {
                          setPaymentMode('saved');
                          setSelectedMethodId(method.id);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="saved" id={`method-${method.id}`} className="sr-only" />
                          <div className="p-2 bg-muted rounded">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {formatBrand(method.brand)} •••• {method.last4}
                              </span>
                              {method.is_default && (
                                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                  <Star className="h-2 w-2 mr-1" />
                                  Primary
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year.toString().slice(-2)}
                            </p>
                          </div>
                        </div>
                        {paymentMode === 'saved' && selectedMethodId === method.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* New Card Option */}
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                      paymentMode === 'new'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setPaymentMode('new')}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="new" id="new-card" className="sr-only" />
                      <div className="p-2 bg-muted rounded">
                        <Plus className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-medium">Pay with new card</span>
                        <p className="text-xs text-muted-foreground">
                          Secure checkout via Stripe
                        </p>
                      </div>
                    </div>
                    {paymentMode === 'new' && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </RadioGroup>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">Secure Stripe Checkout</p>
                    <p className="text-sm text-muted-foreground">
                      Credit/Debit Card, Apple Pay, Google Pay
                    </p>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-success" />
                </div>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              />
              <Label
                htmlFor="terms"
                className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
              >
                I agree to the{' '}
                <a href="#" className="text-primary underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary underline">
                  Service Agreement
                </a>
                . I understand that scheduled services are subject to vehicle
                availability and depot capacity.
              </Label>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30">
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Back to Cart
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={!termsAccepted || isLoading || processingPayment}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80"
            >
              {isLoading || processingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : paymentMode === 'saved' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Pay ${total.toLocaleString()}
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Continue to Payment
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
