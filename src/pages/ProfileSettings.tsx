import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [activeTab, setActiveTab] = useState<"profile" | "preferences">("profile");

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
    localStorage.removeItem('rememberMe');
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 40% at 50% 20%, hsl(var(--primary) / 0.04) 0%, transparent 70%)" }}
        />
        <div className="surface-luxury rounded-2xl p-8 flex flex-col items-center relative">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const notifToggles = [
    {
      id: "email-notifications",
      key: "email",
      label: "Email Notifications",
      description: "Receive email updates about your account",
      checked: profile?.preferences?.notification_settings?.email ?? true,
    },
    {
      id: "maintenance-alerts",
      key: "maintenance_alerts",
      label: "Maintenance Alerts",
      description: "Get alerts when maintenance is due",
      checked: profile?.preferences?.notification_settings?.maintenance_alerts ?? true,
    },
    {
      id: "battery-alerts",
      key: "low_battery_alerts",
      label: "Low Battery Alerts",
      description: "Notify when battery drops below threshold",
      checked: profile?.preferences?.notification_settings?.low_battery_alerts ?? true,
    },
  ];

  const profileFields = [
    { id: "fullName", name: "fullName", label: "Full Name", defaultValue: profile?.full_name || "", required: true, type: "text" },
    { id: "username", name: "username", label: "Username", defaultValue: profile?.username || "", required: true, type: "text" },
    { id: "companyName", name: "companyName", label: "Company Name", defaultValue: profile?.company_name || "", required: false, type: "text" },
    { id: "phone", name: "phone", label: "Phone", defaultValue: profile?.phone || "", required: false, type: "tel" },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Ambient radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 20%, hsl(var(--primary) / 0.04) 0%, transparent 70%)" }}
      />

      <div className="relative max-w-2xl mx-auto p-4 space-y-4">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="glass-button rounded-xl px-4 py-2 gap-2 text-sm font-medium h-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Page Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-luxury">Profile Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account information and preferences</p>
          <div className="h-[1px] w-20 mx-auto bg-gradient-to-r from-transparent via-primary/30 to-transparent mt-4 mb-6" />
        </div>

        {/* Main Card */}
        <div className="surface-elevated-luxury rounded-2xl overflow-hidden">
          {/* Top accent */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="p-6 space-y-6">
            {/* Tab Switcher */}
            <div className="surface-luxury rounded-xl p-1 flex">
              <button
                type="button"
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors duration-200 ${
                  activeTab === "profile"
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("profile")}
              >
                Profile
              </button>
              <button
                type="button"
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors duration-200 ${
                  activeTab === "preferences"
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("preferences")}
              >
                Preferences
              </button>
            </div>

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {profileFields.map((field, i) => (
                  <div
                    key={field.id}
                    className="space-y-2 animate-fade-in-up"
                    style={{ animationDelay: `${i * 100}ms`, animationFillMode: "backwards" }}
                  >
                    <Label htmlFor={field.id} className="text-label-uppercase">{field.label}</Label>
                    <Input
                      id={field.id}
                      name={field.name}
                      type={field.type}
                      defaultValue={field.defaultValue}
                      required={field.required}
                      className="glass-input rounded-xl h-11 focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                    />
                  </div>
                ))}
                <Button
                  type="submit"
                  disabled={saving}
                  className="futuristic-button rounded-xl px-8 py-2.5 text-sm font-semibold"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin drop-shadow-[0_0_6px_hsl(var(--primary))]" /> : null}
                  Save Changes
                </Button>
              </form>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0ms", animationFillMode: "backwards" }}>
                    <Label className="text-label-uppercase">Theme</Label>
                    <Select
                      value={profile?.preferences?.theme || "system"}
                      onValueChange={(value) => handleSavePreferences("theme", value)}
                    >
                      <SelectTrigger className="glass-input rounded-xl h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-elevated rounded-xl">
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "backwards" }}>
                    <Label className="text-label-uppercase">Dashboard Layout</Label>
                    <Select
                      value={profile?.preferences?.dashboard_layout || "default"}
                      onValueChange={(value) => handleSavePreferences("dashboard_layout", value)}
                    >
                      <SelectTrigger className="glass-input rounded-xl h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-elevated rounded-xl">
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="expanded">Expanded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="space-y-3 pt-4 border-t border-border/20">
                  <h3 className="text-base font-semibold text-luxury">Notification Settings</h3>

                  {notifToggles.map((toggle, i) => (
                    <div
                      key={toggle.id}
                      className="surface-luxury rounded-xl p-4 flex items-center justify-between animate-fade-in-up"
                      style={{ animationDelay: `${(i + 2) * 100}ms`, animationFillMode: "backwards" }}
                    >
                      <div>
                        <Label htmlFor={toggle.id} className="text-sm font-medium text-foreground cursor-pointer">
                          {toggle.label}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">{toggle.description}</p>
                      </div>
                      <Switch
                        id={toggle.id}
                        checked={toggle.checked}
                        onCheckedChange={(checked) =>
                          handleSavePreferences("notification_settings", {
                            ...profile?.preferences?.notification_settings,
                            [toggle.key]: checked,
                          })
                        }
                        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted/50 transition-colors duration-200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sign Out */}
            <div className="pt-6 border-t border-border/20">
              <Button
                onClick={handleSignOut}
                className="bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
