'use client';

import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface MessageProps {
  children: React.ReactNode;
  from: 'user' | 'assistant';
  className?: string;
}

export function Message({ children, from, className }: MessageProps) {
  return (
    <div
      className={cn(
        'flex w-full gap-3 p-4 transition-all duration-300',
        from === 'assistant' ? 'flex-row-reverse justify-end' : 'flex-row justify-end',
        className
      )}
    >
      {children}
    </div>
  );
}

interface MessageContentProps {
  children: React.ReactNode;
  from: 'user' | 'assistant';
  className?: string;
}

export function MessageContent({ children, from, className }: MessageContentProps) {
  return (
    <div
      className={cn(
        'max-w-[90%] rounded-2xl px-5 py-3.5 font-medium leading-relaxed transition-all duration-300',
        from === 'user'
          ? 'bg-gray-800/50 text-white justify-self-end text-lg border border-white/10'
          : 'bg-blue-900/50 text-blue-100 justify-self-end text-lg border border-blue-300/10',
        className
      )}
    >
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

interface MessageAvatarProps {
  name: string;
  src?: string;
  className?: string;
}

export function MessageAvatar({ name, src, className }: MessageAvatarProps) {
  const isAssistant = name === 'المساعد' || name.toLowerCase().includes('assistant');

  // Use custom AI image for assistant
  const aiAssistantImage = isAssistant ? '/icons/ai-assistant-icon.png' : undefined;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-2xl transition-all duration-300',
        isAssistant
          ? 'h-14 w-14 bg-gradient-to-br from-gray-100 to-gray-50 text-gray-700 shadow-lg border border-gray-200/50 relative overflow-hidden'
          : 'h-14 w-14 bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium shadow-lg',
        className
      )}
    >
      {/* Premium effect for AI avatar */}
      {isAssistant && (
        <>
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent rounded-2xl" />

          {/* Glass effect overlay */}
          <div className="absolute inset-0 backdrop-blur-sm rounded-2xl" />

          {/* Subtle shadow ring */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-300/20 via-gray-400/20 to-gray-300/20 rounded-2xl blur-sm" />
        </>
      )}

      {/* Avatar content */}
      <div className="relative z-10">
        {src ? (
          <img
            src={src}
            alt={name}
            className="h-full w-full rounded-2xl object-cover"
          />
        ) : isAssistant && aiAssistantImage ? (
          <img
            src={aiAssistantImage}
            alt={name}
            className="h-full w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full">
            {isAssistant ? (
              <Bot className="h-7 w-7 text-gray-700" />
            ) : (
              <User className="h-7 w-7 text-white" />
            )}
          </div>
        )}
      </div>

      {/* AI indicator dot for assistant */}
      {isAssistant && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-green-500 rounded-full shadow-sm border-2 border-white" />
      )}
    </div>
  );
}