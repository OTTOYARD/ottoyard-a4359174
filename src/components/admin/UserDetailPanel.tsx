import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Save, User, Activity, ShoppingCart, Shield } from "lucide-react";

interface UserDetail {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  profile: {
    full_name: string | null;
    username: string | null;
    company_name: string | null;
    phone: string | null;
    billing_email: string | null;
    account_summary_jsonb: Record<string, unknown> | null;
  } | null;
  role: string;
  activity_logs: Array<{
    id: string;
    action: string;
    resource_type: string | null;
    created_at: string;
    details_jsonb: unknown;
  }>;
  orders: Array<{
    id: string;
    status: string;
    total_amount: number;
    currency: string;
    created_at: string;
  }>;
  subscription: {
    plan_type: string;
    status: string;
    monthly_amount: number | null;
    current_period_end: string | null;
  } | null;
}

interface UserDetailPanelProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export default function UserDetailPanel({ userId, open, onClose, onUpdated }: UserDetailPanelProps) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editFields, setEditFields] = useState({
    full_name: "",
    username: "",
    company_name: "",
    phone: "",
    billing_email: "",
  });
  const [editRole, setEditRole] = useState("user");

  const fetchDetail = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-management", {
        body: null,
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      // We need to use query params, so construct manually
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-management?action=detail&user_id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDetail(json.user);
      setEditFields({
        full_name: json.user.profile?.full_name || "",
        username: json.user.profile?.username || "",
        company_name: json.user.profile?.company_name || "",
        phone: json.user.profile?.phone || "",
        billing_email: json.user.profile?.billing_email || "",
      });
      setEditRole(json.user.role);
    } catch (err: unknown) {
      toast({ title: "Error loading user", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-management?action=update`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: detail.id,
            updates: editFields,
            new_role: editRole !== detail.role ? editRole : undefined,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({ title: "User updated successfully" });
      onUpdated();
      fetchDetail(detail.id);
    } catch (err: unknown) {
      toast({ title: "Error saving", description: String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Fetch when opening
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      setDetail(null);
    }
  };

  // Trigger fetch when userId changes
  if (open && userId && (!detail || detail.id !== userId) && !loading) {
    fetchDetail(userId);
  }

  const roleBadgeVariant = (role: string) => {
    if (role === "admin") return "destructive";
    if (role === "moderator") return "default";
    return "secondary";
  };

  const fmtDate = (d: string | null) => (d ? format(new Date(d), "MMM d, yyyy h:mm a") : "—");

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-background border-border">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            User Details
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : detail ? (
          <Tabs defaultValue="profile" className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="profile" className="flex-1 text-xs">
                <User className="h-3 w-3 mr-1" /> Profile
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex-1 text-xs">
                <Activity className="h-3 w-3 mr-1" /> Activity
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex-1 text-xs">
                <ShoppingCart className="h-3 w-3 mr-1" /> Orders
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <ScrollArea className="h-[calc(100vh-200px)] pr-3">
                <div className="space-y-4 pb-6">
                  {/* Auth info */}
                  <div className="p-3 rounded-lg bg-muted/30 space-y-1">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium text-foreground">{detail.email}</p>
                    <div className="flex gap-4 mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Joined</p>
                        <p className="text-xs text-foreground">{fmtDate(detail.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Last Login</p>
                        <p className="text-xs text-foreground">{fmtDate(detail.last_sign_in_at)}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Editable fields */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Full Name</Label>
                      <Input
                        value={editFields.full_name}
                        onChange={(e) => setEditFields((f) => ({ ...f, full_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Username</Label>
                      <Input
                        value={editFields.username}
                        onChange={(e) => setEditFields((f) => ({ ...f, username: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Company</Label>
                      <Input
                        value={editFields.company_name}
                        onChange={(e) => setEditFields((f) => ({ ...f, company_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input
                        value={editFields.phone}
                        onChange={(e) => setEditFields((f) => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Billing Email</Label>
                      <Input
                        value={editFields.billing_email}
                        onChange={(e) => setEditFields((f) => ({ ...f, billing_email: e.target.value }))}
                      />
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-xs flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Role
                      </Label>
                      <Select value={editRole} onValueChange={setEditRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Subscription */}
                  {detail.subscription && (
                    <>
                      <Separator />
                      <div className="p-3 rounded-lg bg-muted/30 space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subscription</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={detail.subscription.status === "active" ? "default" : "secondary"}>
                            {detail.subscription.status}
                          </Badge>
                          <span className="text-sm text-foreground">{detail.subscription.plan_type}</span>
                        </div>
                        {detail.subscription.monthly_amount != null && (
                          <p className="text-xs text-muted-foreground">
                            ${(detail.subscription.monthly_amount / 100).toFixed(2)}/mo
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="activity">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-2 pb-6">
                  {detail.activity_logs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No activity logs</p>
                  ) : (
                    detail.activity_logs.map((log) => (
                      <div key={log.id} className="p-3 rounded-lg bg-muted/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{log.action}</span>
                          <span className="text-xs text-muted-foreground">{fmtDate(log.created_at)}</span>
                        </div>
                        {log.resource_type && (
                          <Badge variant="outline" className="text-[10px]">{log.resource_type}</Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="orders">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-2 pb-6">
                  {detail.orders.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No orders</p>
                  ) : (
                    detail.orders.map((order) => (
                      <div key={order.id} className="p-3 rounded-lg bg-muted/20 flex items-center justify-between">
                        <div>
                          <Badge variant={order.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                            {order.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">{fmtDate(order.created_at)}</p>
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          ${(order.total_amount / 100).toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <p className="text-sm text-muted-foreground mt-6">Select a user to view details.</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
