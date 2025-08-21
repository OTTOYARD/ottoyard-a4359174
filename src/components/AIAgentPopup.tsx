import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Send, 
  Calendar,
  MapPin,
  BarChart3,
  Wrench,
  Zap
} from "lucide-react";

interface AIAgentPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIAgentPopup = ({ open, onOpenChange }: AIAgentPopupProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your OTTOYARD AI assistant. I can help you with scheduling, reservations, data analysis, and fleet management tasks. What would you like me to help you with?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
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

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

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

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(text),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  const getAIResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('schedule') && lowerMessage.includes('maintenance')) {
      return "I can help you schedule maintenance. I see you have 7 depots available with varying stall availability. OTTOYARD Central has 9 available stalls, while OTTOYARD Airport has the most capacity with 9 available stalls. Which vehicle would you like to schedule maintenance for?";
    } else if (lowerMessage.includes('reserve') && lowerMessage.includes('stall')) {
      return "For depot stall reservations, I recommend OTTOYARD Central (9 available stalls) or OTTOYARD Airport (9 available stalls) for immediate availability. What date and time would you prefer?";
    } else if (lowerMessage.includes('analyze') || lowerMessage.includes('data')) {
      return "Based on current fleet data: You have 45 vehicles with 94.2% efficiency. Energy generation is at 4.2 MWh with 2.1 MWh returned to grid. I notice 3 vehicles need maintenance attention. Would you like me to dive deeper into any specific metrics?";
    } else if (lowerMessage.includes('status') || lowerMessage.includes('vehicle')) {
      return "Current fleet status: 12 active vehicles, 8 charging, 3 in maintenance, 22 idle. Vehicle efficiency is trending up 3.1%. Any specific vehicle you'd like me to check?";
    } else if (lowerMessage.includes('energy') || lowerMessage.includes('optim')) {
      return "Energy optimization suggestions: 1) Move 2 idle vehicles to charging during off-peak hours, 2) Schedule maintenance for low-efficiency vehicles, 3) Consider load balancing across depots. Current grid return rate is 50% - we can improve this to 65%.";
    } else {
      return "I understand you want to " + message + ". I can help you with fleet management tasks, scheduling, data analysis, and reservations. Could you provide more specific details about what you'd like me to do?";
    }
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[90vh] sm:h-[700px] max-h-[800px] flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center mr-3">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold">FieldOps AI</span>
                <p className="text-xs text-muted-foreground">OTTOYARD AI Assistant</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <div className="h-2 w-2 rounded-full bg-success mr-2 animate-pulse"></div>
              Online
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col space-y-4">
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
          <div className="flex-1 border rounded-lg bg-muted/20 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 350px)', minHeight: '200px' }}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-lg shadow-sm ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-foreground border'
                    }`}
                  >
                    <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div className="flex items-end space-x-2 bg-muted/30 p-3 rounded-lg flex-shrink-0">
            <Textarea
              ref={inputRef}
              placeholder="Ask me anything about your fleet..."
              value={inputMessage}
              rows={1}
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
              className="flex-1 bg-background resize-none max-h-32 min-h-[44px] leading-5"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputMessage.trim()}
              className="bg-gradient-primary hover:bg-primary-hover"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};