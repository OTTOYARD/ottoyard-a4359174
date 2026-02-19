import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Bot, Activity } from "lucide-react";
import { WeatherButton } from "@/components/WeatherButton";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import SettingsHub from "@/components/SettingsHub";
import { CartItem } from "@/components/CartButton";
import { InterfaceToggle } from "@/components/shared/InterfaceToggle";
import type { City } from "@/components/CitySearchBar";

interface AppHeaderProps {
  appName: string;
  currentCity: City;
  cartItems?: CartItem[];
  onRemoveFromCart?: (itemId: string) => void;
  onCheckout?: () => void;
  onOpenAI?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  appName,
  currentCity,
  cartItems = [],
  onRemoveFromCart = () => {},
  onCheckout = () => {},
  onOpenAI,
}) => {
  return (
    <div className="px-3 pt-3 pb-2 overflow-hidden">
      <div className="glass-panel rounded-xl border border-border/50 px-3 py-2 overflow-hidden">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-shrink">
            <InterfaceToggle>
              <div className="flex items-center gap-2 cursor-pointer min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <img
                    src="/ottoyard-logo-new.png"
                    alt="OTTOYARD"
                    className="w-5 h-5 object-contain"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase truncate">
                    OTTOYARD
                  </span>
                  <span className="text-sm font-bold text-foreground leading-tight truncate">
                    {appName}
                  </span>
                </div>
              </div>
            </InterfaceToggle>
            <div className="hidden sm:block">
              <WeatherButton city={currentCity} />
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Compact single row on mobile, multi-row on sm+ */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 px-1.5 gap-1" onClick={onOpenAI}>
                <Bot className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium hidden sm:inline">OttoCommand</span>
              </Button>
              <NotificationsPanel />
              <SettingsHub
                cartItems={cartItems}
                onRemoveFromCart={onRemoveFromCart}
                onCheckout={onCheckout}
              >
                <Button variant="ghost" size="sm" className="h-7 px-1.5 gap-1">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">Settings</span>
                  {cartItems.length > 0 && (
                    <Badge variant="destructive" className="h-4 min-w-4 text-[10px] px-1">
                      {cartItems.length}
                    </Badge>
                  )}
                </Button>
              </SettingsHub>
            </div>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 gap-1 hidden sm:inline-flex">
              <Activity className="h-2.5 w-2.5" />
              <span>Online</span>
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
