import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Users, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserDetailPanel from "./UserDetailPanel";

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  profile: {
    full_name: string | null;
    company_name: string | null;
  } | null;
  role: string;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-management?action=list`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch users");
      setUsers(json.users || []);
    } catch (err: unknown) {
      toast.error("Failed to load users: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.profile?.full_name?.toLowerCase().includes(q) ||
      u.profile?.company_name?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const fmtDate = (d: string | null) =>
    d ? format(new Date(d), "MMM d, yyyy") : "—";

  const roleBadgeVariant = (role: string) => {
    if (role === "admin") return "destructive" as const;
    if (role === "moderator") return "default" as const;
    return "secondary" as const;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-lg">
                <Users className="h-5 w-5 mr-2 text-primary" />
                User Management
              </CardTitle>
              <CardDescription>
                View and manage all registered users ({users.length} total)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, company, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search ? "No users match your search" : "No users found"}
            </p>
          ) : (
            <div className="max-h-[400px] overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">Joined</TableHead>
                    <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow
                      key={u.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedUserId(u.id);
                        setDetailOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">
                        {u.profile?.full_name || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {u.email}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {u.profile?.company_name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(u.role)} className="text-[10px]">
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {fmtDate(u.created_at)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {fmtDate(u.last_sign_in_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <UserDetailPanel
        userId={selectedUserId}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedUserId(null);
        }}
        onUpdated={fetchUsers}
      />
    </>
  );
}
