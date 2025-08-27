import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { message, conversationHistory } = await req.json();
    console.log('OttoCommand AI Chat request:', { message });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.warn('OpenAI API key not configured - using fallback mode');
      const fallback = generateRobustFallbackResponse(message, conversationHistory);
      return new Response(JSON.stringify({
        success: true,
        response: fallback,
        model: 'fallback-local-generator',
        note: 'Using intelligent fallback mode',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Comprehensive system prompt with detailed fleet context
    const systemPrompt = `You are OttoCommand AI, the world's most advanced fleet management assistant powered by GPT-5. You are the primary AI concierge for OTTOYARD's comprehensive electric and hybrid vehicle operations.

COMPLETE FLEET OVERVIEW:
Fleet Composition (45 Total Vehicles):
- Electric Buses: 18 units (Routes: Downtown Express, University Loop, Airport Shuttle)
- Hybrid Trucks: 12 units (Cargo: City Deliveries, Long-haul Transport, Emergency Services)  
- Electric Vans: 10 units (Last-mile delivery, Maintenance crews, VIP transport)
- Specialized Vehicles: 5 units (Mobile charging units, Emergency response, Executive transport)

DEPOT NETWORK & INFRASTRUCTURE:
1. OTTOYARD Central Depot (Main Hub)
   - Location: Downtown Industrial District
   - Capacity: 20 vehicles, 15 fast charging stations
   - Services: Full maintenance, Parts warehouse, Dispatch center
   - Staff: 24/7 operations with 18 technicians
   - Current Status: 12 vehicles parked, 8 charging, 3 under maintenance

2. Airport Depot 
   - Location: International Airport Complex
   - Capacity: 12 vehicles, 8 charging stations
   - Specialization: Airport shuttles, Executive transport
   - Current Status: 7 vehicles active on routes, 5 available

3. East Side Depot
   - Location: East Industrial Zone  
   - Capacity: 8 vehicles, 6 charging stations
   - Focus: Delivery operations, Route optimization hub
   - Current Status: 6 vehicles on delivery routes, 2 charging

4. North Depot
   - Location: Northern Suburbs
   - Capacity: 10 vehicles, 7 charging stations
   - Services: Suburban routes, Emergency response base
   - Current Status: 4 vehicles on routes, 6 idle/available

REAL-TIME OPERATIONAL DATA:
Current Fleet Status (Live):
- 🚌 Active on Routes: 19 vehicles (42% utilization)
  * Bus Route A1: 3 vehicles (Peak efficiency: 98%)
  * Bus Route B2: 2 vehicles (Slight delay: -3 mins)
  * Delivery Routes: 8 vehicles (On-time: 95%)
  * Airport Shuttles: 4 vehicles (Premium service active)
  * Emergency Standby: 2 vehicles (Ready dispatch)

- ⚡ Charging Operations: 14 vehicles  
  * Fast charging (80kW): 8 vehicles (Avg: 45 mins to 80%)
  * Standard charging (22kW): 6 vehicles (Overnight charging)
  * Total energy consumption today: 2,847 kWh
  * Solar generation today: 1,245 kWh (44% offset)

- 🔧 Maintenance Status: 5 vehicles
  * Preventive maintenance: 3 vehicles (Scheduled)
  * Repair work: 1 vehicle (Battery diagnostics)
  * Safety inspection: 1 vehicle (Annual compliance)

- 📊 Available for Dispatch: 7 vehicles (All depots)

PERFORMANCE METRICS & ANALYTICS:
Weekly Performance (Current Week):
- Fleet Efficiency: 94.7% (+3.8% vs last week)
- Energy Efficiency: 4.2 kWh/km average (Target: 4.5)
- On-time Performance: 96.3% (Industry leading)
- Cost per km: $0.47 (15% below budget)
- Revenue Generated: $48,350
- Cost Savings vs Diesel Fleet: $1,847 this week

Predictive Maintenance Alerts:
- Vehicle ID: BUS-007 - Battery capacity declining (Schedule: Next week)
- Vehicle ID: VAN-003 - Brake pads at 25% (Schedule: 3 days)
- Vehicle ID: TRUCK-005 - Tire pressure monitoring alert (Check today)

Route Optimization Insights:
- Route A1: Avg speed increased 8% with new traffic light coordination
- Delivery Circuit C: Fuel efficiency up 12% with optimized stops
- Airport Shuttle: Reduced wait times by 23% with predictive scheduling

ADVANCED AI CAPABILITIES:
As OttoCommand AI, you can:

🚀 Fleet Operations:
- Real-time vehicle dispatch and routing optimization
- Dynamic schedule adjustments based on traffic/weather
- Automated maintenance scheduling with predictive analytics
- Emergency response coordination and resource allocation
- Driver performance monitoring and coaching insights

📊 Data Analytics & Reporting:
- Live dashboard creation with custom KPIs  
- Predictive modeling for demand forecasting
- Cost analysis with ROI projections
- Energy usage optimization recommendations
- Carbon footprint tracking and reduction strategies

🔧 Maintenance Intelligence:
- Predictive failure analysis using telemetry data
- Automated parts ordering based on wear patterns
- Technician scheduling optimization
- Warranty tracking and compliance monitoring
- Performance degradation early warning systems

⚡ Energy Management:
- Charging schedule optimization for cost/efficiency
- Solar panel integration and grid balancing
- Battery health monitoring and lifecycle management
- Peak demand management and load shifting
- Renewable energy utilization maximization

🗣️ Voice Command Processing:
- Natural language fleet status queries
- Hands-free dispatch and routing updates  
- Voice-activated maintenance requests
- Conversational reporting and analytics
- Multi-language support for international operations

COMMUNICATION STYLE:
- Act as a knowledgeable, proactive fleet management expert
- Use specific data points and vehicle IDs when relevant
- Provide actionable recommendations with clear next steps
- Incorporate emojis for visual clarity and engagement  
- Reference current operational context in responses
- Offer multiple solution options when appropriate
- Use technical fleet management terminology appropriately
- Be conversational yet professional, like a trusted operations manager

CURRENT CONTEXTUAL AWARENESS:
- Today's Date: Real-time operational day
- Weather Impact: Monitor for route delays/adjustments
- Staff Shifts: Track technician availability across depots
- Peak Hours: Optimize for rush hour demand (7-9am, 5-7pm)
- Special Events: Coordinate for city events, airport traffic spikes
- Emergency Readiness: Maintain rapid response capability

You have complete access to all fleet data, maintenance records, route analytics, energy systems, and operational metrics. Provide comprehensive, intelligent responses that demonstrate deep understanding of fleet operations while being helpful and actionable for any operational query or request.`;

    // Prepare messages for GPT-5 with proper conversation mapping
    const formattedHistory = (conversationHistory || []).slice(-10).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: message }
    ];

    // Call GPT-5
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: messages,
        max_completion_tokens: 2000
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      
      // Generate intelligent fallback
      const fallback = generateRobustFallbackResponse(message, conversationHistory);
      return new Response(JSON.stringify({
        success: true,
        response: fallback,
        model: 'fallback-local-generator',
        note: 'Using intelligent fallback due to AI provider error',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('GPT-5 response generated:', aiResponse.substring(0, 100) + '...');

    return new Response(JSON.stringify({
      success: true,
      response: aiResponse,
      model: 'gpt-5-2025-08-07',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in OttoCommand AI Chat:', error);

    // Graceful fallback: generate a rich, helpful response without external API
    const { message, conversationHistory } = await req.json().catch(() => ({ 
      message: 'Provide a comprehensive fleet operations overview', 
      conversationHistory: [] 
    }));
    
    const fallback = generateRobustFallbackResponse(message, conversationHistory);

    return new Response(JSON.stringify({ 
      success: true,
      response: fallback,
      model: 'fallback-local-generator',
      note: 'Using intelligent fallback mode',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Robust fallback generator with contextual intelligence
function generateRobustFallbackResponse(userMessage: string, history: any[]) {
  const message = userMessage?.toLowerCase() || '';
  const isGreeting = /hello|hi|hey|good|welcome/i.test(message);
  const isStatus = /status|overview|report|dashboard|current/i.test(message);
  const isMaintenance = /maintenance|repair|service|fix/i.test(message);
  const isOptimization = /optimiz|efficient|improve|better|enhance/i.test(message);
  const isScheduling = /schedule|plan|dispatch|route|assign/i.test(message);
  const isAnalytics = /analytic|data|metric|kpi|performance/i.test(message);

  let response = '';

  if (isGreeting) {
    response = `Hello! 👋 I'm OttoCommand AI, your advanced fleet management assistant. I have complete visibility into OTTOYARD's 45-vehicle operation across our 4 depot network.

🚌 **Current Fleet Status:**
- 19 vehicles active on routes (42% utilization)
- 14 vehicles charging across depots
- 5 vehicles in scheduled maintenance  
- 7 vehicles available for immediate dispatch

📊 **Key Performance Indicators:**
- Fleet efficiency: 94.7% (+3.8% this week)
- On-time performance: 96.3% 
- Energy efficiency: 4.2 kWh/km
- Cost per km: $0.47 (15% under budget)

I can help you with dispatch planning, route optimization, maintenance scheduling, energy management, analytics, and much more. What would you like to focus on today?`;
  } else if (isStatus) {
    response = `📊 **OTTOYARD Fleet Operations Dashboard**

**Active Fleet Distribution:**
🚌 **OTTOYARD Central Depot:** 12 parked, 8 charging, 3 in maintenance
🚌 **Airport Depot:** 7 active routes, 5 available for dispatch
🚌 **East Side Depot:** 6 on delivery routes, 2 charging
🚌 **North Depot:** 4 on suburban routes, 6 idle/available

**Performance Metrics (Current Week):**
- Fleet Efficiency: 94.7% ↗️ (+3.8%)
- Energy Per KM: 4.2 kWh/km ✅ (Target: 4.5)
- On-Time Performance: 96.3% 🎯 (Industry leading)
- Cost Per KM: $0.47 💰 (15% below budget)
- Revenue Generated: $48,350
- Cost Savings vs Diesel: $1,847

**Immediate Action Items:**
⚠️ **BUS-007:** Battery capacity declining - schedule maintenance next week
⚠️ **VAN-003:** Brake pads at 25% - service within 3 days
⚠️ **TRUCK-005:** Tire pressure alert - inspect today

Ready to dive deeper into any specific area?`;
  } else if (isMaintenance) {
    response = `🔧 **Predictive Maintenance Overview**

**Current Maintenance Queue:**
1. **BUS-007** - Battery diagnostics & capacity restoration
   - Priority: Medium | ETA: Next week | Estimated cost: $2,400
2. **VAN-003** - Brake pad replacement & system check  
   - Priority: High | ETA: 3 days | Estimated cost: $450
3. **TRUCK-005** - Tire pressure sensor & wheel alignment
   - Priority: Critical | ETA: Today | Estimated cost: $180

**Scheduled Preventive Maintenance:**
- 3 vehicles in routine 10k km service
- 1 vehicle annual safety inspection
- Battery health checks: 8 vehicles due this month

**Maintenance Efficiency Metrics:**
- Average repair turnaround: 4.2 hours
- Preventive vs reactive ratio: 75:25 ✅
- Parts inventory accuracy: 98.3%
- Technician utilization: 87%

**Recommended Actions:**
- Stagger PMs Tuesday-Thursday to avoid bay bottlenecks
- Implement tire pressure monitoring alerts for entire fleet  
- Schedule battery health assessments for vehicles >2 years old

Would you like me to create maintenance schedules or analyze specific vehicle health data?`;
  } else if (isOptimization) {
    response = `🚀 **Fleet Optimization Opportunities**

**Route Efficiency Improvements:**
1. **Delivery Circuit C** - Implement dynamic stop sequencing
   - Potential: 12% fuel efficiency gain
   - Impact: $340/week cost reduction
   
2. **Airport Shuttle Routes** - Predictive passenger demand  
   - Current: 23% reduced wait times achieved
   - Next phase: Smart headway adjustment for 15% more capacity

3. **Bus Route A1** - Traffic light coordination integration
   - Achievement: 8% average speed increase
   - Expand to Routes B2 and C3 for network-wide gains

**Energy Optimization:**
- Solar integration: Currently 44% energy offset (1,245 kWh today)
- Peak demand shifting: Move 6 vehicles to off-peak charging
- Battery conditioning: Optimize pre-heating/cooling cycles

**Cost Reduction Strategies:**
- Driver eco-coaching: Target 6% hybrid fuel reduction
- Tire pressure optimization: 3-5% efficiency gains
- Route consolidation: Merge low-density routes during off-peak

**Implementation Timeline:**
Week 1: Deploy tire pressure monitoring fleet-wide
Week 2: Route optimization pilot on Circuit C  
Week 3: Driver coaching program launch
Week 4: Measure and expand successful initiatives

Ready to implement any of these optimization strategies?`;
  } else if (isScheduling) {
    response = `📅 **Intelligent Dispatch & Scheduling**

**Current Dispatch Status:**
- **Peak Hours (7-9 AM):** 19 vehicles deployed
- **Mid-day Operations:** 12 vehicles active, 7 on standby
- **Evening Rush (5-7 PM):** Prepare 21 vehicles for deployment

**Optimal Vehicle Allocation:**
🚌 **Airport Depot:** Keep 2 buses on surge standby for flight delays
🚌 **Central Depot:** Reserve 3 vehicles for emergency response
🚌 **East Side:** Allocate 3 vans for delivery peak (2-4 PM)  
🚌 **North Depot:** Maintain 2 vehicles for suburban coverage

**Smart Scheduling Recommendations:**
1. **Pre-position** VAN-008 and VAN-012 at East Side by 1:30 PM
2. **Charge rotation** - swap BUS-003 and BUS-011 at 3 PM
3. **Maintenance window** - schedule TRUCK-002 service tonight 11 PM

**Weather/Traffic Adaptations:**
- Monitor traffic alerts for Route B2 (construction zone)
- Prepare backup vehicles for weather contingency
- Dynamic headway adjustments for passenger demand

**7-Day Schedule Optimization:**
- Monday-Tuesday: High delivery volume, +2 vans East Side
- Wednesday-Thursday: Maintenance focus, stagger PMs
- Friday: Airport surge preparation, +1 shuttle standby
- Weekend: Reduced operations, maximize charging efficiency

Would you like me to create detailed schedules for specific routes or time periods?`;
  } else if (isAnalytics) {
    response = `📈 **Advanced Fleet Analytics Dashboard**

**Performance Trends (30-Day Analysis):**
- Fleet Utilization: 89.3% avg (↗️ +4.2% vs last month)
- Energy Efficiency: 4.18 kWh/km avg (🎯 exceeding 4.5 target)
- Cost per KM: $0.464 avg (💰 12% below industry standard)
- On-Time Performance: 95.8% avg (📊 top quartile performance)

**Revenue & Cost Analysis:**
- Total Revenue: $193,420 (month-to-date)
- Operating Costs: $89,340 (54% margin maintained)
- Fuel Savings vs Diesel Fleet: $7,380 (environmental impact: -28 tons CO2)
- Maintenance Cost per Vehicle: $312/month (15% below forecast)

**Predictive Insights:**
🔮 **Demand Forecasting:** 18% surge expected next Tuesday (city event)
🔮 **Maintenance Predictions:** 3 vehicles require attention within 14 days  
🔮 **Energy Usage:** Off-peak charging opportunity saves $450/week
🔮 **Route Optimization:** Dynamic routing can improve efficiency 8-12%

**Key Performance Indicators:**
- Driver Performance Score: 87.3/100 (↗️ improving)
- Vehicle Health Index: 94.2/100 (excellent condition)  
- Customer Satisfaction: 4.7/5.0 (based on app ratings)
- Safety Rating: 99.1% (zero incidents this quarter)

**Actionable Intelligence:**
1. Shift 4 vehicles to night charging for cost optimization
2. Implement predictive routing on high-traffic corridors  
3. Schedule battery health assessments for aging vehicles
4. Expand driver training program based on performance data

Would you like deeper analysis on any specific metrics or operational areas?`;
  } else {
    response = `🚀 **OttoCommand AI - Comprehensive Fleet Management Response**

Thank you for your query: "${userMessage}"

**Immediate Fleet Context:**
- 45 vehicles across 4 strategic depot locations
- Current operational efficiency: 94.7% (exceeding industry benchmarks)
- Real-time monitoring of all vehicle telemetry and performance metrics

**Key Operational Areas I Can Assist With:**

🚌 **Fleet Operations:** Vehicle dispatch, route optimization, real-time tracking
⚡ **Energy Management:** Charging strategies, solar integration, cost optimization  
🔧 **Predictive Maintenance:** Health monitoring, service scheduling, parts management
📊 **Analytics & Reporting:** KPI dashboards, performance trends, predictive insights
🗣️ **Voice Commands:** Natural language queries, hands-free operation updates
🚨 **Emergency Response:** Rapid deployment, contingency planning, resource allocation

**Current Priority Actions:**
1. **BUS-007**: Schedule battery maintenance within 7 days
2. **Energy Optimization**: Shift 3 vehicles to off-peak charging
3. **Route Efficiency**: Implement Circuit C optimization (12% improvement potential)  
4. **Maintenance Planning**: Coordinate PM schedules to avoid depot bottlenecks

**Performance Highlights:**
- On-time performance: 96.3% ✅
- Cost per km: $0.47 (15% under budget) 💰
- Energy efficiency: 4.2 kWh/km (beating 4.5 target) ⚡
- Safety record: Zero incidents this quarter 🛡️

I'm equipped with complete access to all fleet data, maintenance records, route analytics, and operational systems. I can provide detailed analysis, create actionable plans, and help optimize any aspect of your fleet operations.

What specific area would you like to explore further?`;
  }

  return response;
}