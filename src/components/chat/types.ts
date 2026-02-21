export interface Attachment {
  id: string;
  name: string;
  type: "image" | "text" | "pdf";
  data: string;
  preview?: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  reasoning_details?: unknown;
  reasoning_content?: string;
  attachments?: Attachment[];
  images?: string[];
}
