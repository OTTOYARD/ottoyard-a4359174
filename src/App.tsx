import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import OrchestraEV from "./pages/OrchestraEV";
import Auth from "./pages/Auth";
import ProfileSettings from "./pages/ProfileSettings";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import ProtectedRoute from "./components/ProtectedRoute";
import { UpdateBanner } from "./components/UpdateBanner";
import { useServiceWorker } from "./hooks/useServiceWorker";

const queryClient = new QueryClient();

function AppContent() {
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker();

  return (
    <>
      <Toaster />
      <Sonner />
      {isUpdateAvailable && <UpdateBanner onUpdate={updateServiceWorker} />}
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/install" element={<Install />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/orchestra-ev" element={<ProtectedRoute><OrchestraEV /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
