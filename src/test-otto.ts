import { supabase } from "@/integrations/supabase/client";

// Simple test function to check if OttoCommand AI is working
export async function testOttoCommandAI() {
  try {
    console.log("🧪 Testing OttoCommand AI function...");
    
    // First test the health endpoint
    const healthResponse = await fetch(
      'https://ycsisvozzgmisboumfqc.supabase.co/functions/v1/ottocommand-ai-chat',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljc2lzdm96emdtaXNib3VtZnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzI5NTcsImV4cCI6MjA2OTA0ODk1N30.8Na6XnuBNbHifv4BcNPGMltaEsmX3QVYMASbopT1MGI`,
        },
      }
    );
    
    const healthData = await healthResponse.json();
    console.log("🏥 Health Check:", healthData);
    
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status} - ${JSON.stringify(healthData)}`);
    }
    
    // If health check passes, test actual chat
    const testMessage = "Hello, what's my fleet status?";
    console.log("💬 Testing chat with message:", testMessage);
    
    const chatResponse = await supabase.functions.invoke('ottocommand-ai-chat', {
      body: {
        message: testMessage,
        conversationHistory: []
      }
    });
    
    console.log("🤖 Chat Response:", chatResponse);
    
    if (chatResponse.error) {
      throw new Error(`Chat failed: ${JSON.stringify(chatResponse.error)}`);
    }
    
    return {
      success: true,
      health: healthData,
      chat: chatResponse.data
    };
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    return {
      success: false,
      error: error.message || String(error)
    };
  }
}

// Auto-run test
testOttoCommandAI().then(result => {
  console.log("🔍 Test Result:", result);
});