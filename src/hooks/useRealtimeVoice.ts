"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";
import type { OrderState, OrderItem } from "@/app/customer/page";

export type ConversationMessage = {
  speaker: "customer" | "agent";
  text: string;
  timestamp: number;
};

type UseRealtimeVoiceProps = {
  language: "en" | "ar";
  onOrderComplete: (order: OrderState) => void;
  onTranscriptUpdate?: (transcript: string) => void;
  onItemsUpdate?: (items: OrderItem[]) => void;
  onConversationUpdate?: (messages: ConversationMessage[]) => void;
};

const MENU_ITEMS = [
  { name: "Cheeseburger", nameAr: "برجر الجبن", price: 7.99 },
  { name: "Chicken Burger", nameAr: "برجر دجاج", price: 8.49 },
  { name: "Veggie Burger", nameAr: "برجر نباتي", price: 7.49 },
  { name: "Large Fries", nameAr: "بطاطس كبيرة", price: 4.99 },
  { name: "Medium Fries", nameAr: "بطاطس وسط", price: 3.99 },
  { name: "Small Fries", nameAr: "بطاطس صغيرة", price: 2.99 },
  { name: "Coca Cola", nameAr: "كوكاكولا", price: 2.99 },
  { name: "Sprite", nameAr: "سبرايت", price: 2.99 },
  { name: "Orange Juice", nameAr: "عصير برتقال", price: 3.49 },
  { name: "Water", nameAr: "ماء", price: 1.99 },
];

// GLOBAL SINGLETON
let globalSession: any = null;
let globalIsConnecting = false;
let globalConnectionPromise: Promise<any> | null = null;

// Add flag to prevent auto-completion after deletion
let lastDeletionTime = 0;

// CRITICAL: Track processed agent messages to prevent duplicates
const processedAgentMessages = new Set<string>();

// CRITICAL: Reset flag for clearing order between sessions
let shouldResetOrder = false;

async function getOrCreateSession(language: "en" | "ar", instructions: string): Promise<any> {
  if (globalIsConnecting && globalConnectionPromise) {
    console.log("⏳ Waiting for existing connection...");
    return globalConnectionPromise;
  }

  if (globalSession) {
    console.log("♻️ Reusing existing session");
    return globalSession;
  }

  console.log("🚀 Creating NEW session");
  globalIsConnecting = true;
  globalConnectionPromise = createSession(language, instructions);
  
  try {
    globalSession = await globalConnectionPromise;
    return globalSession;
  } finally {
    globalIsConnecting = false;
    globalConnectionPromise = null;
  }
}

async function createSession(language: "en" | "ar", instructions: string): Promise<any> {
  console.log("🔧 Fetching ephemeral key...");
  
  const response = await fetch("/api/openai/ephemeral-key");
  if (!response.ok) {
    throw new Error("Failed to fetch ephemeral key");
  }

  const { clientSecret } = await response.json();
  console.log("✅ Ephemeral key received");

  const agent = new RealtimeAgent({
    name: language === "ar" ? "مساعد الطلبات" : "Drive-Thru Assistant",
    model: "gpt-4o-realtime-preview-2024-12-17",
    instructions,
    voice: "alloy",
    temperature: 0.8,
    maxResponseOutputTokens: 4096,
    turn_detection: {
      type: "server_vad",
    },
    input_audio_transcription: {
      model: "whisper-1",
    },
  });

  console.log("✅ Agent created with transcription enabled");

  const session = new RealtimeSession(agent);
  console.log("✅ Session object created");

  await session.connect({ apiKey: clientSecret });
  console.log("✅ Session connected");

  return session;
}

async function destroyGlobalSession(): Promise<void> {
  if (!globalSession) return;

  console.log("🧹 DESTROYING GLOBAL SESSION...");
  
  try {
    if (typeof globalSession.removeAllListeners === 'function') {
      globalSession.removeAllListeners();
    }

    if (typeof globalSession.disconnect === 'function') {
      await globalSession.disconnect();
    }
  } catch (err) {
    console.error("Error destroying session:", err);
  }

  globalSession = null;
  console.log("✅ Global session destroyed");
}

