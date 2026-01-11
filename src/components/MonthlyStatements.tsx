import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  Download,
  FileText,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateStatementPDF } from '@/utils/statementPDF';

interface MonthlyStatement {
  month: string; // YYYY-MM
  orderCount: number;
  totalAmount: number;
  taxAmount: number;
}

interface ServiceOrder {
  id: string;
  created_at: string;
  items_jsonb: any[];
  total_amount: number;
  status: string;
}

export const MonthlyStatements: React.FC = () => {
  const [statements, setStatements] = useState<MonthlyStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingMonth, setDownloadingMonth] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; company?: string } | null>(null);

  useEffect(() => {
    fetchStatements();
  }, []);

  const fetchStatements = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user profile for PDF generation
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, company_name')
        .eq('user_id', user.id)
        .maybeSingle();

      setUserProfile({
        name: profileData?.full_name || user.email?.split('@')[0] || 'Customer',
        email: user.email || '',
        company: profileData?.company_name || undefined,
      });

      // Fetch all completed orders
      const { data: orders, error } = await supabase
        .from('service_orders')
        .select('id, created_at, total_amount, status')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group orders by month
      const monthlyMap = new Map<string, MonthlyStatement>();
      
      (orders || []).forEach((order) => {
        const date = new Date(order.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const existing = monthlyMap.get(monthKey);
        if (existing) {
          existing.orderCount += 1;
          existing.totalAmount += order.total_amount;
          existing.taxAmount = Math.round(existing.totalAmount * 0.0825);
        } else {
          monthlyMap.set(monthKey, {
            month: monthKey,
            orderCount: 1,
            totalAmount: order.total_amount,
            taxAmount: Math.round(order.total_amount * 0.0825),
          });
        }
      });

      // Convert to array and sort by month descending
      const statementsArray = Array.from(monthlyMap.values()).sort((a, b) => 
        b.month.localeCompare(a.month)
      );

      setStatements(statementsArray);
    } catch (error) {
      console.error('Error fetching statements:', error);
      toast.error('Failed to load statements');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStatement = async (statement: MonthlyStatement) => {
    setDownloadingMonth(statement.month);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to download statements');
        return;
      }

      // Parse month to get date range
      const [year, month] = statement.month.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Fetch orders for this month
      const { data: orders, error } = await supabase
        .from('service_orders')
        .select('id, created_at, items_jsonb, total_amount, status')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!orders || orders.length === 0) {
        toast.error('No orders found for this period');
        return;
      }

      await generateStatementPDF({
        statementMonth: statement.month,
        orders: orders.map(o => ({
          ...o,
          items_jsonb: o.items_jsonb as any[],
        })),
        totalAmount: statement.totalAmount,
        taxAmount: statement.taxAmount,
        customerName: userProfile?.name || 'Customer',
        customerEmail: userProfile?.email || '',
        companyName: userProfile?.company,
      });

      toast.success('Statement downloaded');
    } catch (error) {
      console.error('Error generating statement:', error);
      toast.error('Failed to download statement');
    } finally {
      setDownloadingMonth(null);
    }
  };

  const formatMonth = (monthStr: string): string => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (statements.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-border rounded-lg">
        <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No statements yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Statements will appear here after your first completed order
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-2">
        {statements.map((statement) => (
          <div
            key={statement.month}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{formatMonth(statement.month)}</p>
                <p className="text-sm text-muted-foreground">
                  {statement.orderCount} order{statement.orderCount !== 1 ? 's' : ''} • ${((statement.totalAmount + statement.taxAmount) / 100).toFixed(2)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownloadStatement(statement)}
              disabled={downloadingMonth === statement.month}
            >
              {downloadingMonth === statement.month ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
