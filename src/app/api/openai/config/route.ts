import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  // Return a masked version for client-side setup
  return NextResponse.json({
    configured: true,
    // Never expose the full key to the client
    keyPrefix: apiKey.substring(0, 7),
  });
}