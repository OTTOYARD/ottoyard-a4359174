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
    <div className="px-3 pt-2 pb-1 overflow-hidden">
      <div className="glass-panel rounded-xl border border-border/50 px-3 py-2 overflow-hidden">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <InterfaceToggle>
            <div className="flex items-center gap-1.5 cursor-pointer min-w-0">
              <img
                src="/ottoyard-logo-new.png"
                alt="OTTOYARD"
                className="w-[76px] h-[76px] object-contain flex-shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-lg font-bold tracking-wide text-foreground truncate drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]">
                  OTTOYARD
                </span>
                <span className={`text-sm font-semibold leading-tight truncate ${appName.startsWith("Orchestra") ? "text-orchestra" : "text-primary"}`}>
                  {appName}
                </span>
                <div className="mt-0.5 min-w-0">
                  <WeatherButton city={currentCity} />
                </div>
              </div>
            </div>
          </InterfaceToggle>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-1">
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
            <Button variant="default" size="sm" className="h-7 px-2.5" onClick={onOpenAI}>
              <span className="text-xs font-semibold">OttoCommand</span>
            </Button>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 gap-1">
              <Activity className="h-2.5 w-2.5" />
              <span>Online</span>
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
