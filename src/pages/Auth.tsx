import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import ottoyardLogo from "@/assets/ottoyard-logo.png";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // Check if user is already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      if (isSignUp) {
        const fullName = formData.get("fullName") as string;
        const username = formData.get("username") as string;
        const companyName = formData.get("companyName") as string;

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
              username: username,
              company_name: companyName || null,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Handle remember me preference
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }

        toast({
          title: "Welcome back!",
          description: "Successfully logged in.",
          duration: 5000,
        });
      }
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

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      // Google OAuth always remembers the user
      localStorage.setItem('rememberMe', 'true');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link.",
        duration: 5000,
      });

      setShowForgotPassword(false);
      setResetEmail("");
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

  /* ── Shared background ── */
  const AuthBackground = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Radial spotlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 50% 50% at 50% 40%, hsl(var(--primary) / 0.06) 0%, transparent 70%)" }}
      />
      {/* Ambient drift grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "200px 200px",
          animation: "drift 30s linear infinite",
        }}
      />
      {children}
    </div>
  );

  /* ── Shared logo block ── */
  const LogoBlock = ({ subtitle }: { subtitle?: string }) => (
    <div className="flex flex-col items-center text-center pb-2">
      {/* Logo with ambient glow */}
      <div className="relative mb-3">
        <div className="absolute inset-0 bg-primary/[0.08] rounded-full blur-2xl" />
        <img src={ottoyardLogo} alt="OTTOYARD" className="relative w-24 h-24 object-contain" />
      </div>
      <p className="text-xl font-bold text-luxury tracking-wider">OTTOYARD</p>
      {!subtitle && (
        <>
          <p className="text-lg font-semibold text-[#617fa5] mt-1 leading-tight">Fleet Command</p>
          <p className="text-lg font-semibold text-foreground leading-tight">Dashboard</p>
        </>
      )}
      {subtitle && <p className="text-xl font-bold text-luxury mt-1">{subtitle}</p>}
      <div className="h-[1px] w-16 mx-auto bg-gradient-to-r from-transparent via-primary/30 to-transparent my-3" />
      <p className="text-sm text-muted-foreground">
        {subtitle ? "Enter your email to receive a password reset link" : "Sign in to manage your fleet operations"}
      </p>
    </div>
  );

  /* ══════════ Forgot Password ══════════ */
  if (showForgotPassword) {
    return (
      <AuthBackground>
        <div className="surface-elevated-luxury rounded-3xl max-w-sm w-full overflow-hidden animate-fade-in-scale relative">
          {/* Top accent */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="p-6 space-y-4">
            <LogoBlock subtitle="Reset Password" />

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0ms", animationFillMode: "backwards" }}>
                <Label htmlFor="reset-email" className="text-label-uppercase">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="glass-input rounded-xl h-11 focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                />
              </div>
              <Button type="submit" className="futuristic-button rounded-xl h-11 w-full text-base font-semibold" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin drop-shadow-[0_0_6px_hsl(var(--primary))]" /> : null}
                Send Reset Link
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="glass-button rounded-lg w-full h-10 text-sm font-medium gap-2"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail("");
                }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign In
              </Button>
            </form>
          </div>
        </div>
      </AuthBackground>
    );
  }

  /* ══════════ Main Auth ══════════ */
  return (
    <AuthBackground>
      <div className="surface-elevated-luxury rounded-3xl max-w-sm w-full overflow-hidden animate-fade-in-scale relative">
        {/* Top accent line */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="p-6 space-y-4">
          <LogoBlock />

          {/* Tab Switcher */}
          <div className="surface-luxury rounded-xl p-1 flex">
            <button
              type="button"
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors duration-200 ${
                !isSignUp
                  ? "bg-primary/15 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setIsSignUp(false)}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors duration-200 ${
                isSignUp
                  ? "bg-primary/15 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setIsSignUp(true)}
            >
              Sign Up
            </button>
          </div>

          {/* Sign In Form */}
          {!isSignUp && (
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="text-label-uppercase">Email</Label>
                <Input
                  id="signin-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="glass-input rounded-xl h-11 focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password" className="text-label-uppercase">Password</Label>
                <Input
                  id="signin-password"
                  name="password"
                  type="password"
                  required
                  className="glass-input rounded-xl h-11 focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                  style={{ accentColor: "hsl(var(--primary))" }}
                />
                <Label htmlFor="remember-me" className="text-sm text-muted-foreground font-normal cursor-pointer">
                  Remember me
                </Label>
              </div>
              <Button type="submit" className="futuristic-button rounded-xl h-11 w-full text-base font-semibold" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin drop-shadow-[0_0_6px_hsl(var(--primary))]" /> : null}
                Sign In
              </Button>
              <button
                type="button"
                className="w-full text-sm text-primary/70 hover:text-primary transition-colors py-1"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot password?
              </button>
            </form>
          )}

          {/* Sign Up Form */}
          {isSignUp && (
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {[
                { id: "signup-name", name: "fullName", type: "text", label: "Full Name", placeholder: "John Doe", required: true, delay: 0 },
                { id: "signup-username", name: "username", type: "text", label: "Username", placeholder: "johndoe", required: true, delay: 100 },
                { id: "signup-email", name: "email", type: "email", label: "Email", placeholder: "you@example.com", required: true, delay: 200 },
                { id: "signup-password", name: "password", type: "password", label: "Password", placeholder: "", required: true, delay: 300 },
                { id: "signup-company", name: "companyName", type: "text", label: "Company Name (Optional)", placeholder: "Acme Inc.", required: false, delay: 400 },
              ].map((field) => (
                <div
                  key={field.id}
                  className="space-y-2 animate-fade-in-up"
                  style={{ animationDelay: `${field.delay}ms`, animationFillMode: "backwards" }}
                >
                  <Label htmlFor={field.id} className="text-label-uppercase">{field.label}</Label>
                  <Input
                    id={field.id}
                    name={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="glass-input rounded-xl h-11 focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                  />
                </div>
              ))}
              <Button type="submit" className="futuristic-button rounded-xl h-11 w-full text-base font-semibold" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin drop-shadow-[0_0_6px_hsl(var(--primary))]" /> : null}
                Create Account
              </Button>
            </form>
          )}

          {/* OAuth Divider */}
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/30" />
            </div>
            <div className="relative flex justify-center">
              <span className="text-label-uppercase bg-card px-3">Or continue with</span>
            </div>
          </div>

          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            className="glass-button rounded-xl h-11 w-full text-sm font-medium hover:border-primary/20 hover:shadow-glow-sm transition-all"
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
        </div>
      </div>
    </AuthBackground>
  );
}
