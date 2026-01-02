import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IncidentData {
  incidentId: string;
  vehicleId: string;
  city: string;
  type: string;
  summary: string;
  location: {
    addr: string;
    lat: number;
    lon: number;
  };
  timestamps: {
    reportedAt: string;
    dispatchedAt: string | null;
    securedAt: string | null;
    atDepotAt: string | null;
    closedAt: string | null;
  };
  tow: {
    provider: string;
    truckId: string | null;
    driver: string | null;
  };
  timeline: Array<{
    status: string;
    ts: string;
    note: string;
  }>;
  report: {
    shortSummary: string;
    comments: string;
  };
  reportData: {
    vehicle: {
      vehicleId: string;
      vin: string;
      make: string;
      model: string;
      year: number;
      licensePlate: string;
      odometerKm: number;
    };
    depot: {
      depotName: string;
      address: string;
      city: string;
      stallNumber: string;
    };
    repair: {
      requiresRepair: boolean;
      severity: string;
      estimatedDowntimeHours: number;
      estimatedCost: number;
      technicianNotes: string;
      repairItems: Array<{
        component: string;
        issue: string;
        priority: string;
      }>;
    };
    insurance: {
      policyNumber: string;
      provider: string;
      claimNumber?: string;
    };
    responseMetrics: {
      totalResponseMinutes: number;
    };
    thirdPartyInvolved: boolean;
    thirdPartyDetails?: string;
    policeReportFiled: boolean;
    policeReportNumber?: string;
    dashcamFootageAvailable: boolean;
    photosCollected: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { incident }: { incident: IncidentData } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Build context for the AI
    const incidentContext = `
INCIDENT REPORT DATA:
- Incident ID: ${incident.incidentId}
- Vehicle: ${incident.vehicleId} (${incident.reportData.vehicle.make} ${incident.reportData.vehicle.model} ${incident.reportData.vehicle.year})
- VIN: ${incident.reportData.vehicle.vin}
- License Plate: ${incident.reportData.vehicle.licensePlate}
- Incident Type: ${incident.type}
- Location: ${incident.location.addr}
- City: ${incident.city}
- Initial Summary: ${incident.summary}

TIMELINE:
- Reported: ${incident.timestamps.reportedAt}
- Dispatched: ${incident.timestamps.dispatchedAt || 'N/A'}
- Secured: ${incident.timestamps.securedAt || 'N/A'}
- At Depot: ${incident.timestamps.atDepotAt || 'N/A'}
- Closed: ${incident.timestamps.closedAt || 'N/A'}

RESPONSE:
- Tow Provider: ${incident.tow.provider}
- Truck ID: ${incident.tow.truckId}
- Driver: ${incident.tow.driver}
- Total Response Time: ${incident.reportData.responseMetrics.totalResponseMinutes} minutes

CURRENT STATUS:
- Depot: ${incident.reportData.depot.depotName}
- Stall: ${incident.reportData.depot.stallNumber}
- Requires Repair: ${incident.reportData.repair.requiresRepair ? 'Yes' : 'No'}
- Severity: ${incident.reportData.repair.severity}
- Estimated Downtime: ${incident.reportData.repair.estimatedDowntimeHours} hours
- Estimated Repair Cost: $${incident.reportData.repair.estimatedCost}

ADDITIONAL INFO:
- Third Party Involved: ${incident.reportData.thirdPartyInvolved ? 'Yes' : 'No'}
${incident.reportData.thirdPartyDetails ? `- Third Party Details: ${incident.reportData.thirdPartyDetails}` : ''}
- Police Report Filed: ${incident.reportData.policeReportFiled ? 'Yes' : 'No'}
${incident.reportData.policeReportNumber ? `- Police Report #: ${incident.reportData.policeReportNumber}` : ''}
- Dashcam Footage: ${incident.reportData.dashcamFootageAvailable ? 'Available' : 'Not Available'}
- Photos Collected: ${incident.reportData.photosCollected}

TECHNICIAN NOTES:
${incident.reportData.repair.technicianNotes}

USER COMMENTS:
${incident.report.comments || 'None provided'}
`;

    const systemPrompt = `You are a professional incident report writer for OTTOYARD, an autonomous vehicle fleet management company. Your task is to generate a formal, professional narrative summary for incident reports that will be submitted to insurance companies, regulatory bodies, and internal stakeholders.

Your narrative should be:
- Professional and formal in tone
- Factual and objective
- Well-structured with clear paragraphs
- Comprehensive but concise (150-250 words)
- Suitable for insurance claims and regulatory filings

Structure the narrative as:
1. Opening statement with incident identification and vehicle details
2. Description of the incident and circumstances
3. Response and recovery actions taken
4. Current vehicle status and location
5. Repair assessment and next steps
6. Closing statement with any relevant notes for insurance/regulatory purposes

Do NOT use markdown formatting. Write in plain prose paragraphs.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a professional incident report narrative based on the following data:\n\n${incidentContext}` }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const narrative = data.choices[0]?.message?.content || 'Unable to generate narrative.';

    return new Response(JSON.stringify({ narrative }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating incident report:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      narrative: null 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
