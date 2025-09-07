import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageRenderer } from "./MessageRenderer";
import { 
  Bot, 
  Send, 
  Calendar,
  MapPin,
  BarChart3,
  Wrench,
  Zap,
  Loader2,
  X
} from "lucide-react";

interface AIAgentPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export const AIAgentPopup = ({ open, onOpenChange, currentCity, vehicles = [], depots = [] }: AIAgentPopupProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m OttoCommand AI, your GPT-5 powered fleet assistant. I can help with:\n\n• Scheduling & maintenance\n• Data analysis & reporting\n• Voice commands & reservations\n\nWhat can I help you with?',
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

  const quickActions = [
    { icon: Calendar, label: "Schedule Maintenance", action: "schedule maintenance for vehicle" },
    { icon: MapPin, label: "Reserve Depot Stall", action: "reserve a depot stall" },
    { icon: BarChart3, label: "Analyze Fleet Data", action: "analyze fleet performance data" },
    { icon: Wrench, label: "Check Vehicle Status", action: "check vehicle maintenance status" },
    { icon: Zap, label: "Energy Optimization", action: "optimize energy usage" }
  ];

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
      // Call GPT-5 through our edge function
      const { data, error } = await supabase.functions.invoke('ottocommand-ai-chat', {
        body: {
          message: text,
          conversationHistory: messages.slice(-10), // Send last 10 messages for context
          currentCity,
          vehicles,
          depots
        }
      });

      if (error) {
        throw error;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || data.reply || data.message || 'I apologize, but I encountered an issue processing your request. Please try again.',
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

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[100dvh] sm:h-[700px] max-h-[800px] flex flex-col [&>button]:hidden text-sm">
        <DialogHeader className="pb-1">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-6 w-6 rounded-full bg-gradient-primary flex items-center justify-center mr-2 sm:h-8 sm:w-8 sm:mr-3">
                <Bot className="h-3 w-3 text-white sm:h-4 sm:w-4" />
              </div>
              <div>
                <span className="text-base font-semibold sm:text-lg">OttoCommand</span>
                <p className="text-xs text-muted-foreground">Powered by GPT-5</p>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="h-auto p-2 sm:p-3 flex flex-col items-center space-y-1 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => handleQuickAction(action.action)}
                  >
                    <action.icon className="h-3 w-3 text-primary sm:h-4 sm:w-4" />
                    <span className="text-xs text-center leading-tight">{action.label}</span>
                  </Button>
                ))}
              </div>
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
  );
};