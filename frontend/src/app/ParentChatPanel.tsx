import { MessageCircle, RefreshCcw, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  listConversations,
  listMessages,
  sendMessage,
  type ChatMessage,
  type ConversationSummary,
} from "../lib/chat";
import type { ParentChild, ParentClass } from "../lib/parent";

type ParentChatPanelProps = {
  token: string;
  child: ParentChild;
  classes?: ParentClass[];
};

function formatTime(value: string | null) {
  if (!value) return "Chưa có tin nhắn";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function conversationTitle(conversation: ConversationSummary) {
  if (conversation.conversation_type === "CLASS_GROUP") {
    return `Nhóm ${conversation.class_name ?? "lớp"}`;
  }
  return conversation.teacher_name;
}

export function ParentChatPanel({ token, child, classes = [] }: ParentChatPanelProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const childConversations = useMemo(() => {
    const classIds = new Set(classes.filter((item) => item.membership_status === "ACTIVE").map((item) => item.class_id));
    return conversations.filter(
      (conversation) =>
        conversation.child_id === child.id ||
        (conversation.conversation_type === "CLASS_GROUP" && conversation.class_id && classIds.has(conversation.class_id)),
    );
  }, [conversations, child.id, classes]);

  const selectedConversation = useMemo(
    () => childConversations.find((conversation) => conversation.id === selectedId) ?? childConversations[0] ?? null,
    [childConversations, selectedId],
  );

  async function loadConversations() {
    setError("");
    const result = await listConversations(token);
    setConversations(result);
    const classIds = new Set(classes.filter((item) => item.membership_status === "ACTIVE").map((item) => item.class_id));
    const next =
      result.find((conversation) => conversation.child_id === child.id) ??
      result.find((conversation) => conversation.conversation_type === "CLASS_GROUP" && conversation.class_id && classIds.has(conversation.class_id)) ??
      null;
    setSelectedId((current) => (current && result.some((item) => item.id === current) ? current : next?.id ?? null));
  }

  useEffect(() => {
    loadConversations().catch((requestError) =>
      setError(requestError instanceof Error ? requestError.message : "Không tải được hội thoại"),
    );
  }, [token, child.id, classes]);

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    setSelectedId(selectedConversation.id);
    listMessages(token, selectedConversation.id)
      .then(setMessages)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Không tải được tin nhắn"));
  }, [selectedConversation?.id, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedConversation?.id]);

  async function handleSend() {
    if (!selectedConversation || !draft.trim()) return;
    const body = draft.trim();
    setDraft("");
    setError("");
    try {
      const message = await sendMessage(token, selectedConversation.id, body);
      setMessages((current) => [...current, message]);
      await loadConversations();
    } catch (requestError) {
      setDraft(body);
      setError(requestError instanceof Error ? requestError.message : "Không gửi được tin nhắn");
    }
  }

  return (
    <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <MessageCircle size={20} className="text-[#1d73e8]" />
            Trao đổi với giáo viên
          </h3>
          <p className="mt-1 text-sm text-[#667085]">Trả lời hội thoại riêng hoặc nhóm lớp của giáo viên.</p>
        </div>
        <button
          onClick={() => loadConversations()}
          className="rounded-lg border border-[#d0d8e4] p-2 text-[#344054] hover:bg-[#f8fafc]"
          title="Tải lại"
        >
          <RefreshCcw size={15} />
        </button>
      </div>

      {error && <div className="mb-3 rounded-lg bg-[#fff4f3] p-3 text-sm font-semibold text-[#b42318]">{error}</div>}

      <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-2">
          {childConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedId(conversation.id)}
              className={`w-full rounded-lg border p-3 text-left transition ${
                selectedConversation?.id === conversation.id ? "border-[#1d73e8] bg-[#f2f7ff]" : "border-[#e4eaf2] hover:bg-[#f8fafc]"
              }`}
            >
              <div className="font-bold">{conversationTitle(conversation)}</div>
              <div className="mt-1 text-xs font-semibold text-[#667085]">
                {conversation.conversation_type === "CLASS_GROUP" ? "Nhóm lớp" : conversation.class_name ?? "Không gắn lớp"}
              </div>
              <div className="mt-2 line-clamp-2 text-xs text-[#667085]">
                {conversation.last_message ?? "Chưa có tin nhắn."}
              </div>
            </button>
          ))}
          {!childConversations.length && (
            <div className="rounded-lg bg-[#f8fafc] p-4 text-sm text-[#667085]">
              Chưa có hội thoại nào cho hồ sơ này.
            </div>
          )}
        </div>

        {selectedConversation ? (
          <div className="flex min-h-[420px] min-w-0 flex-col rounded-lg border border-[#e4eaf2]">
            <div className="border-b border-[#edf1f5] px-4 py-3">
              <div className="font-bold">{conversationTitle(selectedConversation)}</div>
              <div className="text-xs font-semibold text-[#667085]">
                {selectedConversation.class_name ?? "Không gắn lớp"} - {formatTime(selectedConversation.last_message_at)}
              </div>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f8fafc] p-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.is_mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      message.is_mine ? "rounded-br-md bg-[#12b76a] text-white" : "rounded-bl-md bg-white text-[#172033]"
                    }`}
                  >
                    <div className={`mb-1 text-xs font-bold ${message.is_mine ? "text-white/80" : "text-[#667085]"}`}>
                      {message.sender_name}
                    </div>
                    <div className="whitespace-pre-wrap">{message.body}</div>
                    <div className={`mt-2 text-right text-[11px] font-semibold ${message.is_mine ? "text-white/70" : "text-[#98a2b3]"}`}>
                      {formatTime(message.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="border-t border-[#edf1f5] p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  className="min-h-12 flex-1 rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
                  placeholder="Nhập phản hồi..."
                />
                <button
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1d73e8] px-4 text-sm font-bold text-white hover:bg-[#155dcc] disabled:opacity-50"
                >
                  <Send size={15} />
                  Gửi
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-[#f8fafc] p-8 text-center text-sm text-[#667085]">
            Chọn một hội thoại để xem tin nhắn.
          </div>
        )}
      </div>
    </section>
  );
}
