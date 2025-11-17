'use client';

import { cn } from '@/lib/utils';

interface ConversationProps {
  children: React.ReactNode;
  className?: string;
}

export function Conversation({ children, className }: ConversationProps) {
  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col overflow-hidden',
        'bg-transparent',
        className
      )}
    >
      {children}
    </div>
  );
}

interface ConversationContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ConversationContent({ children, className }: ConversationContentProps) {
  return (
    <div className="relative flex-1 overflow-hidden">
      {children}
    </div>
  );
}

interface ConversationEmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function ConversationEmptyState({
  icon,
  title = "No messages yet",
  description = "Start a conversation to see messages here.",
  className
}: ConversationEmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-1 flex-col items-center justify-center gap-4 text-center',
      'text-gray-400',
      className
    )}>
      {icon && (
        <div className="rounded-full bg-gray-800/50 p-4">
          {icon}
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-300">{title}</h3>
        <p className="text-sm text-gray-500 max-w-sm">{description}</p>
      </div>
    </div>
  );
}