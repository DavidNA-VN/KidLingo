import { apiRequest } from "./api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export type ConversationSummary = {
  id: string;
  conversation_type: "DIRECT" | "CLASS_GROUP";
  teacher_id: string;
  teacher_name: string;
  parent_id: string | null;
  parent_name: string | null;
  parent_email: string | null;
  class_id: string | null;
  class_name: string | null;
  child_id: string | null;
  child_name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: "TEACHER" | "PARENT";
  body: string;
  read_at: string | null;
  created_at: string;
  is_mine: boolean;
};

export type ClassGroupMember = {
  child_id: string;
  child_name: string;
  parent_id: string;
  parent_name: string;
  parent_email: string;
  membership_status: string;
};

export type ClassGroupMembersResponse = {
  conversation_id: string;
  class_id: string;
  class_name: string;
  members: ClassGroupMember[];
};

export function listConversations(token: string): Promise<ConversationSummary[]> {
  return apiRequest<ConversationSummary[]>("/chat/conversations", { token });
}

export function createConversation(
  token: string,
  payload: {
    parent_id: string;
    class_id?: string;
    child_id?: string;
    context_message?: string;
  },
): Promise<ConversationSummary> {
  return apiRequest<ConversationSummary>("/chat/conversations", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function createClassGroupConversation(
  token: string,
  payload: {
    class_id: string;
    context_message?: string;
  },
): Promise<ConversationSummary> {
  return apiRequest<ConversationSummary>("/chat/class-groups", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function listMessages(token: string, conversationId: string): Promise<ChatMessage[]> {
  return apiRequest<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`, { token });
}

export function listClassGroupMembers(token: string, conversationId: string): Promise<ClassGroupMembersResponse> {
  return apiRequest<ClassGroupMembersResponse>(`/chat/conversations/${conversationId}/members`, { token });
}

export function sendMessage(token: string, conversationId: string, body: string): Promise<ChatMessage> {
  return apiRequest<ChatMessage>(`/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    token,
    body: JSON.stringify({ body }),
  });
}

export function getConversationWebSocketUrl(conversationId: string, token: string) {
  const root = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  const wsRoot = root.replace(/^http/, "ws");
  return `${wsRoot}/ws/conversations/${conversationId}?token=${encodeURIComponent(token)}`;
}
