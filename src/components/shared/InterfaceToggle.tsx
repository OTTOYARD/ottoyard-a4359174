import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, Car, Truck } from "lucide-react";

interface InterfaceToggleProps {
  children: React.ReactNode;
}

const interfaces = [
  {
    id: "orchestra-av1",
    label: "OrchestraAV1",
    description: "Autonomous vehicle management",
    path: "/",
    icon: Truck,
    available: true,
  },
  {
    id: "orchestra-ev1",
    label: "OrchestraEV1",
    description: "Private EV management",
    path: "/orchestra-ev",
    icon: Car,
    available: true,
  },
];

export const InterfaceToggle: React.FC<InterfaceToggleProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = React.useState(false);

  const currentPath = location.pathname;

  const handleSelect = (path: string, available: boolean) => {
    if (!available) return;
    setOpen(false);
    if (path !== currentPath) {
      navigate(path);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 cursor-pointer">
          {children}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground px-3 py-1.5">
            Switch Interface
          </p>
          {interfaces.map((iface) => {
            const isActive =
              iface.path === "/"
                ? currentPath === "/"
                : currentPath.startsWith(iface.path);
            const Icon = iface.icon;

            return (
              <button
                key={iface.id}
                onClick={() => handleSelect(iface.path, iface.available)}
                disabled={!iface.available}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                  isActive
                    ? "bg-primary/15 border border-primary/30"
                    : iface.available
                    ? "hover:bg-muted/50 border border-transparent"
                    : "opacity-40 cursor-not-allowed border border-transparent"
                }`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-orchestra">
                      {iface.label}
                    </span>
                    {!iface.available && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {iface.description}
                  </p>
                </div>
                {isActive && (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

/** Returns the display name for the current interface based on pathname */
export function getInterfaceName(pathname: string): string {
  if (pathname.startsWith("/orchestra-ev")) return "OrchestraEV1";
  return "OrchestraAV1";
}