export function useRealtimeVoice({
  language,
  onOrderComplete,
  onTranscriptUpdate,
  onItemsUpdate,
  onConversationUpdate,
}: UseRealtimeVoiceProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const currentOrderRef = useRef<OrderItem[]>([]);
  const transcriptRef = useRef<string>("");
  const conversationRef = useRef<ConversationMessage[]>([]);
  const listenersAttachedRef = useRef(false);
  const historyCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processedItemIdsRef = useRef<Set<string>>(new Set());

  // CRITICAL FIX: Reset order when starting new session
  useEffect(() => {
    if (shouldResetOrder) {
      console.log("🔄 Resetting order for new customer");
      currentOrderRef.current = [];
      conversationRef.current = [];
      transcriptRef.current = "";
      processedItemIdsRef.current.clear();
      processedAgentMessages.clear();
      shouldResetOrder = false; // Clear flag
      
      if (onItemsUpdate) {
        onItemsUpdate([]);
      }
      if (onConversationUpdate) {
        onConversationUpdate([]);
      }
    }
  }, [onItemsUpdate, onConversationUpdate]);

  const getInstructions = useCallback(() => {
    const menuList = MENU_ITEMS.map(
      (item) => `- ${item.name} (${item.nameAr}): $${item.price}`
    ).join("\n");

    if (language === "en") {
      return `You are a friendly drive-thru assistant. Menu:\n${menuList}\n\nCRITICAL RULES - FOLLOW EXACTLY:
1. After EVERY customer request (add, delete, modify), you MUST output the COMPLETE current order using this EXACT format:
   "Your order is: [quantity] [item name], [quantity] [item name], ..."
   
2. Examples:
   - "Your order is: 2 Cheeseburger, 1 Chicken Burger, 1 Sprite"
   - "Your order is: 1 Large Fries"
   - "Your order is: " (if order is empty after deletion)

3. ALWAYS use English menu item names in "Your order is:" line (Cheeseburger, NOT برجر الجبن)
4. ALWAYS include quantities as numbers (2 Cheeseburger, NOT Cheeseburger)
5. This structured format MUST appear in every response after customer speaks
6. Say "ORDER_COMPLETE" only when customer confirms they're done`;
    } else {
      return `أنت مساعد طلبات ودود. القائمة:\n${menuList}\n\nقواعد حاسمة - اتبعها بالضبط:
1. بعد كل طلب من العميل (إضافة، حذف، تعديل)، يجب أن تخرج الطلب الكامل الحالي باستخدام هذا التنسيق بالضبط:
   "طلبك هو: [الكمية] [اسم الصنف], [الكمية] [اسم الصنف], ..."
   
2. أمثلة:
   - "طلبك هو: 2 برجر الجبن, 1 برجر دجاج, 1 سبرايت"
   - "طلبك هو: 1 بطاطس كبيرة"
   - "طلبك هو: " (إذا كان الطلب فارغاً بعد الحذف)

3. استخدم دائماً الأسماء العربية للأصناف في سطر "طلبك هو:" (برجر الجبن، وليس Cheeseburger)
4. ضع الكميات دائماً كأرقام (2 برجر الجبن، وليس برجر الجبن فقط)
5. يجب أن يظهر هذا التنسيق المنظم في كل رد بعد كلام العميل
6. قل "ORDER_COMPLETE" فقط عندما يؤكد العميل أنه انتهى`;
    }
  }, [language]);

  const parseOrderFromTranscript = useCallback((transcript: string): OrderItem[] => {
    const items: OrderItem[] = [];
    const lowerTranscript = transcript.toLowerCase();

    // CRITICAL FIX: Detect deletion and extract only the confirmation part
    const isDeletionMessage = /شلنا|حذف|عدلنا|أشيل|شيل|احذف|هنشيل|removed|remove|delete|cancel|تم حذف/i.test(transcript);
    
    // If deletion message, only parse items AFTER confirmation phrases
    let textToParse = transcript;
    if (isDeletionMessage) {
      console.log("🗑️ Deletion detected - extracting order confirmation part only");
      
      // Extract what REMAINS - text after "now you have" / "الآن عندك" / "عندك فقط" / "صار عندك"
      const confirmationMatch = transcript.match(/(?:الآن|صار|كده|now)\s+(?:عندك|عندنا|you have|order is|order has)\s+(?:فقط|only)?\s*:?\s*([^.،؟?]+)/is);
      
      if (confirmationMatch && confirmationMatch[1]) {
        textToParse = confirmationMatch[1];
        console.log("✅ Extracted REMAINING order:", textToParse);
      } else {
        // If no clear confirmation part, skip parsing entirely for deletion messages
        console.log("⚠️ Deletion message but no clear confirmation - skipping parse");
        return [];
      }
    }
    
    // Check if it's a menu listing (not deletion or order confirmation)
    const isOrderConfirmation = /صار الطلب|الطلب الآن|عندنا|الآن عندنا|عندي|current order|order is/i.test(transcript);
    const isMenuListing = !isDeletionMessage && !isOrderConfirmation && /menu|قائمة|available|متاح|موجود|يوجد|we have|لدينا|نقدم/i.test(transcript);
    
    if (isMenuListing) {
      console.log("📋 Detected menu listing keywords - skipping order parsing");
      return [];
    }

    // Parse items from the cleaned text
    const lowerTextToParse = textToParse.toLowerCase();

    MENU_ITEMS.forEach((menuItem) => {
      const itemName = menuItem.name.toLowerCase();
      const itemNameAr = menuItem.nameAr;
      
      // Create multiple flexible Arabic patterns - remove "ال" from anywhere
      const itemNameArFlexible = itemNameAr.replace(/ال/g, ''); // "برجر جبن"
      
      // For compound names (multiple words), also match with dual form on first word
      const arabicWords = itemNameArFlexible.split(' ');
      const dualFormPattern = arabicWords.length > 1 
        ? `${arabicWords[0]}(ين|ان)?\\s+${arabicWords.slice(1).join('\\s+')}`
        : `${itemNameArFlexible}(ين|ان)?`;
      
      // Escape special regex characters
      const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Build pattern array
      const patterns = [
        escapeRegex(itemName),
        escapeRegex(itemNameAr),
        escapeRegex(itemNameArFlexible),
        dualFormPattern
      ];
      
      // Enhanced regex to capture quantities in various formats
      const regex = new RegExp(
        `(\\d+|one|two|three|four|five|six|seven|eight|nine|ten|واحد|اثنين|اتنين|ثنين|ثلاثة|أربعة|خمسة|ستة|سبعة|ثمانية|تسعة|عشرة)?\\s*(${patterns.join('|')})`,
        'gi'
      );
      const matches = lowerTextToParse.match(regex);

      if (matches && matches.length > 0) {
        console.log(`✅ MATCHED "${menuItem.name}" with pattern:`, matches);
        
        // Extract quantity from the match
        let totalQuantity = 0;
        
        matches.forEach(match => {
          const quantityMatch = match.match(/\d+|one|two|three|four|five|six|seven|eight|nine|ten|واحد|اثنين|اتنين|ثنين|ثلاثة|أربعة|خمسة|ستة|سبعة|ثمانية|تسعة|عشرة/i);
          let quantity = 1;

          if (quantityMatch) {
            const quantityStr = quantityMatch[0].toLowerCase();
            const numberMap: Record<string, number> = {
              one: 1, two: 2, three: 3, four: 4, five: 5,
              six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
              واحد: 1, اثنين: 2, اتنين: 2, ثنين: 2, ثلاثة: 3, أربعة: 4, خمسة: 5,
              ستة: 6, سبعة: 7, ثمانية: 8, تسعة: 9, عشرة: 10,
            };
            quantity = numberMap[quantityStr] || parseInt(quantityStr) || 1;
          } else if (match.match(/ين|ان/)) {
            quantity = 2;
            console.log(`✅ Detected Arabic dual form for "${menuItem.name}" - quantity: 2`);
          }
          
          totalQuantity += quantity;
        });

        const existingItem = items.find(i => i.name === menuItem.name);
        if (existingItem) {
          existingItem.quantity += totalQuantity;
        } else {
          items.push({
            name: menuItem.name,
            nameAr: menuItem.nameAr,
            quantity: totalQuantity,
            price: menuItem.price,
          });
        }
      }
    });

    // CRITICAL FIX #2: If TOO MANY items matched (5+), it's likely a menu listing
    if (items.length >= 5) {
      console.log(`📋 Detected menu listing (${items.length} items matched) - skipping order parsing`);
      return [];
    }

    return items;
  }, []);

  // 🔥 NEW FUNCTION: Parse structured order format from agent
  const parseStructuredOrder = useCallback((transcript: string): OrderItem[] | null => {
    // Look for "طلبك هو:" or "Your order is:" format
    const structuredMatch = transcript.match(/(?:طلبك هو|your order is)\s*:\s*([^.،؟?]+)/i);
    
    if (!structuredMatch || !structuredMatch[1]) {
      return null; // No structured format found
    }
    
    const orderText = structuredMatch[1].trim();
    console.log("🎯 FOUND STRUCTURED ORDER FORMAT:", orderText);
    
    // Handle empty order case
    if (!orderText || orderText.length < 2) {
      console.log("✅ Empty order detected");
      return [];
    }
    
    const items: OrderItem[] = [];
    
    // Split by comma or "and"/"و"
    const orderParts = orderText.split(/[,،]|(?:\s+and\s+)|(?:\s+و\s+)/i);
    
    for (const part of orderParts) {
      const trimmedPart = part.trim();
      if (!trimmedPart) continue;
      
      console.log("  📝 Parsing order part:", trimmedPart);
      
      // Extract quantity and item name
      // Format: "2 برجر الجبن" or "1 Cheeseburger"
      const partMatch = trimmedPart.match(/^(\d+)\s+(.+)$/);
      
      if (!partMatch) {
        console.log("  ⚠️ Could not parse quantity from:", trimmedPart);
        continue;
      }
      
      const quantity = parseInt(partMatch[1]);
      const itemText = partMatch[2].trim().toLowerCase();
      
      // Find matching menu item
      const menuItem = MENU_ITEMS.find(m => {
        const nameMatch = m.name.toLowerCase() === itemText;
        const nameArMatch = m.nameAr === partMatch[2].trim();
        const nameArFlexible = m.nameAr.replace(/ال/g, '').toLowerCase() === itemText;
        return nameMatch || nameArMatch || nameArFlexible;
      });
      
      if (menuItem) {
        console.log(`  ✅ Matched item: ${menuItem.name} x${quantity}`);
        items.push({
          name: menuItem.name,
          nameAr: menuItem.nameAr,
          quantity: quantity,
          price: menuItem.price,
        });
      } else {
        console.log(`  ⚠️ No menu item found for: ${itemText}`);
      }
    }
    
    console.log("✅ Parsed structured order:", items.map(i => `${i.name} x${i.quantity}`));
    return items;
  }, []);

  const removeItem = useCallback((itemName: string) => {
    console.log("🗑️ Removing item:", itemName);
    
    // Mark deletion time to prevent auto-completion
    lastDeletionTime = Date.now();
    
    currentOrderRef.current = currentOrderRef.current.filter(item => item.name !== itemName);
    
    if (onItemsUpdate) {
      onItemsUpdate([...currentOrderRef.current]);
    }
  }, [onItemsUpdate]);

  const addMessage = useCallback((speaker: "customer" | "agent", text: string) => {
    if (!text || !text.trim()) return;
    
    const cleanText = text.trim();
    
    // CRITICAL FIX: Check agent message deduplication FIRST
    if (speaker === 'agent') {
      if (processedAgentMessages.has(cleanText)) {
        console.log("⏭️ Skipping already parsed agent message");
        return;
      }
      
      processedAgentMessages.add(cleanText);
      
      if (processedAgentMessages.size > 10) {
        const arr = Array.from(processedAgentMessages);
        arr.slice(0, arr.length - 10).forEach(msg => processedAgentMessages.delete(msg));
      }
    }
    
    const isDuplicate = conversationRef.current.some(
      m => m.text === cleanText && m.speaker === speaker && 
      Date.now() - m.timestamp < 2000
    );
    
    if (isDuplicate) {
      console.log("🔄 Skipping duplicate message:", cleanText.substring(0, 50));
      return;
    }

    console.log(`✅ Adding ${speaker} message:`, cleanText);
    
    const newMessage: ConversationMessage = {
      speaker,
      text: cleanText,
      timestamp: Date.now(),
    };
    
    conversationRef.current.push(newMessage);
    transcriptRef.current += " " + cleanText;
    
    if (onConversationUpdate) {
      onConversationUpdate([...conversationRef.current]);
    }

    // 🔥 CRITICAL: Check for ORDER COMPLETION FIRST (before any parsing logic)
    const orderCompletePatterns = [
      /ORDER_COMPLETE/i,
      /order\s+(?:is\s+)?complete/i,
      /your\s+order\s+is\s+ready/i,
      /طلبك\s+جاهز/i,
      /تم\s+الطلب/i,
      /الطلب\s+كامل/i,
      /هل\s+(?:هذا|ده)\s+(?:كل\s+)?(?:شيء|حاجة)/i,
      /(?:anything|something)\s+else/i,
      /تحب\s+تضيف\s+(?:أي\s+)?(?:حاجة|شيء)\s+(?:تاني|ثاني)/i,
    ];

    const isAskingForConfirmation = orderCompletePatterns.some(pattern => pattern.test(cleanText));
    
    if (speaker === 'agent' && isAskingForConfirmation && currentOrderRef.current.length > 0) {
      const timeSinceLastDeletion = Date.now() - lastDeletionTime;
      
      if (timeSinceLastDeletion < 3000) {
        console.log("🚫 Ignoring order completion - deletion happened", timeSinceLastDeletion, "ms ago");
      } else {
        console.log("✅✅✅ AGENT CONFIRMED ORDER COMPLETE - Showing order summary NOW!");
        const items = currentOrderRef.current;
        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        shouldResetOrder = true;
        console.log("🔄 Set shouldResetOrder flag for next customer");
        
        // Call onOrderComplete to transition to display screen
        onOrderComplete({ items, total, language });
      }
    }

    // Parse order from agent messages (AFTER order completion check)
    if (speaker === 'agent') {
      console.log("🛒 Parsing order from agent message...");
      
      // 🔥 PRIORITY 1: Try to parse STRUCTURED FORMAT first (most reliable)
      const structuredItems = parseStructuredOrder(cleanText);
      
      if (structuredItems !== null) {
        console.log("🎯✅ STRUCTURED ORDER DETECTED - Using as single source of truth");
        console.log("🔄 REPLACING entire order with structured items:", structuredItems.map(i => `${i.name} x${i.quantity}`));
        
        currentOrderRef.current = structuredItems.map(item => ({...item}));
        
        if (onItemsUpdate) {
          onItemsUpdate([...currentOrderRef.current]);
        }
        
        return;
      }
      
      // 🔥 FALLBACK: Old deletion logic (only if no structured format found)
      const hasDeletionKeyword = /حذف|شلنا|عدلنا|أشيل|شيل|احذف|هنشيل|removed|remove|delete|cancel|تم حذف|حذفت/i.test(cleanText);
      
      if (hasDeletionKeyword) {
        console.log("🗑️💥 DELETION DETECTED - Extracting what REMAINS in order");
        
        const parsedItems = parseOrderFromTranscript(cleanText);
        
        if (parsedItems.length >= 0) {
          console.log("✅ Extracted REMAINING order items:", parsedItems.map(i => `${i.name} x${i.quantity}`));
          console.log("🔄 REPLACING entire order with remaining items");
          
          currentOrderRef.current = parsedItems.map(item => ({...item}));
          lastDeletionTime = Date.now();
          
          if (onItemsUpdate) {
            onItemsUpdate([...currentOrderRef.current]);
          }
          
          return;
        }
      }
      
      // Normal parsing (no deletion)
      const parsedItems = parseOrderFromTranscript(cleanText);
      
      if (parsedItems.length > 0) {
        console.log("✅ Parsed items from agent:", parsedItems);
        
        const hasConfirmationPhrase = /الآن|صار|عندنا|عندي|طلبك|حالياً|فقط|current|order|now|only/i.test(cleanText);
        
        if (hasConfirmationPhrase && currentOrderRef.current.length > 0) {
          console.log("🔄 Confirmation detected - REPLACING entire order");
          currentOrderRef.current = parsedItems.map(item => ({...item}));
          if (onItemsUpdate) onItemsUpdate([...currentOrderRef.current]);
        } else {
          parsedItems.forEach(parsedItem => {
            const existingItem = currentOrderRef.current.find(item => item.name === parsedItem.name);
            if (existingItem) {
              existingItem.quantity = parsedItem.quantity;
              console.log(`🔄 Updated quantity for ${parsedItem.name}: ${parsedItem.quantity}`);
            } else {
              currentOrderRef.current.push(parsedItem);
              console.log(`➕ Added new item: ${parsedItem.name} x${parsedItem.quantity}`);
            }
          });
          
          if (onItemsUpdate) onItemsUpdate([...currentOrderRef.current]);
        }
      }
    }

    // CRITICAL FIX: Only complete order if no recent deletions
    if (cleanText.includes("ORDER_COMPLETE")) {
      const timeSinceLastDeletion = Date.now() - lastDeletionTime;
      
      if (timeSinceLastDeletion < 3000) {
        console.log("🚫 Ignoring ORDER_COMPLETE - deletion happened", timeSinceLastDeletion, "ms ago");
        return;
      }
      
      console.log("✅ ORDER_COMPLETE detected - completing order");
      const items = currentOrderRef.current;
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      shouldResetOrder = true;
      console.log("🔄 Set shouldResetOrder flag for next customer");
      
      onOrderComplete({ items, total, language });
    }
  }, [language, onConversationUpdate, onItemsUpdate, onOrderComplete, parseOrderFromTranscript, parseStructuredOrder]);

  const updateConversationFromHistory = useCallback((session: any) => {
    if (!session || typeof session.history !== 'function') return;

    try {
      const history = session.history();
      
      if (history.length === 0) {
        return;
      }

      for (const item of history) {
        // CRITICAL: Log EVERY user/customer item to see its structure
        if (item.role === 'user') {
          console.log('👤👤👤 FOUND USER HISTORY ITEM:');
          console.log('  Full item:', JSON.stringify(item, null, 2));
        }

        // Create a unique ID for this history item (without timestamp to avoid reprocessing)
        const itemId = `${item.id || Math.random()}-${item.role}-${item.type || 'unknown'}`;
        
        if (processedItemIdsRef.current.has(itemId)) {
          continue;
        }

        let text = "";
        const role = item.role;

        // Extract text from all possible paths
        if (item.formatted?.transcript) {
          text = item.formatted.transcript;
        } else if (item.formatted?.text) {
          text = item.formatted.text;
        } else if (item.formatted?.audio?.transcript) {
          text = item.formatted.audio.transcript;
        } else if (item.transcript) {
          text = item.transcript;
        } else if (Array.isArray(item.content)) {
          text = item.content
            .filter((c: any) => c.transcript || c.text)
            .map((c: any) => c.transcript || c.text)
            .filter(Boolean)
            .join(" ");
        } else if (item.content?.text) {
          text = item.content.text;
        } else if (item.content?.transcript) {
          text = item.content.transcript;
        } else if (typeof item.content === 'string') {
          text = item.content;
        }

        if (text && text.trim() && text !== "ORDER_COMPLETE") {
          console.log(`📚 History item [${role}]:`, text.substring(0, 100));
          processedItemIdsRef.current.add(itemId);
          addMessage(role === 'user' ? 'customer' : 'agent', text);
        } else if (role === 'user') {
          // USER ITEM BUT NO TEXT FOUND - LOG THIS!
          console.log('⚠️ USER ITEM HAS NO TRANSCRIPT - Check structure above');
        }
      }
    } catch (err) {
      console.error("❌ Error reading history:", err);
    }
  }, [addMessage]);

  useEffect(() => {
    let mounted = true;

    const initConnection = async () => {
      try {
        const instructions = getInstructions();
        const session = await getOrCreateSession(language, instructions);

        if (!mounted) return;

        if (!listenersAttachedRef.current) {
          console.log("🎧 Attaching event listeners...");

          // COMPREHENSIVE EVENT LOGGER
          const logAllEvents = (eventName: string) => (...args: any[]) => {
            // Only log important events to reduce console noise
            const importantEvents = ['agent_end', 'agent_start', 'transcription', 'conversation.item'];
            const shouldLogFull = importantEvents.some(e => eventName.includes(e));
            
            if (shouldLogFull) {
              console.log(`🔔 EVENT [${eventName}]:`, args);
            }
            
            // PRIORITY 1: CUSTOMER TRANSCRIPTION EVENTS (MOST IMPORTANT!)
            if (eventName.includes('input_audio_transcription')) {
              console.log('🎤🎤🎤 CUSTOMER TRANSCRIPTION EVENT:', eventName);
              console.log('📝 Full event data:', JSON.stringify(args, null, 2));
              
              for (let i = 0; i < args.length; i++) {
                const arg = args[i];
                console.log(`  [Arg ${i}]:`, typeof arg, arg);
                
                // Check for transcript in object
                if (arg && typeof arg === 'object') {
                  const possiblePaths = [
                    arg.transcript,
                    arg.text,
                    arg.delta,
                    arg.item?.formatted?.transcript,
                    arg.item?.content?.[0]?.transcript,
                    arg.formatted?.transcript,
                    arg.content?.transcript,
                  ];
                  
                  for (const path of possiblePaths) {
                    if (path && typeof path === 'string' && path.trim()) {
                      console.log('  ✅✅✅ FOUND CUSTOMER TRANSCRIPT:', path);
                      addMessage('customer', path);
                      return; // Exit after finding transcript
                    }
                  }
                }
                
                // Check if arg is a plain string
                if (typeof arg === 'string' && arg.trim()) {
                  console.log('  ✅✅✅ FOUND CUSTOMER TRANSCRIPT (string):', arg);
                  addMessage('customer', arg);
                  return;
                }
              }
            }
            
            // PRIORITY 2: CONVERSATION ITEM CREATED (may contain customer input)
            if (eventName === 'conversation.item.created') {
              console.log('💬 CONVERSATION ITEM CREATED');
              for (const arg of args) {
                if (arg && typeof arg === 'object') {
                  console.log('  Role:', arg.role);
                  console.log('  Type:', arg.type);
                  console.log('  Item:', arg);
                  
                  if (arg.role === 'user' && arg.item) {
                    const transcript = arg.item.formatted?.transcript || 
                                     arg.item.transcript ||
                                     arg.item.content?.[0]?.transcript;
                    if (transcript) {
                      console.log('  ✅ Found user input:', transcript);
                      addMessage('customer', transcript);
                    }
                  }
                }
              }
            }
            
            // PRIORITY 3: AGENT RESPONSES
            if (eventName === 'agent_end') {
              for (const arg of args) {
                if (typeof arg === 'string' && arg.trim().length > 0) {
                  console.log("🤖 Agent response:", arg.substring(0, 100));
                  addMessage('agent', arg);
                  return;
                }
              }
            }
            
            // Update from history after events
            if (mounted) {
              updateConversationFromHistory(session);
            }
          };

          const handleConnected = () => {
            console.log("✅ Connected - Session ready!");
            if (mounted) {
              setIsConnected(true);
              setError(null);
              setIsListening(true);
            }
          };

          const handleDisconnected = () => {
            console.log("❌ Disconnected");
            if (mounted) {
              setIsConnected(false);
              setIsListening(false);
            }
          };

          const handleError = (err: any) => {
            console.error("❌ Session Error:", err);
            if (mounted) {
              setError(err?.message || (language === "ar" ? "خطأ في الاتصال" : "Connection error"));
            }
          };

          // Attach listeners
          session.on("connected", handleConnected);
          session.on("disconnected", handleDisconnected);
          session.on("error", handleError);

          // Listen to ALL transcription and conversation events
          const eventsToTry = [
            "agent_end", "agent_start",
            "conversation.item.created",
            "conversation.item.input_audio_transcription.completed",
            "conversation.item.input_audio_transcription.delta",
            "input_audio_buffer.speech_started",
            "input_audio_buffer.speech_stopped",
            "input_audio_buffer.committed",
            "response.audio_transcript.delta",
            "response.audio_transcript.done",
            "response.done",
          ];

          eventsToTry.forEach(eventName => {
            try {
              session.on(eventName, logAllEvents(eventName));
            } catch (e) {
              // Event might not exist
            }
          });

          listenersAttachedRef.current = true;

          // Poll history less frequently
          historyCheckIntervalRef.current = setInterval(() => {
            if (mounted) {
              updateConversationFromHistory(session);
            }
          }, 1000);

          console.log("✅ All listeners attached");
          console.log("🎤 Speak now - customer speech will appear with 🎤🎤🎤 markers!");

          return () => {
            console.log("🧹 Cleaning up listeners...");
            if (historyCheckIntervalRef.current) {
              clearInterval(historyCheckIntervalRef.current);
            }
            listenersAttachedRef.current = false;
            conversationRef.current = [];
            processedItemIdsRef.current.clear();
          };
        }

      } catch (err: any) {
        console.error("❌ Connection error:", err);
        if (mounted) {
          setError(err?.message || (language === "ar" ? "فشل الاتصال" : "Connection failed"));
          setIsConnected(false);
        }
      }
    };

    const cleanup = initConnection();

    return () => {
      mounted = false;
      if (cleanup instanceof Promise) {
        cleanup.then(cleanupFn => {
          if (typeof cleanupFn === 'function') {
            cleanupFn();
          }
        });
      }
    };
  }, [language, getInstructions, addMessage, updateConversationFromHistory]);

  const disconnect = useCallback(async () => {
    console.log("🔌 Disconnecting...");
    
    if (historyCheckIntervalRef.current) {
      clearInterval(historyCheckIntervalRef.current);
      historyCheckIntervalRef.current = null;
    }
    
    await destroyGlobalSession();
    setIsConnected(false);
    setIsListening(false);
    listenersAttachedRef.current = false;
    processedItemIdsRef.current.clear();
  }, []);

  return {
    isConnected,
    isListening,
    error,
    audioLevel,
    disconnect,
    removeItem,
  };
}