export type OpenAIRealtimeConfig = {
  apiKey: string;
  model?: string;
  language?: "en" | "ar";
  onTranscript?: (text: string) => void;
  onOrderDetected?: (order: any) => void;
  onError?: (error: Error) => void;
};

export class OpenAIRealtimeService {
  private ws: WebSocket | null = null;
  private config: OpenAIRealtimeConfig;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;

  constructor(config: OpenAIRealtimeConfig) {
    this.config = {
      model: "gpt-4o-realtime-preview",
      ...config,
    };
  }

  async connect() {
    try {
      // Initialize WebSocket connection to OpenAI Realtime API
      const url = "wss://api.openai.com/v1/realtime?model=" + this.config.model;
      
      this.ws = new WebSocket(url, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "OpenAI-Beta": "realtime=v1",
        },
      } as any);

      this.ws.onopen = () => {
        console.log("Connected to OpenAI Realtime API");
        this.configureSession();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.config.onError?.(new Error("WebSocket connection failed"));
      };

      this.ws.onclose = () => {
        console.log("Disconnected from OpenAI Realtime API");
      };
    } catch (error) {
      console.error("Failed to connect:", error);
      this.config.onError?.(error as Error);
    }
  }

  private configureSession() {
    if (!this.ws) return;

    const sessionConfig = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: this.getSystemPrompt(),
        voice: "alloy",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1",
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      },
    };

    this.ws.send(JSON.stringify(sessionConfig));
  }

  private getSystemPrompt(): string {
    const language = this.config.language || "en";
    
    if (language === "ar") {
      return `أنت مساعد طلبات صوتي في مطعم خدمة سريعة. استمع إلى طلب العميل واستخرج العناصر والكميات والأسعار. قم بتنظيم الطلب بتنسيق JSON مع الحقول التالية:
{
  "items": [{"name": "اسم المنتج", "quantity": الكمية, "price": السعر}],
  "total": الإجمالي
}

كن ودودًا ومفيدًا. أكد الطلب مع العميل قبل الانتهاء.`;
    }

    return `You are a voice ordering assistant for a drive-thru restaurant. Listen to the customer's order and extract items, quantities, and prices. Format the order as JSON with the following fields:
{
  "items": [{"name": "item name", "quantity": number, "price": number}],
  "total": number
}

Be friendly and helpful. Confirm the order with the customer before finalizing.`;
  }

  async startListening() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(stream);
      
      // Create a processor to capture audio data
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = this.convertToPCM16(inputData);
          
          this.ws.send(
            JSON.stringify({
              type: "input_audio_buffer.append",
              audio: this.arrayBufferToBase64(pcm16),
            })
          );
        }
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);

      console.log("Started listening");
    } catch (error) {
      console.error("Failed to start listening:", error);
      this.config.onError?.(error as Error);
    }
  }

  private convertToPCM16(float32Array: Float32Array): Int16Array {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return pcm16;
  }

  private arrayBufferToBase64(buffer: Int16Array): string {
    let binary = "";
    const bytes = new Uint8Array(buffer.buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case "conversation.item.input_audio_transcription.completed":
        this.config.onTranscript?.(message.transcript);
        break;

      case "response.done":
        // Extract order from response
        const response = message.response;
        if (response?.output) {
          this.extractOrderFromResponse(response.output);
        }
        break;

      case "error":
        console.error("OpenAI error:", message.error);
        this.config.onError?.(new Error(message.error.message));
        break;
    }
  }

  private extractOrderFromResponse(output: any) {
    try {
      // Try to extract JSON order from the response
      const text = output[0]?.content?.[0]?.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const order = JSON.parse(jsonMatch[0]);
        this.config.onOrderDetected?.(order);
      }
    } catch (error) {
      console.error("Failed to parse order:", error);
    }
  }

  stopListening() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }
  }

  disconnect() {
    this.stopListening();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Hook for using OpenAI Realtime in React components
export function useOpenAIRealtime(config: Omit<OpenAIRealtimeConfig, "apiKey">) {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";
  
  const createService = () => {
    return new OpenAIRealtimeService({ ...config, apiKey });
  };

  return { createService };
}