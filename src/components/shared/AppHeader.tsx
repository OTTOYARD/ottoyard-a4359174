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
    <div className="px-3 pt-3 pb-2">
      <div className="glass-panel rounded-xl border border-border/50 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <InterfaceToggle>
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <img
                    src="/ottoyard-logo-new.png"
                    alt="OTTOYARD"
                    className="w-5 h-5 object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    OTTOYARD
                  </span>
                  <span className="text-sm font-bold text-foreground leading-tight">
                    {appName}
                  </span>
                </div>
              </div>
            </InterfaceToggle>
            <WeatherButton city={currentCity} />
          </div>

          <div className="flex flex-col items-end gap-1">
            {/* Top Row: Notifications + Settings */}
            <div className="flex items-center gap-1">
              <NotificationsPanel />
              <SettingsHub
                cartItems={cartItems}
                onRemoveFromCart={onRemoveFromCart}
                onCheckout={onCheckout}
              >
                <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5">
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

            {/* Second Row: AI Button */}
            <div className="flex items-center">
              <Button variant="ghost" size="sm" className="h-7 px-2 gap-1.5" onClick={onOpenAI}>
                <Bot className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium hidden sm:inline">OttoCommand</span>
                <span className="text-xs font-medium sm:hidden">OttoCommand AI</span>
              </Button>
            </div>

            {/* Third Row: Status Badge */}
            <div className="flex items-center">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 gap-1">
                <Activity className="h-2.5 w-2.5" />
                <span className="hidden sm:inline">All Systems Operational</span>
                <span className="sm:hidden">Online</span>
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
