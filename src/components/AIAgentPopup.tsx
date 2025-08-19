import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const quickActions = [
    { icon: Calendar, label: "Schedule Maintenance", action: "schedule maintenance for vehicle" },
    { icon: MapPin, label: "Reserve Depot Stall", action: "reserve a depot stall" },
    { icon: BarChart3, label: "Analyze Fleet Data", action: "analyze fleet performance data" },
    { icon: Wrench, label: "Check Vehicle Status", action: "check vehicle maintenance status" },
    { icon: Zap, label: "Energy Optimization", action: "optimize energy usage" }
  ];

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(inputMessage),
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
      <DialogContent className="sm:max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Bot className="h-5 w-5 mr-2 text-primary" />
            OTTOYARD AI Assistant
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col space-y-4">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => handleQuickAction(action.action)}
              >
                <action.icon className="h-3 w-3 mr-1" />
                {action.label}
              </Badge>
            ))}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 border rounded-lg p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex space-x-2">
            <Input
              placeholder="Ask me anything about your fleet..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage} disabled={!inputMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};