import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="surface-elevated-luxury rounded-3xl max-w-sm w-full overflow-hidden animate-fade-in-scale">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="p-8 text-center space-y-4">
          <h1 className="text-5xl font-bold text-luxury tabular-nums">404</h1>
          <p className="text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
          <Button asChild className="glass-button rounded-xl gap-2">
            <a href="/">
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
