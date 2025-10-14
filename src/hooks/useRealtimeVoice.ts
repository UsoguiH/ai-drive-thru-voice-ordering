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
      return `You are a friendly drive-thru assistant at a burger restaurant. Menu:\n${menuList}\n\nCRITICAL RULES - FOLLOW EXACTLY:

📋 RULE #1: MANDATORY FORMAT
After EVERY customer request (add, delete, modify), you MUST output the COMPLETE current order using this EXACT format:

"Your order is: [number] [item name], [number] [item name], [number] [item name]"

✅ CORRECT Examples:
- "Great! Your order is: 1 Cheeseburger, 1 Chicken Burger"
- "Perfect! Your order is: 2 Cheeseburger, 1 Sprite, 1 Large Fries"
- "Got it! Your order is: 1 Medium Fries"
- "Removed. Your order is: 1 Cheeseburger" (after deletion)
- "Removed. Your order is: " (if order is empty)

❌ WRONG Examples (DON'T do this):
- "Your order: cheeseburger and chicken burger" (missing "is:", quantities)
- "You have a cheeseburger" (missing full format)

🎯 Format Rules:
1. Always use "Your order is:" followed by colon (:)
2. Put quantity number first (1, 2, 3, etc.)
3. Use exact English menu item names (Cheeseburger, Chicken Burger, etc.)
4. Separate items with comma (,) or "and"
5. This line MUST appear in every response after customer speaks

🔚 Order Completion:
Say "ORDER_COMPLETE" only when customer says "that's all", "that's it", "I'm done", or confirms they're finished

💬 Speaking Style:
- Be friendly and concise
- Welcome customer at start
- Use phrases like "Great", "Perfect", "Got it"
- Ask "Would you like anything else?" after each addition

🍔 Customizations:
For burgers only (Cheeseburger, Chicken Burger, Veggie Burger), customers can add customizations:
- no cheese
- no lettuce
- no tomato
- add more tomato

When a customization is requested, write it in square brackets [] after the item name:

Example:
Customer: "Cheeseburger with no lettuce and add more tomato"
You: "Great! Your order is: 1 Cheeseburger [no lettuce, add more tomato]. Anything else?"

Customer: "Chicken burger no cheese and regular cheeseburger"
You: "Perfect! Your order is: 1 Chicken Burger [no cheese], 1 Cheeseburger. Would you like anything else?"`;
    } else {
      return `أنت مساعد طلبات ودود في مطعم برجر. تحدث باللغة العربية. القائمة:\n${menuList}\n\n⚠️ قاعدة حرجة - اتبعها بالضبط:

📋 التنسيق الإلزامي (MANDATORY FORMAT)
في كل رد بعد كلام العميل، يجب أن تخرج الطلب الكامل بهذا التنسيق بالضبط:

طلبك هو: [رقم] [اسم صنف], [رقم] [اسم صنف]

✅ أمثلة محادثة صحيحة:

عميل: "عايز برجر جبن وبرجر دجاج"
أنت: "حاضر! طلبك هو: 1 برجر الجبن, 1 برجر دجاج. تحب تضيف حاجة تانية؟"

عميل: "اتنين برجر جبن"
أنت: "تمام! طلبك هو: 2 برجر الجبن. في حاجة تانية؟"

عميل: "زود سبرايت"
أنت: "ممتاز! طلبك هو: 2 برجر الجبن, 1 سبرايت. تحب حاجة تانية؟"

عميل: "برجر دجاج كمان"
أنت: "تمام! طلبك هو: 2 برجر الجبن, 1 سبرايت, 1 برجر دجاج. حاجة تانية؟"

❌ أمثلة خاطئة (لا تفعل أبداً):
- "عندك برجر جبن وبرجر دجاج" ❌ (ناقص "طلبك هو:" والكميات)
- "طلبك برجر جبن" ❌ (ناقص "هو:" والكمية)
- "تمام حاضر" ❌ (ناقص الطلب بالكامل)

🎯 قواعد مهمة:
1. كل رد يجب أن يحتوي على "طلبك هو:" + كل الأصناف
2. استخدم فاصلة (،) بين الأصناف
3. ضع الرقم قبل اسم الصنف دائماً
4. لو العميل قال صنفين، اكتب الصنفين في "طلبك هو:"
5. استخدم الأسماء من القائمة بالضبط

🍔 التخصيصات (Customizations):
للبرجر فقط (برجر الجبن، برجر دجاج، برجر نباتي)، يمكن إضافة تخصيصات:
- بدون جبن (no cheese)
- بدون خس (no lettuce)
- بدون طماطم (no tomato)
- زود طماطم (add more tomato)

عند طلب تخصيص، اكتبه بين قوسين [] بعد اسم الصنف:

مثال:
عميل: "برجر جبن بدون خس وزود طماطم"
أنت: "حاضر! طلبك هو: 1 برجر الجبن [بدون خس، زود طماطم]. تحب تضيف حاجة؟"

عميل: "برجر دجاج بدون جبن وبرجر جبن عادي"
أنت: "تمام! طلبك هو: 1 برجر دجاج [بدون جبن]، 1 برجر الجبن. حاجة تانية؟"

🔚 إنهاء: قل "ORDER_COMPLETE" فقط لما العميل يقول "كده كفاية" أو "خلاص"`;
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
    const isOrderConfirmation = /صار الطلب|الطلب الآن|عندنا|الآن عندنا|عندي|current order|order is|طلبك/i.test(transcript);
    const isMenuListing = !isDeletionMessage && !isOrderConfirmation && /menu|قائمة|available|متاح|موجود|يوجد|we have|لدينا|نقدم/i.test(transcript);

    if (isMenuListing) {
      console.log("📋 Detected menu listing keywords - skipping order parsing");
      return [];
    }

    // Parse items from the cleaned text
    const lowerTextToParse = textToParse.toLowerCase();
    console.log("🔍 Parsing text:", lowerTextToParse);

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

      // Build pattern array - MORE PATTERNS for better matching
      const patterns = [
        escapeRegex(itemName),
        escapeRegex(itemNameAr),
        escapeRegex(itemNameArFlexible),
        dualFormPattern,
        // Add more flexible patterns
        escapeRegex(itemNameAr.replace(/\s+/g, '\\s*')), // flexible spacing
        escapeRegex(itemNameArFlexible.replace(/\s+/g, '\\s*')), // flexible spacing without ال
      ];

      // Enhanced regex to capture quantities in various formats
      // MORE FLEXIBLE - allow more spacing variations
      const regex = new RegExp(
        `(\\d+|one|two|three|four|five|six|seven|eight|nine|ten|واحد|اثنين|اتنين|ثنين|ثلاثة|أربعة|خمسة|ستة|سبعة|ثمانية|تسعة|عشرة)?\\s*(?:من)?\\s*(${patterns.join('|')})`,
        'gi'
      );
      const matches = lowerTextToParse.match(regex);

      if (matches && matches.length > 0) {
        console.log(`✅ MATCHED "${menuItem.name}" (${menuItem.nameAr}) with pattern:`, matches);

        // Extract quantity from the match - COUNT EACH MATCH SEPARATELY
        let totalQuantity = 0;

        matches.forEach((match, idx) => {
          console.log(`  Processing match ${idx + 1}:`, match);
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
            console.log(`    Found explicit quantity: ${quantity}`);
          } else if (match.match(/ين|ان/)) {
            quantity = 2;
            console.log(`    Detected Arabic dual form - quantity: 2`);
          } else {
            console.log(`    No explicit quantity - defaulting to 1`);
          }

          totalQuantity += quantity;
        });

        console.log(`  Total quantity for "${menuItem.name}": ${totalQuantity}`);

        const existingItem = items.find(i => i.name === menuItem.name);
        if (existingItem) {
          existingItem.quantity += totalQuantity;
          console.log(`  Updated existing item to quantity: ${existingItem.quantity}`);
        } else {
          items.push({
            name: menuItem.name,
            nameAr: menuItem.nameAr,
            quantity: totalQuantity,
            price: menuItem.price,
          });
          console.log(`  Added new item with quantity: ${totalQuantity}`);
        }
      }
    });

    // CRITICAL FIX #2: If TOO MANY items matched (5+), it's likely a menu listing
    if (items.length >= 5) {
      console.log(`📋 Detected menu listing (${items.length} items matched) - skipping order parsing`);
      return [];
    }

    console.log("📦 Final parsed items:", items.map(i => `${i.name} x${i.quantity}`));
    return items;
  }, []);

  // 🔥 NEW FUNCTION: Parse structured order format from agent - ENHANCED VERSION
  const parseStructuredOrder = useCallback((transcript: string): OrderItem[] | null => {
    console.log("🔍🔍🔍 ATTEMPTING STRUCTURED PARSE ON:", transcript.substring(0, 200));

    // CRITICAL FIX: Capture everything UNTIL period (.) or question mark, NOT stopping at commas!
    // Arabic comma (،) is a SEPARATOR between items, not an end marker
    const patterns = [
      // Capture until . or ? but NOT ،
      /(?:طلبك|طلبك)\s*(?:هو|الآن|صار|كان)?\s*:+\s*(.+?)(?:[.؟?!]|\s*تحب|\s*في\s+حاجة|\s*حاجة\s+تانية|$)/is,
      /(?:الطلب)\s*(?:هو|الآن|صار)?\s*:+\s*(.+?)(?:[.؟?!]|\s*تحب|\s*في\s+حاجة|\s*حاجة\s+تانية|$)/is,
      /your\s+order\s+(?:is|now)?\s*:+\s*(.+?)(?:[.?!]|\s*would\s+you|\s*anything\s+else|$)/is,
    ];

    let orderText = '';
    let matchedPattern = -1;

    for (let i = 0; i < patterns.length; i++) {
      const match = transcript.match(patterns[i]);
      if (match && match[1]) {
        orderText = match[1].trim();
        matchedPattern = i;
        console.log(`✅ MATCHED PATTERN ${i + 1}, extracted:`, orderText);
        break;
      }
    }

    if (!orderText) {
      console.log("❌ No structured format found");
      return null; // No structured format found
    }

    console.log("🎯 FOUND STRUCTURED ORDER FORMAT:", orderText);
    console.log("📏 Order text length:", orderText.length, "characters");

    // Handle empty order case
    if (orderText.length < 3) {
      console.log("✅ Empty order detected (very short text)");
      return [];
    }

    const items: OrderItem[] = [];

    // SMART SPLITTING - respect brackets [] and don't split inside them
    console.log("🔪 Starting smart splitting process...");

    // Function to split by comma but respect brackets
    const smartSplit = (text: string): string[] => {
      const parts: string[] = [];
      let current = '';
      let bracketDepth = 0;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (char === '[') {
          bracketDepth++;
          current += char;
        } else if (char === ']') {
          bracketDepth--;
          current += char;
        } else if ((char === '،' || char === ',') && bracketDepth === 0) {
          // Only split on comma if we're not inside brackets
          if (current.trim()) {
            parts.push(current.trim());
          }
          current = '';
        } else {
          current += char;
        }
      }

      // Add the last part
      if (current.trim()) {
        parts.push(current.trim());
      }

      return parts;
    };

    // Use smart split
    let parts = smartSplit(orderText);
    console.log(`  📍 Smart split (respecting brackets): found ${parts.length} parts:`, parts);

    // Strategy 2: If no commas at all, try "و" or "and"
    if (parts.length === 1) {
      parts = orderText.split(/\s+و\s+|\s+and\s+/i);
      console.log(`  📍 Strategy 2 (و/and): found ${parts.length} parts:`, parts);
    }

    // Filter out empty parts
    parts = parts.filter(p => p && p.trim());
    console.log("🎯 FINAL SPLIT RESULT:", parts.length, "parts:", parts);

    for (const part of parts) {
      const trimmedPart = part.trim();
      if (!trimmedPart || trimmedPart.length < 2) continue;

      console.log("  📝 Parsing order part:", trimmedPart);

      // Extract quantity, item name, and customizations - ENHANCED
      let quantity = 1;
      let itemText = trimmedPart;
      let customizations: string[] = [];

      // Extract customizations from square brackets [بدون خس، زود طماطم]
      const customizationMatch = trimmedPart.match(/^(.+?)\s*\[([^\]]+)\](.*)$/);
      if (customizationMatch) {
        const beforeBracket = customizationMatch[1].trim();
        const insideBracket = customizationMatch[2].trim();

        // Parse customizations inside brackets
        customizations = insideBracket
          .split(/[,،]/)
          .map(c => c.trim())
          .filter(c => c.length > 0);

        console.log(`    🎨 Found customizations:`, customizations);

        // Continue parsing with text before bracket
        itemText = beforeBracket;
      }

      // Try to extract number at start
      const numberMatch = itemText.match(/^(\d+)\s+(.+)$/);
      if (numberMatch) {
        quantity = parseInt(numberMatch[1]);
        itemText = numberMatch[2].trim();
        console.log(`    Extracted quantity ${quantity}, item: "${itemText}"`);
      } else {
        console.log(`    No quantity found, defaulting to 1, item: "${itemText}"`);
      }

      // Find matching menu item - ULTRA FLEXIBLE MATCHING
      let menuItem = MENU_ITEMS.find(m => {
        const itemTextLower = itemText.toLowerCase();
        const itemTextClean = itemText.replace(/ال/g, '').toLowerCase().trim();

        // Try exact matches
        if (m.name.toLowerCase() === itemTextLower) return true;
        if (m.nameAr === itemText) return true;
        if (m.nameAr.replace(/ال/g, '').toLowerCase().trim() === itemTextClean) return true;

        // Try partial matches (contains)
        if (itemTextLower.includes(m.name.toLowerCase())) return true;
        if (m.name.toLowerCase().includes(itemTextLower)) return true;
        if (itemTextClean.includes(m.nameAr.replace(/ال/g, '').toLowerCase())) return true;
        if (m.nameAr.replace(/ال/g, '').toLowerCase().includes(itemTextClean)) return true;

        return false;
      });

      // FUZZY MATCHING as last resort
      if (!menuItem) {
        console.log(`    No exact match, trying fuzzy matching for: "${itemText}"`);
        const itemWords = itemText.toLowerCase().replace(/ال/g, '').split(/\s+/).filter(w => w.length > 1);

        menuItem = MENU_ITEMS.find(m => {
          const arWords = m.nameAr.toLowerCase().replace(/ال/g, '').split(/\s+/);
          const enWords = m.name.toLowerCase().split(/\s+/);

          // Check if ANY word from itemText matches ANY word from menu item
          return itemWords.some(iw =>
            arWords.some(aw => aw.includes(iw) || iw.includes(aw)) ||
            enWords.some(ew => ew.includes(iw) || iw.includes(ew))
          );
        });

        if (menuItem) {
          console.log(`    🎯 FUZZY MATCH SUCCESS: "${itemText}" -> "${menuItem.name}"`);
        }
      }

      if (menuItem) {
        console.log(`  ✅ MATCHED: ${menuItem.name} (${menuItem.nameAr}) x${quantity}`);
        if (customizations.length > 0) {
          console.log(`    with customizations:`, customizations);
        }

        // Check if item with same customizations already exists
        const existingItem = items.find(i =>
          i.name === menuItem!.name &&
          JSON.stringify(i.customizations || []) === JSON.stringify(customizations)
        );

        if (existingItem) {
          existingItem.quantity += quantity;
          console.log(`    Updated existing item to quantity: ${existingItem.quantity}`);
        } else {
          const newItem: OrderItem = {
            name: menuItem.name,
            nameAr: menuItem.nameAr,
            quantity: quantity,
            price: menuItem.price,
          };

          // Only add customizations if they exist
          if (customizations.length > 0) {
            newItem.customizations = customizations;
          }

          items.push(newItem);
        }
      } else {
        console.log(`  ❌ NO MATCH FOUND for: "${itemText}"`);
      }
    }

    console.log("✅✅✅ FINAL STRUCTURED PARSE RESULT:", items.map(i => {
      const customText = i.customizations && i.customizations.length > 0 ? ` [${i.customizations.join(', ')}]` : '';
      return `${i.name} x${i.quantity}${customText}`;
    }).join(', '));

    // Debug: Log full items with customizations
    items.forEach(item => {
      if (item.customizations && item.customizations.length > 0) {
        console.log(`  🎨 Item "${item.name}" has customizations:`, item.customizations);
      }
    });

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

        // DEBUG: Log items being sent to order complete with customizations
        console.log("📦 Items being sent to OrderDisplayScreen:");
        items.forEach((item, idx) => {
          console.log(`  [${idx}] ${item.name} x${item.quantity}`,
            item.customizations && item.customizations.length > 0
              ? `✨ customizations: [${item.customizations.join(', ')}]`
              : '(no customizations)');
        });

        shouldResetOrder = true;
        console.log("🔄 Set shouldResetOrder flag for next customer");

        // Call onOrderComplete to transition to display screen
        onOrderComplete({ items, total, language });
      }
    }

    // Parse order from agent messages (AFTER order completion check)
    if (speaker === 'agent') {
      console.log("🛒🛒🛒 PARSING ORDER FROM AGENT MESSAGE...");
      console.log("📝 Full agent message:", cleanText);

      // 🔥 PRIORITY 1: Try to parse STRUCTURED FORMAT first (most reliable)
      const structuredItems = parseStructuredOrder(cleanText);

      if (structuredItems !== null && structuredItems.length > 0) {
        console.log("🎯✅ STRUCTURED ORDER DETECTED - Using as single source of truth");
        console.log("🔄 REPLACING entire order with structured items:", structuredItems.map(i => {
          const customText = i.customizations && i.customizations.length > 0 ? ` [${i.customizations.join(', ')}]` : '';
          return `${i.name} x${i.quantity}${customText}`;
        }));

        currentOrderRef.current = structuredItems.map(item => ({...item}));

        // Debug: Verify customizations are in the ref
        console.log("🔍 Verifying currentOrderRef.current:");
        currentOrderRef.current.forEach((item, idx) => {
          console.log(`  [${idx}] ${item.name} x${item.quantity}`, item.customizations ? `- customizations: ${JSON.stringify(item.customizations)}` : '- no customizations');
        });

        if (onItemsUpdate) {
          console.log("📤 Calling onItemsUpdate with", currentOrderRef.current.length, "items");
          onItemsUpdate([...currentOrderRef.current]);
        }

        return;
      }

      // 🔥 SAFETY NET: Even if structured format was found but returned empty,
      // try aggressive full-text parsing to find ALL items mentioned
      if (structuredItems === null || structuredItems.length === 0) {
        console.log("⚠️ No structured items found or empty - trying AGGRESSIVE full-text parsing");

        // Parse the ENTIRE message for any item mentions
        const aggressiveItems = parseOrderFromTranscript(cleanText);

        if (aggressiveItems.length > 0) {
          console.log("🎯 AGGRESSIVE PARSING found items:", aggressiveItems.map(i => `${i.name} x${i.quantity}`));

          // If this looks like a complete order statement, replace everything
          const isOrderStatement = /طلبك|order|عندك|صار/i.test(cleanText);

          if (isOrderStatement) {
            console.log("🔄 Detected order statement - REPLACING entire order");
            currentOrderRef.current = aggressiveItems.map(item => ({...item}));
          } else {
            console.log("➕ Adding/updating items from aggressive parse");
            // Add or update items
            aggressiveItems.forEach(parsedItem => {
              const existingItem = currentOrderRef.current.find(item => item.name === parsedItem.name);
              if (existingItem) {
                existingItem.quantity = parsedItem.quantity;
                console.log(`  🔄 Updated ${parsedItem.name} to quantity: ${parsedItem.quantity}`);
              } else {
                currentOrderRef.current.push(parsedItem);
                console.log(`  ➕ Added new item: ${parsedItem.name} x${parsedItem.quantity}`);
              }
            });
          }

          if (onItemsUpdate) {
            onItemsUpdate([...currentOrderRef.current]);
          }

          return;
        }
      }

      // 🔥 FALLBACK 2: Deletion handling
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