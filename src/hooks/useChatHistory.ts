import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Message } from "@/components/chat/types";

const DEVICE_KEY = "lovhub_device_id";
const CONV_KEY = "lovhub_active_conversation";

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useChatHistory() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    () => localStorage.getItem(CONV_KEY)
  );
  const [loading, setLoading] = useState(false);
  const deviceId = useRef(getDeviceId());
  const savingRef = useRef(false);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from("chat_conversations")
      .select("id, title, created_at, updated_at")
      .eq("device_id", deviceId.current)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (data) setConversations(data);
  }, []);

  // Load messages for active conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        attachments: m.attachments ? (m.attachments as any) : undefined,
      })));
    }
    setLoading(false);
  }, []);

  // Init: load conversations, then load active
  useEffect(() => {
    loadConversations().then(() => {
      if (activeConversationId) {
        loadMessages(activeConversationId);
      }
    });
  }, []);

  // Switch conversation
  const switchConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
    localStorage.setItem(CONV_KEY, id);
    await loadMessages(id);
  }, [loadMessages]);

  // Create new conversation
  const newConversation = useCallback(async (title?: string) => {
    const { data } = await supabase
      .from("chat_conversations")
      .insert({ device_id: deviceId.current, title: title || "Nova conversa" })
      .select("id, title, created_at, updated_at")
      .single();
    if (data) {
      setConversations(prev => [data, ...prev]);
      setActiveConversationId(data.id);
      localStorage.setItem(CONV_KEY, data.id);
      setMessages([]);
      return data.id;
    }
    return null;
  }, []);

  // Save a message to DB
  const saveMessage = useCallback(async (msg: Message, conversationId: string) => {
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      role: msg.role,
      content: msg.content,
      attachments: msg.attachments ? JSON.parse(JSON.stringify(
        msg.attachments.map(a => ({ id: a.id, name: a.name, type: a.type }))
      )) : null,
    });
    // Update conversation title from first user message
    if (msg.role === "user" && messages.length === 0) {
      const title = msg.content.slice(0, 80) || "Nova conversa";
      await supabase
        .from("chat_conversations")
        .update({ title })
        .eq("id", conversationId);
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, title } : c));
    }
  }, [messages.length]);

  // Add message (creates conversation if needed)
  const addMessage = useCallback(async (msg: Message) => {
    setMessages(prev => [...prev, msg]);
    let convId = activeConversationId;
    if (!convId) {
      convId = await newConversation(msg.role === "user" ? msg.content.slice(0, 80) : undefined);
    }
    if (convId) {
      await saveMessage(msg, convId);
    }
  }, [activeConversationId, newConversation, saveMessage]);

  // Update last message (for streaming)
  const updateLastMessage = useCallback((updater: (msg: Message) => Message) => {
    setMessages(prev => {
      if (prev.length === 0) return prev;
      const newMsgs = [...prev];
      newMsgs[newMsgs.length - 1] = updater(newMsgs[newMsgs.length - 1]);
      return newMsgs;
    });
  }, []);

  // Save final assistant message after streaming completes
  const saveLastAssistantMessage = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    const convId = activeConversationId;
    if (!convId) { savingRef.current = false; return; }

    // Get latest messages state
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && last.content) {
        supabase.from("chat_messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: last.content,
        }).then(() => { savingRef.current = false; });
      } else {
        savingRef.current = false;
      }
      return prev;
    });
  }, [activeConversationId]);

  // Clear history
  const clearHistory = useCallback(async () => {
    if (activeConversationId) {
      await supabase.from("chat_conversations").delete().eq("id", activeConversationId);
      setConversations(prev => prev.filter(c => c.id !== activeConversationId));
    }
    setMessages([]);
    setActiveConversationId(null);
    localStorage.removeItem(CONV_KEY);
  }, [activeConversationId]);

  // Delete a specific conversation
  const deleteConversation = useCallback(async (id: string) => {
    await supabase.from("chat_conversations").delete().eq("id", id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setMessages([]);
      setActiveConversationId(null);
      localStorage.removeItem(CONV_KEY);
    }
  }, [activeConversationId]);

  return {
    messages,
    setMessages,
    conversations,
    activeConversationId,
    loading,
    addMessage,
    updateLastMessage,
    saveLastAssistantMessage,
    clearHistory,
    newConversation,
    switchConversation,
    deleteConversation,
    loadConversations,
  };
}
