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
      content: 'Hello! I\'m OttoCommand AI, your fleet management assistant. I can help you with scheduling, reservations, data analysis, and fleet management tasks. What would you like me to help you with?',
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
    
    // Enhanced command recognition with multiple patterns
    const patterns = {
      maintenance: /\b(schedule|book|arrange|plan|set up|maintenance|service|repair|fix|check)\b.*\b(maintenance|service|repair|fix|inspection)\b/i,
      stall: /\b(reserve|book|get|need|want|find)\b.*\b(stall|spot|space|bay|dock)\b/i,
      analysis: /\b(analyze|analysis|show|report|data|performance|metrics|stats|statistics|dashboard|insights)\b/i,
      status: /\b(status|state|condition|how|what|check|show|tell)\b.*\b(vehicle|fleet|bus|truck|van)\b/i,
      energy: /\b(energy|power|battery|charge|charging|electric|efficiency|grid|kwh|mwh|optimization|optimize)\b/i,
      location: /\b(where|location|find|track|gps|position|route|map)\b/i,
      emergency: /\b(emergency|urgent|critical|help|problem|issue|breakdown|alert|warning)\b/i,
      cost: /\b(cost|price|budget|expense|money|financial|savings|profit)\b/i,
      schedule: /\b(schedule|calendar|time|when|appointment|booking)\b/i,
      weather: /\b(weather|rain|snow|temperature|conditions|forecast)\b/i,
      driver: /\b(driver|operator|staff|personnel|team|worker)\b/i,
      route: /\b(route|path|direction|navigation|journey|trip|destination)\b/i,
      fuel: /\b(fuel|gas|diesel|refuel|consumption|mpg|efficiency)\b/i,
      inventory: /\b(inventory|parts|supplies|stock|equipment|tools)\b/i,
      report: /\b(report|summary|overview|brief|update|status)\b/i
    };

    // Check for greetings
    if (/\b(hi|hello|hey|good morning|good afternoon|good evening)\b/i.test(message)) {
      return "Hello! I'm OttoCommand AI, ready to assist with your fleet operations. I can help with scheduling, vehicle status, energy optimization, route planning, and much more. What can I do for you today?";
    }

    // Check for goodbyes
    if (/\b(bye|goodbye|see you|thanks|thank you|that's all)\b/i.test(message)) {
      return "You're welcome! I'm here whenever you need assistance with your fleet operations. Have a great day managing your vehicles!";
    }

    // Emergency handling
    if (patterns.emergency.test(message)) {
      return "🚨 I detect this may be urgent. For immediate emergencies, contact dispatch at ext. 911. I can help coordinate: 1) Nearest available vehicles for backup, 2) Emergency maintenance crews, 3) Route diversions. What specific assistance do you need right now?";
    }

    // Weather queries
    if (patterns.weather.test(message)) {
      return "Current weather conditions may affect operations. I recommend: 1) Pre-heating vehicles in cold weather, 2) Adjusting routes for precipitation, 3) Monitoring battery performance in extreme temperatures. Would you like me to check which vehicles might be affected?";
    }

    // Driver/staff queries
    if (patterns.driver.test(message)) {
      return "For driver management: I can track driver schedules, certifications, and vehicle assignments. Currently showing 18 drivers on duty, 4 on break, 3 completing training. Do you need help with driver scheduling or assignments?";
    }

    // Route optimization
    if (patterns.route.test(message)) {
      return "Route optimization analysis: Current average route efficiency is 87%. I can suggest optimizations for fuel savings, time reduction, or avoiding traffic. Which vehicles or routes would you like me to analyze?";
    }

    // Maintenance scheduling (enhanced)
    if (patterns.maintenance.test(message)) {
      const vehicleMatch = message.match(/\b(vehicle|bus|truck|van)\s*(\d+|[A-Z]\d+)\b/i);
      if (vehicleMatch) {
        return `Scheduling maintenance for ${vehicleMatch[0]}. I found available slots at OTTOYARD Central (9 stalls) and Airport (9 stalls). Recommended service: Oil change + brake inspection (2.5 hrs). Preferred time window?`;
      }
      return "Maintenance scheduling options: 1) Preventive maintenance (15 vehicles due), 2) Emergency repairs (3 vehicles), 3) Inspection renewals (7 vehicles). OTTOYARD Central has immediate availability. Which vehicle needs service?";
    }

    // Stall reservations (enhanced)
    if (patterns.stall.test(message)) {
      return "Stall availability across depots:\n• OTTOYARD Central: 9 available (closest to maintenance)\n• OTTOYARD Airport: 9 available (largest capacity)\n• OTTOYARD East: 4 available\n• OTTOYARD North: 6 available\nBest match for your needs? I can reserve immediately.";
    }

    // Advanced data analysis
    if (patterns.analysis.test(message)) {
      return "📊 Fleet Performance Analytics:\n• 45 vehicles, 94.2% efficiency (+3.1% vs last month)\n• Energy: 4.2 MWh generated, 2.1 MWh returned to grid\n• Cost savings: $1,247 this week\n• Predictive maintenance alerts: 3 vehicles\n• Route optimization potential: 12% fuel savings\nWhich area needs deeper analysis?";
    }

    // Enhanced status checks
    if (patterns.status.test(message)) {
      return "🚐 Real-time Fleet Status:\n• Active: 12 vehicles (routes 101-108, 201-204)\n• Charging: 8 vehicles (completion in 45-90 mins)\n• Maintenance: 3 vehicles (ETA 2-4 hours)\n• Idle: 22 vehicles (available for dispatch)\n• Efficiency trend: ↗️ +3.1%\nNeed details on any specific vehicle?";
    }

    // Advanced energy management
    if (patterns.energy.test(message)) {
      return "⚡ Energy Optimization Insights:\n• Current load balancing: 78% efficient\n• Off-peak charging opportunities: 6 vehicles\n• Grid return potential: Increase from 50% to 65%\n• Battery health: 94% fleet average\n• Suggested actions: Move 2 idle vehicles to charging, schedule 3 maintenance items\nImplement these optimizations?";
    }

    // Location and tracking
    if (patterns.location.test(message)) {
      return "📍 Vehicle Tracking: All 45 vehicles GPS-enabled and reporting. Real-time locations available on fleet map. I can help find specific vehicles, optimize routes, or track delivery progress. Which vehicle or area do you need to locate?";
    }

    // Cost and financial analysis
    if (patterns.cost.test(message)) {
      return "💰 Financial Analysis:\n• This week: $1,247 in energy savings\n• Maintenance costs: 15% below budget\n• Fuel efficiency: +8% improvement\n• ROI on electric fleet: 127% annually\n• Predictive savings: $3,200 next quarter\nNeed detailed cost breakdown for any category?";
    }

    // Inventory management
    if (patterns.inventory.test(message)) {
      return "📦 Inventory Status: Parts inventory at 89% optimal levels. Low stock alerts: brake pads (3 sets), oil filters (12 units). Next delivery scheduled Tuesday. Emergency parts available at Central depot. Need help ordering specific items?";
    }

    // Report generation
    if (patterns.report.test(message)) {
      return "📋 Available Reports:\n• Daily Operations Summary\n• Maintenance Schedule & History\n• Energy Usage & Savings\n• Driver Performance Metrics\n• Route Efficiency Analysis\n• Cost & Budget Tracking\nWhich report would you like me to generate?";
    }

    // Scheduling general
    if (patterns.schedule.test(message)) {
      return "📅 Scheduling Assistant: I can help schedule maintenance, driver shifts, vehicle rotations, or training sessions. Current availability shows openings this week at all depots. What type of appointment do you need to schedule?";
    }

    // Fuel-related (for hybrid fleet)
    if (patterns.fuel.test(message)) {
      return "⛽ Fuel Management: Hybrid vehicles showing 28.5 MPG average (+12% vs target). Electric vehicles at 94.2% efficiency. Fuel costs down 23% this quarter thanks to electric transition. Need analysis for specific vehicles?";
    }

    // Contextual fallback with suggestions
    const commandKeywords = message.match(/\b(schedule|reserve|analyze|check|show|find|track|help|need|want|can you|please)\b/gi);
    if (commandKeywords) {
      return `I understand you want to work with "${message}". I can assist with:\n• Vehicle scheduling & maintenance\n• Depot stall reservations\n• Fleet performance analysis\n• Real-time status monitoring\n• Energy optimization\n• Route planning\n• Cost analysis\n• Emergency coordination\nCould you be more specific about which area you'd like help with?`;
    }

    // Default intelligent response
    return `I'm analyzing your request: "${message}". As your fleet management AI, I can help with operations, scheduling, maintenance, energy optimization, and data analysis. Could you provide more details about what specific action you'd like me to take?`;
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
                <p className="text-xs text-muted-foreground">AI Assistant</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <div className="h-2 w-2 rounded-full bg-success mr-2 animate-pulse"></div>
              Online
            </Badge>
          </DialogTitle>
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
            <div className="border rounded-lg bg-muted/20">
              <div className="p-4 space-y-4">
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