'use client';

import { updateChatVisibility } from '@/app/(chat)/actions';
import { VisibilityType } from '@/components/visibility-selector';
import { Chat } from '@/lib/db/schema';
import { useMemo, useEffect } from 'react';
import useSWR, { useSWRConfig } from 'swr';

// Local storage key for chat visibility
const VISIBILITY_STORAGE_KEY = (chatId: string) => `yc_chat_visibility_${chatId}`;

export function useChatVisibility({
  chatId,
  initialVisibility,
}: {
  chatId: string;
  initialVisibility: VisibilityType;
}) {
  const { mutate, cache } = useSWRConfig();
  const history: Array<Chat> = cache.get('/api/history')?.data;

  // Initialize with value from localStorage if available
  const getInitialVisibility = (): VisibilityType => {
    if (typeof window === 'undefined') return initialVisibility;
    
    try {
      const savedVisibility = localStorage.getItem(VISIBILITY_STORAGE_KEY(chatId));
      if (savedVisibility) {
        return savedVisibility as VisibilityType;
      }
    } catch (e) {
      console.error('Error loading visibility from localStorage:', e);
    }
    
    return initialVisibility;
  };

  const { data: localVisibility, mutate: setLocalVisibility } = useSWR(
    `${chatId}-visibility`,
    null,
    {
      fallbackData: getInitialVisibility(),
    },
  );

  // Save visibility to localStorage when it changes
  useEffect(() => {
    if (typeof window === 'undefined' || !localVisibility) return;
    
    try {
      localStorage.setItem(VISIBILITY_STORAGE_KEY(chatId), localVisibility);
    } catch (e) {
      console.error('Error saving visibility to localStorage:', e);
    }
  }, [chatId, localVisibility]);

  const visibilityType = useMemo(() => {
    if (!history) return localVisibility;
    const chat = history.find((chat) => chat.id === chatId);
    if (!chat) return 'private';
    return chat.visibility;
  }, [history, chatId, localVisibility]);

  const setVisibilityType = (updatedVisibilityType: VisibilityType) => {
    setLocalVisibility(updatedVisibilityType);

    // Also update localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(VISIBILITY_STORAGE_KEY(chatId), updatedVisibilityType);
      } catch (e) {
        console.error('Error saving visibility to localStorage:', e);
      }
    }

    mutate<Array<Chat>>(
      '/api/history',
      (history) => {
        return history
          ? history.map((chat) => {
              if (chat.id === chatId) {
                return {
                  ...chat,
                  visibility: updatedVisibilityType,
                };
              }
              return chat;
            })
          : [];
      },
      { revalidate: false },
    );

    updateChatVisibility({
      chatId: chatId,
      visibility: updatedVisibilityType,
    });
  };

  return { visibilityType, setVisibilityType };
}
