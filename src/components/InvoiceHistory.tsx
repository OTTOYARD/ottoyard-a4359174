import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Download,
  Eye,
  FileText,
  Loader2,
  Receipt,
  Calendar,
  DollarSign,
  Package,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateReceiptPDF } from '@/utils/receiptPDF';

interface ServiceOrder {
  id: string;
  status: string;
  total_amount: number;
  items_jsonb: any[];
  created_at: string;
  completed_at: string | null;
  receipt_pdf_url: string | null;
}

export const InvoiceHistory: React.FC = () => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(
        (data || []).map((order) => ({
          id: order.id,
          status: order.status,
          total_amount: order.total_amount,
          items_jsonb: order.items_jsonb as any[],
          created_at: order.created_at,
          completed_at: order.completed_at,
          receipt_pdf_url: (order as any).receipt_pdf_url,
        }))
      );
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (order: ServiceOrder) => {
    setDownloadingId(order.id);
    try {
      await generateReceiptPDF({
        orderId: order.id,
        orderDate: order.created_at,
        items: order.items_jsonb,
        subtotal: order.total_amount,
        tax: Math.round(order.total_amount * 0.0825),
        total: Math.round(order.total_amount * 1.0825),
        customerName: 'Valued Customer',
        customerEmail: '',
      });
      toast.success('Receipt downloaded');
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Failed to download receipt');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatOrderId = (id: string) => {
    return `ORD-${id.slice(0, 8).toUpperCase()}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            Pending
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-muted text-muted-foreground border-muted">
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getItemsSummary = (items: any[]) => {
    if (!items || items.length === 0) return 'No items';
    if (items.length === 1) return items[0].serviceName;
    return `${items[0].serviceName} + ${items.length - 1} more`;
  };

  // Calculate totals
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalSpent = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading order history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-muted/50 rounded-lg text-center">
          <Package className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{completedOrders.length}</p>
          <p className="text-xs text-muted-foreground">Completed Orders</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg text-center">
          <DollarSign className="h-5 w-5 mx-auto mb-1 text-success" />
          <p className="text-2xl font-bold">${(totalSpent / 100).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Spent</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg text-center">
          <Receipt className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{orders.length}</p>
          <p className="text-xs text-muted-foreground">All Orders</p>
        </div>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No orders yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your order history will appear here after your first purchase
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    {formatOrderId(order.id)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(order.created_at)}
                  </TableCell>
                  <TableCell className="text-sm max-w-[150px] truncate">
                    {getItemsSummary(order.items_jsonb)}
                  </TableCell>
                  <TableCell className="font-medium">
                    ${((order.total_amount * 1.0825) / 100).toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {order.status === 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadReceipt(order)}
                          disabled={downloadingId === order.id}
                        >
                          {downloadingId === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Order Details
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono font-medium">
                  {formatOrderId(selectedOrder.id)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{formatDate(selectedOrder.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                {getStatusBadge(selectedOrder.status)}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items_jsonb?.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between text-sm p-2 bg-muted/50 rounded"
                    >
                      <div>
                        <p className="font-medium">{item.serviceName}</p>
                        <p className="text-muted-foreground text-xs">
                          {item.vehicleName}
                        </p>
                      </div>
                      <span>${item.price?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${(selectedOrder.total_amount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>
                    ${((selectedOrder.total_amount * 0.0825) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>
                    ${((selectedOrder.total_amount * 1.0825) / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {selectedOrder.status === 'completed' && (
                <Button
                  onClick={() => handleDownloadReceipt(selectedOrder)}
                  disabled={downloadingId === selectedOrder.id}
                  className="w-full"
                >
                  {downloadingId === selectedOrder.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download Receipt
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
