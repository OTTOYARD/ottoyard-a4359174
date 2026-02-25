import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast({
          title: "Invalid or expired link",
          description: "Please request a new password reset link.",
          variant: "destructive",
        });
        navigate("/auth");
      }
    });
  }, [navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: "Password updated!",
        description: "Your password has been successfully reset.",
        duration: 5000,
      });

      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="surface-elevated-luxury rounded-3xl max-w-md w-full overflow-hidden animate-fade-in-scale">
        {/* Top accent line */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-luxury">Set New Password</h1>
            <p className="text-sm text-muted-foreground">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
              <Label htmlFor="password" className="text-label-uppercase">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="glass-input rounded-xl h-11"
              />
            </div>
            <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
              <Label htmlFor="confirm-password" className="text-label-uppercase">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="glass-input rounded-xl h-11"
              />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
              <Button type="submit" className="futuristic-button rounded-xl h-11 w-full text-base font-semibold" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
