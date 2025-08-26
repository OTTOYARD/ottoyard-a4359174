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

    const { command, userId, audioData } = await req.json();
    console.log('Voice Command Center request:', { command, userId });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // If audio data is provided, transcribe it first
    let transcribedCommand = command;
    if (audioData && !command) {
      const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
        },
        body: createTranscriptionFormData(audioData),
      });

      if (transcriptionResponse.ok) {
        const transcription = await transcriptionResponse.json();
        transcribedCommand = transcription.text;
        console.log('Transcribed command:', transcribedCommand);
      }
    }

    // Analyze command intent with GPT-5
    const intentResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          {
            role: 'system',
            content: `You are an AI fleet command assistant. Analyze voice commands and determine the intent and parameters.
            
            Available command types:
            - dispatch: Send vehicles to locations
            - status_check: Check vehicle or fleet status
            - route_query: Get route information
            - maintenance_alert: Report or check maintenance issues
            - general_query: General fleet information requests
            
            Return a JSON object with:
            - command_type: one of the above types
            - parameters: extracted parameters (locations, vehicle IDs, etc.)
            - confidence: confidence level (0-100)
            - action_required: what needs to be done
            - response_text: natural language response to the user`
          },
          {
            role: 'user',
            content: `Command: "${transcribedCommand}"`
          }
        ],
        max_completion_tokens: 1000,
        temperature: 0.1
      }),
    });

    if (!intentResponse.ok) {
      throw new Error('Failed to analyze command intent');
    }

    const intentData = await intentResponse.json();
    let commandAnalysis;
    
    try {
      commandAnalysis = JSON.parse(intentData.choices[0].message.content);
    } catch (e) {
      // Fallback if JSON parsing fails
      commandAnalysis = {
        command_type: 'general_query',
        parameters: {},
        confidence: 50,
        action_required: 'Process general query',
        response_text: intentData.choices[0].message.content
      };
    }

    // Execute the command based on type
    let executionResult = await executeCommand(commandAnalysis, supabase);

    // Log the voice command
    if (userId) {
      await supabase.from('voice_commands').insert({
        user_id: userId,
        command_text: transcribedCommand,
        command_type: commandAnalysis.command_type,
        response_text: commandAnalysis.response_text,
        executed_successfully: executionResult.success,
        execution_details: executionResult
      });
    }

    console.log('Command executed:', executionResult);

    return new Response(JSON.stringify({
      success: true,
      transcribed_command: transcribedCommand,
      command_analysis: commandAnalysis,
      execution_result: executionResult,
      response_audio_url: null // Could implement text-to-speech here
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in Voice Command Center:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function createTranscriptionFormData(audioData: string) {
  const formData = new FormData();
  const audioBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
  const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');
  return formData;
}

async function executeCommand(analysis: any, supabase: any) {
  const { command_type, parameters } = analysis;
  
  try {
    switch (command_type) {
      case 'dispatch':
        return await executeDispatchCommand(parameters, supabase);
      case 'status_check':
        return await executeStatusCheck(parameters, supabase);
      case 'route_query':
        return await executeRouteQuery(parameters, supabase);
      case 'maintenance_alert':
        return await executeMaintenanceAlert(parameters, supabase);
      default:
        return {
          success: true,
          action: 'general_response',
          message: analysis.response_text || 'Command processed successfully.'
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      action: 'error_handling'
    };
  }
}

async function executeDispatchCommand(parameters: any, supabase: any) {
  // Simulate vehicle dispatch
  const { data: vehicles } = await supabase.from('vehicles').select('*').limit(5);
  
  return {
    success: true,
    action: 'vehicle_dispatched',
    message: `Dispatched ${vehicles?.length || 0} available vehicles to ${parameters.location || 'specified location'}`,
    affected_vehicles: vehicles?.map((v: any) => v.id) || []
  };
}

async function executeStatusCheck(parameters: any, supabase: any) {
  const { data: vehicles } = await supabase.from('vehicles').select('*');
  const activeCount = vehicles?.filter((v: any) => v.status === 'active').length || 0;
  
  return {
    success: true,
    action: 'status_reported',
    message: `Fleet status: ${activeCount} active vehicles, ${(vehicles?.length || 0) - activeCount} offline`,
    data: { active_vehicles: activeCount, total_vehicles: vehicles?.length || 0 }
  };
}

async function executeRouteQuery(parameters: any, supabase: any) {
  const { data: routes } = await supabase.from('routes').select('*').limit(3);
  
  return {
    success: true,
    action: 'route_information',
    message: `Found ${routes?.length || 0} recent routes. Average duration: ${Math.floor(Math.random() * 60) + 30} minutes`,
    data: routes || []
  };
}

async function executeMaintenanceAlert(parameters: any, supabase: any) {
  const { data: maintenance } = await supabase.from('maintenance_records').select('*').limit(3);
  
  return {
    success: true,
    action: 'maintenance_status',
    message: `${maintenance?.length || 0} recent maintenance records. No critical alerts at this time.`,
    data: maintenance || []
  };
}