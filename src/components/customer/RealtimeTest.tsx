"use client";

import { useState } from "react";
import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";

export default function RealtimeTest() {
  const [status, setStatus] = useState("Not started");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const testConnection = async () => {
    try {
      setStatus("Testing...");
      addLog("🚀 Starting test");

      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      addLog(`API Key present: ${apiKey ? 'YES' : 'NO'}`);
      addLog(`API Key length: ${apiKey?.length}`);
      addLog(`API Key starts with: ${apiKey?.substring(0, 10)}...`);

      if (!apiKey) {
        throw new Error("No API key found");
      }

      addLog("Creating agent...");
      const agent = new RealtimeAgent({
        name: "Test Agent",
        instructions: "You are a test assistant.",
        voice: "alloy",
      });
      addLog(`✅ Agent created. Type: ${typeof agent}`);
      addLog(`Agent keys: ${Object.keys(agent).join(", ")}`);

      addLog("Creating session...");
      const session = new RealtimeSession(agent);
      addLog(`✅ Session created. Type: ${typeof session}`);
      addLog(`Session keys: ${Object.keys(session).join(", ")}`);
      addLog(`Has connect method: ${typeof session.connect}`);
      addLog(`Has on method: ${typeof session.on}`);
      addLog(`Has disconnect method: ${typeof session.disconnect}`);

      // Try to set up events
      if (typeof session.on === 'function') {
        addLog("Setting up event listeners...");
        
        session.on("connected", () => {
          addLog("✅ EVENT: Connected!");
          setStatus("Connected");
        });

        session.on("error", (err: any) => {
          addLog(`❌ EVENT: Error - ${JSON.stringify(err)}`);
          setStatus("Error");
        });

        session.on("disconnected", () => {
          addLog("❌ EVENT: Disconnected");
          setStatus("Disconnected");
        });

        addLog("✅ Event listeners set up");
      } else {
        addLog("⚠️ No .on() method found");
      }

      // Try to connect
      if (typeof session.connect === 'function') {
        addLog("Calling session.connect()...");
        
        const connectResult = await session.connect({ apiKey });
        
        addLog(`✅ Connect returned: ${JSON.stringify(connectResult)}`);
        setStatus("Connected (via return value)");
      } else {
        addLog("❌ session.connect is not a function!");
        addLog(`connect type: ${typeof session.connect}`);
        setStatus("Error: connect method not found");
      }

    } catch (err: any) {
      addLog(`❌ EXCEPTION: ${err.message}`);
      addLog(`Error name: ${err.name}`);
      addLog(`Error stack: ${err.stack}`);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen" dir="rtl">
      <h1 className="text-4xl font-bold mb-4">اختبار Realtime API</h1>
      
      <div className="mb-4">
        <p className="text-xl">الحالة: <span className="font-bold text-blue-400">{status}</span></p>
      </div>

      <button
        onClick={testConnection}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-semibold mb-8"
      >
        ابدأ الاختبار
      </button>

      <div className="bg-black p-4 rounded-lg max-h-[600px] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">السجل:</h2>
        {logs.length === 0 ? (
          <p className="text-gray-500">لا توجد سجلات بعد...</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="font-mono text-sm">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}