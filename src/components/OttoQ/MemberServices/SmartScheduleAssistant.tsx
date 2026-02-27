import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Zap, Droplets, CircleDot, HeartPulse, DollarSign } from "lucide-react";

type Step = "select_service" | "pick_time" | "confirm" | "done";

interface TimeOption {
  label: string;
  time: string;
  offPeak: boolean;
  savings?: string;
}

const serviceOptions = [
  { key: "charging", label: "Charging", icon: Zap },
  { key: "detailing", label: "Full Detail", icon: Droplets },
  { key: "tire_rotation", label: "Tire Rotation", icon: CircleDot },
  { key: "battery_diagnostic", label: "Battery Check", icon: HeartPulse },
];

const mockTimeOptions: TimeOption[] = [
  { label: "Tomorrow 7:00 AM", time: "2026-03-01T07:00:00Z", offPeak: true, savings: "$3.40" },
  { label: "Tomorrow 2:00 PM", time: "2026-03-01T14:00:00Z", offPeak: false },
  { label: "Wednesday 6:00 AM", time: "2026-03-03T06:00:00Z", offPeak: true, savings: "$4.10" },
];

export const SmartScheduleAssistant: React.FC = () => {
  const [step, setStep] = useState<Step>("select_service");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeOption | null>(null);

  const messages: { role: "user" | "assistant"; content: React.ReactNode }[] = [];

  if (selectedService) {
    const svc = serviceOptions.find((s) => s.key === selectedService);
    messages.push({ role: "user", content: `I'd like to schedule a ${svc?.label}` });
    messages.push({
      role: "assistant",
      content: (
        <div className="space-y-2">
          <p className="text-xs">I found these optimal slots based on your preferences and depot availability:</p>
        </div>
      ),
    });
  }

  if (selectedTime) {
    messages.push({ role: "user", content: selectedTime.label });
    if (step === "confirm" || step === "done") {
      messages.push({
        role: "assistant",
        content: (
          <div className="space-y-2">
            <p className="text-xs">
              Your <span className="text-foreground font-medium">{serviceOptions.find((s) => s.key === selectedService)?.label}</span> is
              set for <span className="text-foreground font-medium">{selectedTime.label}</span> at OTTO Nashville #1.
            </p>
            {selectedTime.offPeak && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3 w-3 text-success" />
                <span className="text-[10px] text-success font-medium">Off-peak rate — you save {selectedTime.savings}</span>
              </div>
            )}
          </div>
        ),
      });
    }
  }

  const reset = () => {
    setStep("select_service");
    setSelectedService(null);
    setSelectedTime(null);
  };

  return (
    <div className="surface-elevated-luxury rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border/20 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
          <Bot className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-semibold text-luxury">OTTO-Q Schedule Assistant</span>
      </div>

      <div className="p-4 space-y-3 min-h-[200px] max-h-[400px] overflow-y-auto">
        {/* Welcome */}
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bot className="h-3 w-3 text-primary" />
          </div>
          <div className="surface-luxury rounded-xl rounded-tl-sm p-3 max-w-[85%]">
            <p className="text-xs text-muted-foreground">What service would you like to schedule?</p>
          </div>
        </div>

        {/* Chat history */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="h-3 w-3 text-primary" />
              </div>
            )}
            <div className={`rounded-xl p-3 max-w-[85%] ${
              msg.role === "user"
                ? "bg-primary/15 rounded-tr-sm text-xs text-foreground"
                : "surface-luxury rounded-tl-sm"
            }`}>
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {/* Step: Select service */}
        {step === "select_service" && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {serviceOptions.map((svc) => {
              const Icon = svc.icon;
              return (
                <button
                  key={svc.key}
                  onClick={() => {
                    setSelectedService(svc.key);
                    setStep("pick_time");
                  }}
                  className="surface-luxury rounded-xl p-3 flex flex-col items-center gap-2 hover:border-primary/30 hover:-translate-y-0.5 transition-all"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">{svc.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Step: Pick time */}
        {step === "pick_time" && (
          <div className="space-y-2 mt-2">
            {mockTimeOptions.map((opt) => (
              <button
                key={opt.time}
                onClick={() => {
                  setSelectedTime(opt);
                  setStep("confirm");
                }}
                className="w-full surface-luxury rounded-xl p-3 flex items-center justify-between hover:border-primary/30 transition-all"
              >
                <span className="text-xs font-medium text-foreground">{opt.label}</span>
                <div className="flex items-center gap-2">
                  {opt.offPeak && (
                    <Badge variant="outline" className="text-[10px] bg-success/15 text-success border-success/30">
                      <DollarSign className="h-2.5 w-2.5 mr-0.5" />
                      {opt.savings}
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && (
          <div className="flex gap-2 mt-2">
            <Button
              className="futuristic-button rounded-xl flex-1 h-10 text-xs font-semibold"
              onClick={() => setStep("done")}
            >
              Confirm Booking
            </Button>
            <Button variant="outline" className="glass-button rounded-xl h-10 text-xs" onClick={reset}>
              Start Over
            </Button>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center mx-auto">
              <svg className="h-6 w-6 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-xs text-success font-semibold">Booking Confirmed!</p>
            <Button variant="outline" size="sm" className="glass-button rounded-lg text-xs" onClick={reset}>
              Schedule Another
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
