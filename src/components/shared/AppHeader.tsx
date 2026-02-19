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
      <div className="glass-panel rounded-xl border border-border/50 px-3 py-2 overflow-hidden space-y-2">
        {/* Row 1: Logo + Title | Notifications + Settings */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <InterfaceToggle>
            <div className="flex items-center gap-2.5 cursor-pointer min-w-0">
              <img
                src="/ottoyard-logo-new.png"
                alt="OTTOYARD"
                className="w-10 h-10 object-contain flex-shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-base font-bold tracking-wide text-foreground truncate">
                  OTTOYARD
                </span>
                <span className="text-sm font-semibold text-primary leading-tight truncate">
                  {appName}
                </span>
              </div>
            </div>
          </InterfaceToggle>

          <div className="flex items-center gap-1 flex-shrink-0">
            <NotificationsPanel />
            <SettingsHub
              cartItems={cartItems}
              onRemoveFromCart={onRemoveFromCart}
              onCheckout={onCheckout}
            >
              <Button variant="ghost" size="sm" className="h-8 px-1.5 gap-1">
                <Settings className="h-4 w-4" />
                {cartItems.length > 0 && (
                  <Badge variant="destructive" className="h-4 min-w-4 text-[10px] px-1">
                    {cartItems.length}
                  </Badge>
                )}
              </Button>
            </SettingsHub>
          </div>
        </div>

        {/* Row 2: Weather | OttoCommand */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <WeatherButton city={currentCity} />
          <Button variant="default" size="sm" className="h-8 px-3 gap-1.5" onClick={onOpenAI}>
            <Bot className="h-4 w-4" />
            <span className="text-xs font-semibold">OttoCommand</span>
          </Button>
        </div>

        {/* Row 3: Online badge */}
        <div className="flex justify-end">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 gap-1">
            <Activity className="h-2.5 w-2.5" />
            <span>Online</span>
          </Badge>
        </div>
      </div>
    </div>
  );
};
