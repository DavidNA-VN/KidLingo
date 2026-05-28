import { MessageCircle, Plus, RefreshCcw, Send, UsersRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { getStoredToken } from "../lib/auth";
import {
  createClassGroupConversation,
  createConversation,
  getConversationWebSocketUrl,
  listClassGroupMembers,
  listConversations,
  listMessages,
  sendMessage,
  type ChatMessage,
  type ClassGroupMember,
  type ConversationSummary,
} from "../lib/chat";
import { getTeacherClassDetail, type RosterChild, type TeacherClassSummary } from "../lib/teacher";

type TeacherChatProps = {
  classes: TeacherClassSummary[];
  selectedClassId?: string | null;
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

function senderLabel(role: string) {
  return role === "TEACHER" ? "Giáo viên" : "Phụ huynh";
}

function conversationTitle(conversation: ConversationSummary) {
  if (conversation.conversation_type === "CLASS_GROUP") {
    return `Nhóm ${conversation.class_name ?? "lớp"}`;
  }
  return conversation.parent_name ?? "Phụ huynh";
}

export function TeacherChat({ classes, selectedClassId: classContextId }: TeacherChatProps) {
  const token = getStoredToken();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"CLASS_GROUP" | "DIRECT">("CLASS_GROUP");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roster, setRoster] = useState<RosterChild[]>([]);
  const [groupMembers, setGroupMembers] = useState<ClassGroupMember[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [contextMessage, setContextMessage] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const selectedClassId = classContextId ?? classes[0]?.id ?? "";
  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedId) ?? null,
    [conversations, selectedId],
  );
  const visibleConversations = useMemo(
    () =>
      conversations.filter(
        (conversation) =>
          conversation.conversation_type === mode &&
          (!selectedClassId || conversation.class_id === selectedClassId || conversation.class_id === null),
      ),
    [conversations, mode, selectedClassId],
  );
  const selectedChild = useMemo(
    () => roster.find((child) => child.id === selectedChildId) ?? null,
    [roster, selectedChildId],
  );
  const hasActiveStudents = roster.length > 0;

  async function loadConversations(selectFirst = false) {
    if (!token) return;
    setError("");
    const result = await listConversations(token);
    setConversations(result);
    if (selectFirst || !selectedId || !result.some((item) => item.id === selectedId)) {
      const next =
        result.find(
          (conversation) =>
            conversation.conversation_type === mode &&
            (!selectedClassId || conversation.class_id === selectedClassId || conversation.class_id === null),
        ) ?? null;
      setSelectedId(next?.id ?? null);
    }
  }

  async function loadRoster(classId: string) {
    if (!token || !classId) return;
    const detail = await getTeacherClassDetail(token, classId);
    const activeRoster = detail.roster.filter((child) => child.membership_status === "ACTIVE");
    setRoster(activeRoster);
    setSelectedChildId(activeRoster[0]?.id ?? "");
  }

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    loadConversations(true)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Không tải được hội thoại"))
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    if (!selectedClassId) return;
    loadRoster(selectedClassId).catch((requestError) =>
      setError(requestError instanceof Error ? requestError.message : "Không tải được danh sách học sinh"),
    );
  }, [selectedClassId, token]);

  useEffect(() => {
    const currentIsVisible = visibleConversations.some((conversation) => conversation.id === selectedId);
    if (!currentIsVisible) {
      setSelectedId(visibleConversations[0]?.id ?? null);
    }
  }, [selectedClassId, mode, selectedId, visibleConversations]);

  useEffect(() => {
    if (!selectedId || !token) {
      setMessages([]);
      return;
    }
    listMessages(token, selectedId)
      .then(setMessages)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Không tải được tin nhắn"));

    socketRef.current?.close();
    const socket = new WebSocket(getConversationWebSocketUrl(selectedId, token));
    socketRef.current = socket;
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as ChatMessage;
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
      loadConversations().catch(() => undefined);
    };
    socket.onerror = () => socket.close();
    return () => socket.close();
  }, [selectedId, token]);

  useEffect(() => {
    if (!token || !selectedConversation || selectedConversation.conversation_type !== "CLASS_GROUP") {
      setGroupMembers([]);
      return;
    }
    listClassGroupMembers(token, selectedConversation.id)
      .then((response) => setGroupMembers(response.members))
      .catch(() => setGroupMembers([]));
  }, [selectedConversation?.id, selectedConversation?.conversation_type, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedId]);

  async function handleCreateClassGroup() {
    if (!token || !selectedClassId || !hasActiveStudents) return;
    setError("");
    setNotice("");
    try {
      const conversation = await createClassGroupConversation(token, {
        class_id: selectedClassId,
        context_message:
          contextMessage.trim() ||
          `Thông báo chung cho phụ huynh lớp ${selectedClass?.name ?? ""}.`,
      });
      await loadConversations();
      setMode("CLASS_GROUP");
      setSelectedId(conversation.id);
      setContextMessage("");
      setNotice("Đã mở nhóm lớp.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không tạo được nhóm lớp");
    }
  }

  async function handleCreateDirectConversation() {
    if (!token || !selectedChild) return;
    setError("");
    setNotice("");
    try {
      const conversation = await createConversation(token, {
        parent_id: selectedChild.parent.id,
        class_id: selectedClassId,
        child_id: selectedChild.id,
        context_message:
          contextMessage.trim() ||
          `Trao đổi về tình hình học tập của ${selectedChild.display_name} trong lớp ${
            selectedClass?.name ?? ""
          }.`,
      });
      await loadConversations();
      setMode("DIRECT");
      setSelectedId(conversation.id);
      setContextMessage("");
      setNotice("Đã mở hội thoại với phụ huynh.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không tạo được hội thoại");
    }
  }

  async function handleSend() {
    if (!token || !selectedId || !draft.trim()) return;
    const body = draft.trim();
    setDraft("");
    setError("");
    try {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(body);
      } else {
        const message = await sendMessage(token, selectedId, body);
        setMessages((current) => [...current, message]);
        await loadConversations();
      }
    } catch (requestError) {
      setDraft(body);
      setError(requestError instanceof Error ? requestError.message : "Không gửi được tin nhắn");
    }
  }

  return (
    <section className="grid min-w-0 gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Trao đổi phụ huynh</h2>
              <p className="text-sm text-[#667085]">Lớp lấy theo ngữ cảnh lớp ở đầu trang.</p>
            </div>
            <MessageCircle className="text-[#1d73e8]" size={22} />
          </div>
          <div className="grid gap-3">
            <div className="rounded-lg border border-[#d0d8e4] bg-[#f8fafc] px-3 py-2">
              <div className="text-xs font-bold uppercase tracking-wide text-[#667085]">Lớp đang chọn</div>
              <div className="mt-1 text-sm font-bold text-[#172033]">
                {selectedClass ? `${selectedClass.name} · ${selectedClass.class_code ?? "Chưa có mã"}` : "Chưa chọn lớp"}
              </div>
            </div>
            {hasActiveStudents ? (
              <select
                value={selectedChildId}
                onChange={(event) => setSelectedChildId(event.target.value)}
                className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
              >
                {roster.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.display_name} - {child.parent.full_name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-lg border border-[#fedf89] bg-[#fffaeb] px-3 py-3 text-sm font-semibold text-[#b54708]">
                Lớp này chưa có học sinh active nên chưa thể mở nhóm lớp hoặc trao đổi với phụ huynh.
              </div>
            )}
            <textarea
              value={contextMessage}
              onChange={(event) => setContextMessage(event.target.value)}
              className="min-h-20 rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
              placeholder="Tin nhắn mở đầu..."
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                onClick={handleCreateClassGroup}
                disabled={!selectedClassId || !hasActiveStudents}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#12b76a] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0f9f5f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UsersRound size={16} />
                Mở nhóm lớp
              </button>
              <button
                onClick={handleCreateDirectConversation}
                disabled={!selectedChild}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1d73e8] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#155dcc] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={16} />
                Mở riêng
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#dfe6ef] bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between px-2 py-1">
            <h3 className="font-bold">Danh sách hội thoại</h3>
            <button
              onClick={() => loadConversations()}
              className="rounded-lg border border-[#d0d8e4] p-2 text-[#344054] hover:bg-[#f8fafc]"
              title="Tải lại"
            >
              <RefreshCcw size={15} />
            </button>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2 px-2">
            {[
              { key: "CLASS_GROUP" as const, label: "Nhóm lớp" },
              { key: "DIRECT" as const, label: "Phụ huynh" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setMode(item.key);
                  const next = conversations.find(
                    (conversation) =>
                      conversation.conversation_type === item.key &&
                      (!selectedClassId || conversation.class_id === selectedClassId || conversation.class_id === null),
                  );
                  setSelectedId(next?.id ?? null);
                }}
                className={`rounded-lg border px-3 py-2 text-sm font-bold ${
                  mode === item.key ? "border-[#1d73e8] bg-[#f2f7ff] text-[#155dcc]" : "border-[#d0d8e4] text-[#344054]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {visibleConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedId(conversation.id)}
                className={`w-full rounded-lg border p-4 text-left transition ${
                  selectedId === conversation.id ? "border-[#1d73e8] bg-[#f2f7ff]" : "border-[#e4eaf2] hover:bg-[#f8fafc]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-bold">{conversationTitle(conversation)}</div>
                    <div className="mt-1 truncate text-xs font-semibold text-[#667085]">
                      {conversation.conversation_type === "CLASS_GROUP"
                        ? "Thông báo chung cho phụ huynh"
                        : `${conversation.child_name ?? "Không gắn học sinh"} - ${conversation.class_name ?? "Không gắn lớp"}`}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#edf4ff] px-2 py-1 text-xs font-bold text-[#155dcc]">
                    {conversation.message_count}
                  </span>
                </div>
                <div className="mt-3 line-clamp-2 text-sm text-[#667085]">
                  {conversation.last_message ?? "Chưa có nội dung trao đổi."}
                </div>
                <div className="mt-2 text-xs font-semibold text-[#98a2b3]">{formatTime(conversation.last_message_at)}</div>
              </button>
            ))}
            {isLoading && <div className="rounded-lg bg-[#f8fafc] p-4 text-sm text-[#667085]">Đang tải hội thoại...</div>}
            {!isLoading && !visibleConversations.length && (
              <div className="rounded-lg bg-[#f8fafc] p-4 text-sm text-[#667085]">
                {!hasActiveStudents
                  ? "Lớp này chưa có học sinh nên chưa có nhóm chat hoặc hội thoại phụ huynh."
                  : mode === "CLASS_GROUP"
                    ? "Chưa có nhóm chat cho lớp đang chọn. Bạn có thể mở nhóm lớp khi cần gửi thông báo chung."
                    : "Chưa có hội thoại riêng trong lớp đang chọn."}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        {(error || notice) && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              error ? "border-[#fecdca] bg-[#fff4f3] text-[#b42318]" : "border-[#abefc6] bg-[#f0fdf4] text-[#067647]"
            }`}
          >
            {error || notice}
          </div>
        )}

        {selectedConversation ? (
          <section className="flex min-h-[680px] min-w-0 flex-col rounded-xl border border-[#dfe6ef] bg-white shadow-sm">
            <div className="border-b border-[#edf1f5] px-5 py-4">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <h2 className="text-xl font-bold">{conversationTitle(selectedConversation)}</h2>
                  <p className="mt-1 text-sm text-[#667085]">
                    {selectedConversation.conversation_type === "CLASS_GROUP"
                      ? "Trao đổi chung với phụ huynh trong lớp"
                      : selectedConversation.parent_email}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-bold text-[#344054]">
                  <span className="rounded-full bg-[#f2f7ff] px-3 py-1.5">{selectedConversation.class_name ?? "Không gắn lớp"}</span>
                  <span className="rounded-full bg-[#f8fafc] px-3 py-1.5">
                    {selectedConversation.conversation_type === "CLASS_GROUP"
                      ? "Nhóm lớp"
                      : selectedConversation.child_name ?? "Không gắn học sinh"}
                  </span>
                </div>
              </div>
              {selectedConversation.conversation_type === "CLASS_GROUP" && (
                <div className="mt-4 rounded-lg border border-[#e4eaf2] bg-[#f8fafc] p-3">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[#667085]">
                    Phụ huynh trong nhóm ({groupMembers.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupMembers.map((member) => (
                      <span
                        key={`${member.child_id}-${member.parent_id}`}
                        className="rounded-full border border-[#d0d8e4] bg-white px-3 py-1.5 text-xs font-semibold text-[#344054]"
                        title={member.parent_email}
                      >
                        {member.child_name} - {member.parent_name}
                      </span>
                    ))}
                    {!groupMembers.length && <span className="text-sm text-[#667085]">Chưa có phụ huynh active trong lớp.</span>}
                  </div>
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f8fafc] px-5 py-5">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.is_mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                      message.is_mine ? "rounded-br-md bg-[#1d73e8] text-white" : "rounded-bl-md bg-white text-[#172033]"
                    }`}
                  >
                    <div className={`mb-1 text-xs font-bold ${message.is_mine ? "text-white/80" : "text-[#667085]"}`}>
                      {message.sender_name} - {senderLabel(message.sender_role)}
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-6">{message.body}</div>
                    <div className={`mt-2 text-right text-[11px] font-semibold ${message.is_mine ? "text-white/70" : "text-[#98a2b3]"}`}>
                      {formatTime(message.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              {!messages.length && (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#d0d8e4] bg-white p-8 text-center text-sm text-[#667085]">
                  Hội thoại chưa có tin nhắn.
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-[#edf1f5] p-4">
              <div className="flex items-end gap-3">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  className="min-h-16 flex-1 rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
                  placeholder="Nhập tin nhắn..."
                />
                <button
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#1d73e8] px-4 text-sm font-bold text-white transition hover:bg-[#155dcc] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={16} />
                  Gửi
                </button>
              </div>
            </div>
          </section>
        ) : (
          <div className="rounded-xl border border-[#dfe6ef] bg-white p-10 text-center text-[#667085] shadow-sm">
            <UsersRound className="mx-auto mb-3 text-[#98a2b3]" size={32} />
            {!hasActiveStudents
              ? "Lớp đang chọn chưa có học sinh, nên chưa có group chat phụ huynh."
              : "Chọn hoặc mở một hội thoại trong lớp đang chọn."}
          </div>
        )}
      </div>
    </section>
  );
}
