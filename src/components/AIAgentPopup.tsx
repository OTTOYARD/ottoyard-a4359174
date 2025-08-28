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
  Loader2
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
      content: 'Hello! I\'m OttoCommand AI, your advanced GPT-5 powered fleet management assistant. I can help you with scheduling, reservations, data analysis, predictive maintenance, voice commands, and comprehensive fleet management. What would you like me to help you with today?',
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
      <DialogContent className="sm:max-w-3xl h-[100dvh] sm:h-[700px] max-h-[800px] flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center mr-3">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold">OttoCommand AI</span>
                <p className="text-xs text-muted-foreground">Powered by GPT-5</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <div className="h-2 w-2 rounded-full bg-success mr-2 animate-pulse"></div>
              Online
            </Badge>
          </DialogTitle>
          <DialogDescription>OttoCommand AI chat interface for fleet management assistance</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
            {/* Quick Actions */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Quick Actions</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="h-auto p-3 flex flex-col items-center space-y-1 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => handleQuickAction(action.action)}
                  >
                    <action.icon className="h-4 w-4 text-primary" />
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
                      className={`max-w-[85%] p-4 rounded-xl shadow-sm transition-all duration-200 ${
                        message.role === 'user'
                          ? 'bg-gradient-primary text-primary-foreground glow-soft'
                          : 'bg-card/80 text-foreground border border-border/50 backdrop-blur-sm'
                      }`}
                    >
                      <MessageRenderer content={message.content} role={message.role} />
                      <div className={`text-xs mt-3 pt-2 border-t ${
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
          <div className="flex items-end space-x-3 bg-muted/30 p-4 rounded-xl flex-shrink-0 futuristic-card">
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
                e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 128) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 bg-background/80 backdrop-blur-sm resize-none max-h-32 min-h-[48px] leading-6 border border-border/50 focus:border-primary/50 focus:glow-soft transition-all duration-200"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputMessage.trim() || isLoading}
              className="futuristic-button h-12 px-4 min-w-[48px]"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};