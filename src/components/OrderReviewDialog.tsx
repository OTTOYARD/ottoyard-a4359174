import React, { useState } from 'react';
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
import {
  CreditCard,
  Loader2,
  MapPin,
  Calendar,
  Clock,
  Truck,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { CartItem } from './CartButton';

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

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;

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

            {/* Stripe Checkout Info */}
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Secure Stripe Checkout</p>
                <p className="text-sm text-muted-foreground">
                  Credit/Debit Card, Apple Pay, Google Pay
                </p>
              </div>
              <ShieldCheck className="h-5 w-5 text-success" />
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
              onClick={onConfirmCheckout}
              disabled={!termsAccepted || isLoading}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
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
