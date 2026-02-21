
-- Chat conversations (anonymous, identified by device_id)
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nova conversa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL DEFAULT '',
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_chat_conversations_device ON public.chat_conversations(device_id);
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id);

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for anonymous access (device_id filtering happens client-side)
CREATE POLICY "Anon can read conversations"
  ON public.chat_conversations FOR SELECT
  USING (true);

CREATE POLICY "Anon can insert conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anon can update conversations"
  ON public.chat_conversations FOR UPDATE
  USING (true);

CREATE POLICY "Anon can delete conversations"
  ON public.chat_conversations FOR DELETE
  USING (true);

CREATE POLICY "Anon can read messages"
  ON public.chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Anon can insert messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anon can delete messages"
  ON public.chat_messages FOR DELETE
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
