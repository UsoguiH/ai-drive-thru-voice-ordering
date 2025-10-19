import { NextResponse } from "next/server";

export async function GET() {
  try {
    // API key should be configured in environment variables
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    // Use the REST API endpoint to generate ephemeral client secret
    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: "gpt-realtime"
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.error?.message || "Failed to generate ephemeral key");
    }

    const data = await response.json();
    console.log("✅ Ephemeral key generated successfully");

    return NextResponse.json({
      clientSecret: data.value, // The ephemeral key starts with "ek_"
    });
  } catch (error: any) {
    console.error("❌ Error generating ephemeral key:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate ephemeral key" },
      { status: 500 }
    );
  }
}