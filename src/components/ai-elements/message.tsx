'use client';

import { cn } from '@/lib/utils';

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
        'max-w-[90%] rounded-3xl px-6 py-4 font-bold leading-relaxed',
        'shadow-lg transition-all duration-300',
        from === 'user'
          ? 'bg-gray-100 text-gray-900 justify-self-end shadow-sm text-xl'
          : 'bg-purple-400/20 text-purple-100 border border-purple-400/30 justify-self-end backdrop-blur-sm text-xl',
        className
      )}
    >
      {children}
    </div>
  );
}

interface MessageAvatarProps {
  name: string;
  src?: string;
  className?: string;
}

export function MessageAvatar({ name, src, className }: MessageAvatarProps) {
  return (
    <div
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
        'bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-medium',
        'shadow-sm',
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span>{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}