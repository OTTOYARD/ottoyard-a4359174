import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle2,
  Download,
  Home,
  Receipt,
  Calendar,
  Truck,
  MapPin,
  Clock,
  Loader2,
  PartyPopper,
  Mail,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateReceiptPDF } from '@/utils/receiptPDF';

interface OrderDetails {
  id: string;
  status: string;
  total_amount: number;
  items_jsonb: any[];
  created_at: string;
  customer_email?: string;
  customer_name?: string;
  receipt_pdf_url?: string;
}

interface CheckoutSuccessProps {
  open: boolean;
  onClose: () => void;
  sessionId: string | null;
}

export const CheckoutSuccess: React.FC<CheckoutSuccessProps> = ({
  open,
  onClose,
  sessionId,
}) => {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);

  useEffect(() => {
    if (open && sessionId) {
      fetchOrderDetails();
    }
  }, [open, sessionId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      // Give webhook time to process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .eq('stripe_checkout_session_id', sessionId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setOrder({
          id: data.id,
          status: data.status,
          total_amount: data.total_amount,
          items_jsonb: data.items_jsonb as any[],
          created_at: data.created_at,
          customer_email: (data as any).customer_email,
          customer_name: (data as any).customer_name,
          receipt_pdf_url: (data as any).receipt_pdf_url,
        });
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!order) return;
    setDownloadingReceipt(true);
    try {
      await generateReceiptPDF({
        orderId: order.id,
        orderDate: order.created_at,
        items: order.items_jsonb,
        subtotal: order.total_amount,
        tax: Math.round(order.total_amount * 0.0825),
        total: Math.round(order.total_amount * 1.0825),
        customerName: order.customer_name || 'Valued Customer',
        customerEmail: order.customer_email || '',
      });
      toast.success('Receipt downloaded');
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Failed to download receipt');
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatOrderId = (id: string) => {
    return `ORD-${id.slice(0, 8).toUpperCase()}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-gradient-to-r from-success/10 to-success/5">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <CheckCircle2 className="h-16 w-16 text-success" />
              <PartyPopper className="h-6 w-6 text-warning absolute -top-1 -right-1" />
            </div>
            <DialogTitle className="text-2xl font-bold">
              Payment Successful!
            </DialogTitle>
            <p className="text-muted-foreground">
              Your order has been confirmed and is being processed.
            </p>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading order details...</p>
            </div>
          ) : order ? (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-mono font-bold">{formatOrderId(order.id)}</p>
                </div>
                <Badge
                  variant="outline"
                  className="bg-success/10 text-success border-success/20"
                >
                  {order.status === 'completed' ? 'Paid' : order.status}
                </Badge>
              </div>

              {/* Email Notification */}
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <Mail className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Confirmation email sent</p>
                  <p className="text-xs text-muted-foreground">
                    {order.customer_email || 'Check your inbox for details'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Order Items */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Services Ordered
                </h3>
                {order.items_jsonb?.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-3 bg-card rounded-lg border border-border/50"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{item.serviceName}</p>
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
                    <span className="font-semibold">${item.price?.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Order Total */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${(order.total_amount / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>
                    ${((order.total_amount * 0.0825) / 100).toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Paid</span>
                  <span className="text-success">
                    ${((order.total_amount * 1.0825) / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* What's Next */}
              <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                <h3 className="font-semibold mb-2">What's Next?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                    <span>Your services have been scheduled</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                    <span>You'll receive reminders before each appointment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                    <span>View all orders in the Billing tab</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Order details not found</p>
            </div>
          )}
        </ScrollArea>

        <div className="px-6 py-4 border-t border-border bg-muted/30">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDownloadReceipt}
              disabled={!order || downloadingReceipt}
              className="flex-1"
            >
              {downloadingReceipt ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download Receipt
            </Button>
            <Button onClick={onClose} className="flex-1">
              <Home className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
