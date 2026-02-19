import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageRenderer } from "./MessageRenderer";
import { useIncidentsStore } from "@/stores/incidentsStore";
import { useFleetContext, serializeFleetContext } from "@/hooks/useFleetContext";
import { QuickActionsGrid, QuickAction } from "./OttoCommand/QuickActions";
import {
  Bot,
  Send,
  Loader2,
  X,
} from "lucide-react";

interface AIAgentPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "av" | "ev";
  evContext?: {
    subscriber: any;
    vehicle: any;
    serviceRecords: any[];
    amenityAvailability: any;
    amenityReservations: any[];
    depotStages: any;
  };
  currentCity?: {
    name: string;
    coordinates: [number, number];
    country: string;
  };
  vehicles?: any[];
  depots?: any[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIAgentPopup = ({ open, onOpenChange, mode = "av", evContext, currentCity, vehicles = [], depots = [] }: AIAgentPopupProps) => {
  // Get real-time fleet context
  const fleetContext = useFleetContext();
  const incidents = useIncidentsStore((state) => state.incidents);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: mode === "ev"
        ? `Hello${evContext?.subscriber?.firstName ? `, ${evContext.subscriber.firstName}` : ''}! I'm OttoCommand for OrchestraEV — your personal EV concierge. I can help with:\n\n• **Vehicle Status** — SOC, health, charging ETA\n• **Book Amenities** — Sim golf, cowork tables, privacy pods\n• **Schedule Services** — Detailing, tire rotation, maintenance\n• **Depot Queue** — Stall position, wait times, service stages\n• **Account & Billing** — Membership tier, charges, reservations\n\nHow can I help you today?`
        : 'Hello! I\'m OttoCommand AI, your intelligent fleet assistant. I can help with:\n\n• **Fleet Status** - Real-time vehicle & depot data\n• **Analytics** - Performance reports & insights\n• **Operations** - Scheduling, maintenance, OTTOW dispatch\n• **Industry Knowledge** - AV regulations, best practices\n\nAsk me anything about your fleet!',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, open]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const text = inputMessage;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    try {
      // Serialize fleet context for the AI
      const fleetDataContext = serializeFleetContext(fleetContext);
      
      // Call AI assistant through our edge function with real-time data
      const { data, error } = await supabase.functions.invoke('ottocommand-ai-chat', {
        body: {
          message: text,
          mode: mode === "ev" ? "ev" : "ops",
          conversationHistory: messages.slice(-10),
          currentCity,
          vehicles,
          depots,
          // Pass EV context when in EV mode
          evContext: mode === "ev" ? evContext : undefined,
          // Pass comprehensive fleet context for AV mode
          fleetContext: mode === "av" ? {
            serialized: fleetDataContext,
            metrics: {
              fleet: fleetContext.fleetMetrics,
              depot: fleetContext.depotMetrics,
              incidents: fleetContext.incidentMetrics,
            },
            cities: fleetContext.cities,
            incidents: incidents.map(i => ({
              id: i.incidentId,
              type: i.type,
              status: i.status,
              city: i.city,
              vehicleId: i.vehicleId,
              summary: i.summary,
            })),
          } : undefined,
        }
      });

      if (error) {
        throw error;
      }

      // Enhanced content handling with action_block and function_calls fallback
      let content = data.content || data.reply || data.message || '';
      
      // Check if this was an OTTOW dispatch action and add to incidents store
      if (data.action_block?.action === 'ottow_dispatched' || data.success === true) {
        const details = data.action_block?.details || data;
        if (details.incidentId && details.vehicleId && details.city) {
          // Add the incident to the store
          const dispatchOTTOW = useIncidentsStore.getState().dispatchOTTOW;
          const incidentId = dispatchOTTOW(
            details.vehicleId,
            details.city,
            details.type || 'malfunction',
            details.summary || 'Incident reported via OttoCommand AI'
          );
          
          // Show success toast
          toast.success(`OTTOW dispatched! Incident ${incidentId} created.`, {
            description: `Vehicle ${details.vehicleId} in ${details.city}`,
          });
          
          console.log('OTTOW dispatch added to incidents:', incidentId);
        }
      }
      
      // If no content but we have actions or function calls, create a summary
      if (!content.trim() && (data.action_block || data.function_calls?.length)) {
        if (data.action_block?.details?.ran?.length) {
          content = `I executed ${data.action_block.details.ran.join(', ')} for you. `;
        }
        if (data.function_calls?.length) {
          content += `Completed ${data.function_calls.length} actions. `;
        }
        content += 'How else can I help with your fleet management?';
      }
      
      // Final fallback
      if (!content.trim()) {
        content = 'I apologize, but I encountered an issue processing your request. Please try again.';
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error calling OttoCommand AI:', error);
      toast.error('Failed to get AI response. Please try again.');
      
      // Fallback response
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment, or contact support if the issue persists.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: QuickAction) => {
    if (action.isDialog) {
      // Send message to AI to handle dialog actions
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: action.prompt,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const fleetDataContext = serializeFleetContext(fleetContext);

        const { data, error } = await supabase.functions.invoke('ottocommand-ai-chat', {
          body: {
            message: action.prompt,
            mode: mode === "ev" ? "ev" : "ops",
            conversationHistory: messages.slice(-10),
            currentCity,
            vehicles,
            depots,
            evContext: mode === "ev" ? evContext : undefined,
            fleetContext: mode === "av" ? {
              serialized: fleetDataContext,
              metrics: {
                fleet: fleetContext.fleetMetrics,
                depot: fleetContext.depotMetrics,
                incidents: fleetContext.incidentMetrics,
              },
              cities: fleetContext.cities,
              incidents: incidents.map(i => ({
                id: i.incidentId,
                type: i.type,
                status: i.status,
                city: i.city,
                vehicleId: i.vehicleId,
                summary: i.summary,
              })),
            } : undefined,
          }
        });

        if (error) throw error;

        const content = data?.content || 'I can help you with that. Could you provide more details?';

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);

      } catch (error) {
        console.error('Error calling OttoCommand AI:', error);
        toast.error('Failed to get AI response. Please try again.');

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // For non-dialog actions, set the prompt as the input message and auto-send
      setInputMessage(action.prompt);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl h-[100dvh] sm:h-[700px] max-h-[800px] flex flex-col [&>button]:hidden text-sm">
          <DialogHeader className="pb-1">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-6 w-6 rounded-full bg-gradient-primary flex items-center justify-center mr-2 sm:h-8 sm:w-8 sm:mr-3">
                  <Bot className="h-3 w-3 text-white sm:h-4 sm:w-4" />
                </div>
                <div>
                   <span className="text-base font-semibold sm:text-lg">OttoCommand{mode === "ev" ? " EV" : ""}</span>
                   <p className="text-xs text-muted-foreground">{mode === "ev" ? "EV Concierge" : "AI-Powered Assistant"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  <div className="h-2 w-2 rounded-full bg-success mr-2 animate-pulse"></div>
                  Online
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-10 w-10 p-0 bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground text-destructive border border-destructive/20 hover:border-destructive rounded-lg transition-all duration-200 md:h-8 md:w-8"
                >
                  <X className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">
              OttoCommand AI Assistant for fleet management operations
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
              {/* Quick Actions */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground sm:text-sm">Quick Actions</p>
                <QuickActionsGrid
                  onSelect={handleQuickAction}
                  disabled={isLoading}
                  currentCity={currentCity?.name}
                  mode={mode}
                />
              </div>

              {/* Messages */}
              <div className="border rounded-lg bg-muted/20 futuristic-card">
                <div className="p-4 space-y-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] p-3 sm:p-4 rounded-xl shadow-sm transition-all duration-200 text-sm ${
                          message.role === 'user'
                            ? 'bg-gradient-primary text-primary-foreground glow-soft'
                            : 'bg-card/80 text-foreground border border-border/50 backdrop-blur-sm'
                        }`}
                      >
                        <MessageRenderer content={message.content} role={message.role} />
                        <div className={`text-xs mt-2 pt-2 border-t sm:mt-3 ${
                          message.role === 'user' 
                            ? 'border-primary-foreground/20 text-primary-foreground/70' 
                            : 'border-border/30 text-muted-foreground'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="flex items-end space-x-2 bg-muted/30 p-3 rounded-xl flex-shrink-0 futuristic-card sm:space-x-3 sm:p-4">
              <Textarea
                ref={inputRef}
                placeholder="Ask me anything about your fleet..."
                value={inputMessage}
                rows={1}
                spellCheck={true}
                autoComplete="on"
                autoCorrect="on"
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 96) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 bg-background/80 backdrop-blur-sm resize-none max-h-24 min-h-[40px] leading-5 text-sm border border-border/50 focus:border-primary/50 focus:glow-soft transition-all duration-200 sm:max-h-32 sm:min-h-[48px] sm:leading-6"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!inputMessage.trim() || isLoading}
                className="futuristic-button h-10 px-3 min-w-[40px] sm:h-12 sm:px-4 sm:min-w-[48px]"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                ) : (
                  <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};