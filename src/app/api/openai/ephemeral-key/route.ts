import { NextResponse } from "next/server";

// Hardcoded API key as requested
const OPENAI_API_KEY = "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";

export async function GET() {
  try {
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