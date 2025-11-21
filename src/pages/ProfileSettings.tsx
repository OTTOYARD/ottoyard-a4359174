import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";

export default function ProfileSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.get("fullName") as string,
          username: formData.get("username") as string,
          company_name: formData.get("companyName") as string,
          phone: formData.get("phone") as string,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      loadProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async (key: string, value: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updatedPreferences = {
        ...profile.preferences,
        [key]: value,
      };

      const { error } = await supabase
        .from("profiles")
        .update({ preferences: updatedPreferences })
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile({ ...profile, preferences: updatedPreferences });
      toast({
        title: "Success",
        description: "Preferences updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Manage your account information and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      defaultValue={profile?.full_name || ""}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      defaultValue={profile?.username || ""}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      defaultValue={profile?.company_name || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={profile?.phone || ""}
                    />
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Changes
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="preferences" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select
                      value={profile?.preferences?.theme || "system"}
                      onValueChange={(value) => handleSavePreferences("theme", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Dashboard Layout</Label>
                    <Select
                      value={profile?.preferences?.dashboard_layout || "default"}
                      onValueChange={(value) => handleSavePreferences("dashboard_layout", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="expanded">Expanded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium">Notification Settings</h3>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <Switch
                        id="email-notifications"
                        checked={profile?.preferences?.notification_settings?.email ?? true}
                        onCheckedChange={(checked) =>
                          handleSavePreferences("notification_settings", {
                            ...profile?.preferences?.notification_settings,
                            email: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="maintenance-alerts">Maintenance Alerts</Label>
                      <Switch
                        id="maintenance-alerts"
                        checked={profile?.preferences?.notification_settings?.maintenance_alerts ?? true}
                        onCheckedChange={(checked) =>
                          handleSavePreferences("notification_settings", {
                            ...profile?.preferences?.notification_settings,
                            maintenance_alerts: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="battery-alerts">Low Battery Alerts</Label>
                      <Switch
                        id="battery-alerts"
                        checked={profile?.preferences?.notification_settings?.low_battery_alerts ?? true}
                        onCheckedChange={(checked) =>
                          handleSavePreferences("notification_settings", {
                            ...profile?.preferences?.notification_settings,
                            low_battery_alerts: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="pt-6 border-t mt-6">
              <Button variant="destructive" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
