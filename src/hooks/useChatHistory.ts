import { useState, useCallback, useEffect } from "react";
import type { Message } from "@/components/chat/types";

const STORAGE_KEY = "lovhub_chat_history";
const MAX_HISTORY = 100;

export function useChatHistory() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });

  // Persist on change
  useEffect(() => {
    try {
      const toSave = messages.slice(-MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch { /* quota exceeded, ignore */ }
  }, [messages]);

  const addMessage = useCallback((msg: Message) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const updateLastMessage = useCallback((updater: (msg: Message) => Message) => {
    setMessages(prev => {
      if (prev.length === 0) return prev;
      const newMsgs = [...prev];
      newMsgs[newMsgs.length - 1] = updater(newMsgs[newMsgs.length - 1]);
      return newMsgs;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { messages, setMessages, addMessage, updateLastMessage, clearHistory };
}
