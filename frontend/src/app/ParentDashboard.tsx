import {
  Archive,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Coins,
  FileText,
  Link,
  LogOut,
  MessageSquareText,
  PlayCircle,
  Plus,
  Sparkles,
  Star,
  TrendingUp,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ChildLearningSession } from "./ChildLearningSession";
import { ParentChatPanel } from "./ParentChatPanel";
import { ParentProgressPanel } from "./ParentProgressPanel";
import type { AuthUser } from "../lib/auth";
import { getStoredToken } from "../lib/auth";
import {
  createParentChild,
  getChildAssignmentDetail,
  joinClassByCode,
  listChildAssignments,
  listChildClasses,
  listParentChildren,
  updateParentChild,
  uploadAssignmentSubmissionFile,
  type LessonMaterial,
  type ParentAssignment,
  type ParentAssignmentDetail,
  type ParentChild,
  type ParentClass,
} from "../lib/parent";

type ParentDashboardProps = {
  user: AuthUser;
  onLogout: () => void;
};

type ParentSection = "profiles" | "progress" | "chat" | "classes";

const navItems: Array<{ key: ParentSection; label: string; icon: typeof UserRound }> = [
  { key: "profiles", label: "Hồ sơ của con", icon: UserRound },
  { key: "progress", label: "Tiến độ học tập", icon: TrendingUp },
  { key: "chat", label: "Trao đổi giáo viên", icon: MessageSquareText },
  { key: "classes", label: "Lớp đang học", icon: UsersRound },
];

function formatDate(value: string | null) {
  if (!value) return "Chưa có hạn";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(value),
  );
}

function ageFromBirthYear(value: number | null) {
  if (!value) return null;
  return new Date().getFullYear() - value;
}

function materialLabel(type: string) {
  const labels: Record<string, string> = {
    PDF: "PDF",
    YOUTUBE_VIDEO: "Video",
    SPEAKING_PROMPT: "Luyện nói",
    DOODLE_VOCAB: "Doodle",
    NOTE: "Ghi chú",
  };
  return labels[type] ?? type;
}

function assignmentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PUBLISHED: "Đang mở",
    CLOSED: "Đã đóng",
  };
  return labels[status] ?? status;
}

function getFriendlyJoinClassError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "CLASS_CODE_NOT_FOUND" || message.includes("404")) {
    return "Mã lớp chưa đúng. Vui lòng kiểm tra lại mã giáo viên đã gửi.";
  }
  if (!message || message === "Request failed" || message.includes("Failed to fetch")) {
    return "Chưa kết nối được máy chủ. Vui lòng thử lại sau.";
  }
  return "Chưa thể tham gia lớp. Vui lòng kiểm tra mã lớp và thử lại.";
}

function MaterialCard({ material }: { material: LessonMaterial }) {
  return (
    <div className="rounded-lg border border-[#e4eaf2] bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="rounded-full bg-[#edf4ff] px-2.5 py-1 text-xs font-bold text-[#155dcc]">
          {materialLabel(material.type)}
        </span>
        {material.file_url && (
          <a
            href={`http://localhost:8000${material.file_url}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-[#d0d8e4] px-2.5 py-1.5 text-xs font-bold text-[#344054] hover:bg-[#f8fafc]"
          >
            <FileText size={14} />
            Mở PDF
          </a>
        )}
      </div>
      <h4 className="font-bold text-[#172033]">{material.title}</h4>
      {material.description && <p className="mt-1 text-sm text-[#667085]">{material.description}</p>}
      {material.youtube_video_id && (
        <div className="mt-3 aspect-video overflow-hidden rounded-lg bg-black">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${material.youtube_video_id}`}
            title={material.title}
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}

function ChildSelector({
  children,
  selectedChildId,
  onSelect,
}: {
  children: ParentChild[];
  selectedChildId: string | null;
  onSelect: (childId: string) => void;
}) {
  const activeChildren = children.filter((child) => child.status === "ACTIVE");
  if (!activeChildren.length) {
    return (
      <div className="rounded-lg border border-[#fedf89] bg-[#fffaeb] px-4 py-3 text-sm font-semibold text-[#b54708]">
        Tạo hồ sơ con trước khi xem dữ liệu học tập.
      </div>
    );
  }
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-[#667085]">Chọn con</span>
      <select
        value={selectedChildId ?? ""}
        onChange={(event) => onSelect(event.target.value)}
        className="mt-1 w-full rounded-lg border border-[#d0d8e4] bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-[#12b76a]"
      >
        {activeChildren.map((child) => (
          <option key={child.id} value={child.id}>
            {child.display_name}
            {child.nickname ? ` (${child.nickname})` : ""}
            {child.birth_year ? ` - ${child.birth_year}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function ParentChildProfilesPage({
  children,
  selectedChild,
  selectedChildId,
  onSelectChild,
  onCreateChild,
  onUpdateChild,
}: {
  children: ParentChild[];
  selectedChild: ParentChild | null;
  selectedChildId: string | null;
  onSelectChild: (childId: string) => void;
  onCreateChild: (payload: {
    display_name: string;
    birth_year: number;
    nickname?: string | null;
    avatar_url?: string | null;
    profile_note?: string | null;
  }) => Promise<void>;
  onUpdateChild: (
    childId: string,
    payload: {
      display_name?: string;
      birth_year?: number | null;
      nickname?: string | null;
      avatar_url?: string | null;
      profile_note?: string | null;
      status?: "ACTIVE" | "ARCHIVED";
    },
  ) => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileNote, setProfileNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setDisplayName(selectedChild?.display_name ?? "");
    setBirthYear(selectedChild?.birth_year ? String(selectedChild.birth_year) : "");
    setNickname(selectedChild?.nickname ?? "");
    setAvatarUrl(selectedChild?.avatar_url ?? "");
    setProfileNote(selectedChild?.profile_note ?? "");
    setErrors({});
  }, [selectedChild?.id]);

  function validate() {
    const next: Record<string, string> = {};
    const year = Number.parseInt(birthYear, 10);
    const currentYear = new Date().getFullYear();
    if (!displayName.trim()) next.display_name = "Tên hiển thị là bắt buộc.";
    if (!birthYear.trim()) next.birth_year = "Năm sinh là bắt buộc.";
    else if (Number.isNaN(year) || year < 2010 || year > currentYear) {
      next.birth_year = `Năm sinh phải trong khoảng 2010-${currentYear}.`;
    }
    if (nickname.length > 80) next.nickname = "Biệt danh tối đa 80 ký tự.";
    if (profileNote.length > 2000) next.profile_note = "Ghi chú tối đa 2000 ký tự.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    const payload = {
      display_name: displayName.trim(),
      birth_year: Number.parseInt(birthYear, 10),
      nickname: nickname.trim() || null,
      avatar_url: avatarUrl.trim() || null,
      profile_note: profileNote.trim() || null,
    };
    if (selectedChild) {
      await onUpdateChild(selectedChild.id, payload);
    } else {
      await onCreateChild(payload);
    }
  }

  return (
    <section className="grid min-w-0 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-3">
        <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Hồ sơ của con</h2>
          <p className="mt-1 text-sm text-[#667085]">Quản lý từng hồ sơ học tập của bé.</p>
        </div>
        {children.map((child) => (
          <button
            key={child.id}
            onClick={() => onSelectChild(child.id)}
            className={`w-full rounded-xl border p-4 text-left shadow-sm transition ${
              selectedChildId === child.id ? "border-[#12b76a] bg-[#ecfdf3]" : "border-[#e4eaf2] bg-white hover:bg-[#f8fafc]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-bold">{child.display_name}</div>
                <div className="mt-1 text-xs font-semibold text-[#667085]">
                  {child.nickname ? `${child.nickname} - ` : ""}
                  {child.birth_year ? `Sinh ${child.birth_year}` : "Chưa có năm sinh"}
                </div>
              </div>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-[#087443]">{child.status}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-[#667085]">
              <span>{child.class_count} lớp</span>
              <span>{child.published_assignment_count} bài</span>
              <span className="inline-flex items-center gap-1">
                <Star size={14} className="text-[#f4b400]" />
                {child.total_stars}
              </span>
              <span className="inline-flex items-center gap-1">
                <Coins size={14} className="text-[#1d73e8]" />
                {child.total_coins}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[#dfe6ef] bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-xl font-bold">{selectedChild ? "Sửa hồ sơ" : "Tạo hồ sơ mới"}</h2>
            <p className="mt-1 text-sm text-[#667085]">Tên hiển thị và năm sinh là bắt buộc.</p>
          </div>
          {selectedChild && (
            <button
              onClick={() => onSelectChild("")}
              className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm font-bold text-[#344054] hover:bg-[#f8fafc]"
            >
              Tạo mới
            </button>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-[#667085]">Tên hiển thị *</span>
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-1 w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#12b76a]" />
            {errors.display_name && <p className="mt-1 text-xs font-semibold text-[#b42318]">{errors.display_name}</p>}
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-[#667085]">Năm sinh *</span>
            <input value={birthYear} onChange={(event) => setBirthYear(event.target.value)} type="number" className="mt-1 w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#12b76a]" />
            {errors.birth_year && <p className="mt-1 text-xs font-semibold text-[#b42318]">{errors.birth_year}</p>}
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-[#667085]">Biệt danh</span>
            <input value={nickname} onChange={(event) => setNickname(event.target.value)} className="mt-1 w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#12b76a]" />
            {errors.nickname && <p className="mt-1 text-xs font-semibold text-[#b42318]">{errors.nickname}</p>}
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-[#667085]">Avatar URL</span>
            <input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} className="mt-1 w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#12b76a]" />
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wide text-[#667085]">Ghi chú học tập</span>
            <textarea value={profileNote} onChange={(event) => setProfileNote(event.target.value)} className="mt-1 min-h-28 w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#12b76a]" />
            {errors.profile_note && <p className="mt-1 text-xs font-semibold text-[#b42318]">{errors.profile_note}</p>}
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-lg bg-[#12b76a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0f9f5f]">
            <Plus size={16} />
            {selectedChild ? "Lưu hồ sơ" : "Tạo hồ sơ"}
          </button>
          {selectedChild && selectedChild.status === "ACTIVE" && (
            <button onClick={() => onUpdateChild(selectedChild.id, { status: "ARCHIVED" })} className="inline-flex items-center gap-2 rounded-lg border border-[#d0d8e4] px-4 py-2.5 text-sm font-bold text-[#344054] hover:bg-[#f8fafc]">
              <Archive size={16} />
              Lưu trữ
            </button>
          )}
        </div>
        {selectedChild && (
          <div className="mt-5 rounded-lg bg-[#f8fafc] p-4 text-sm text-[#667085]">
            Tuổi hiện tại: <span className="font-bold text-[#344054]">{ageFromBirthYear(selectedChild.birth_year) ?? "N/A"}</span>
          </div>
        )}
      </div>
    </section>
  );
}

function ParentClassesPage({
  token,
  children,
  selectedChild,
  selectedChildId,
  classes,
  assignments,
  assignmentDetail,
  selectedAssignmentId,
  onSelectChild,
  onJoinClass,
  onSelectAssignment,
  onStartLearning,
  onUploadAnswer,
}: {
  token: string;
  children: ParentChild[];
  selectedChild: ParentChild | null;
  selectedChildId: string | null;
  classes: ParentClass[];
  assignments: ParentAssignment[];
  assignmentDetail: ParentAssignmentDetail | null;
  selectedAssignmentId: string | null;
  onSelectChild: (childId: string) => void;
  onJoinClass: (classCode: string) => Promise<void>;
  onSelectAssignment: (assignmentId: string) => void;
  onStartLearning: (assignment: ParentAssignmentDetail) => void;
  onUploadAnswer: (file: File) => Promise<void>;
}) {
  const [classCode, setClassCode] = useState("SUNFLOWER-3");
  const [classCodeError, setClassCodeError] = useState("");
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [showAllAssignments, setShowAllAssignments] = useState(false);
  const isAssignmentClosed = assignmentDetail?.status === "CLOSED";
  const filteredAssignments = useMemo(
    () => assignments.filter((assignment) => !selectedClassId || assignment.class_id === selectedClassId),
    [assignments, selectedClassId],
  );
  const visibleAssignments = showAllAssignments ? filteredAssignments : filteredAssignments.slice(0, 5);

  useEffect(() => {
    setSelectedClassId((current) => (current && classes.some((item) => item.class_id === current) ? current : classes[0]?.class_id ?? ""));
    setShowAllAssignments(false);
  }, [classes, selectedChild?.id]);

  useEffect(() => {
    if (!filteredAssignments.length) return;
    if (!selectedAssignmentId || !filteredAssignments.some((assignment) => assignment.assignment_id === selectedAssignmentId)) {
      onSelectAssignment(filteredAssignments[0].assignment_id);
    }
  }, [filteredAssignments, selectedAssignmentId, onSelectAssignment]);

  if (!selectedChild) {
    return (
      <section className="space-y-4">
        <ChildSelector children={children} selectedChildId={selectedChildId} onSelect={onSelectChild} />
      </section>
    );
  }

  return (
    <section className="min-w-0 space-y-5">
      <ChildSelector children={children} selectedChildId={selectedChildId} onSelect={onSelectChild} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <UsersRound className="text-[#12b76a]" size={20} />
            <h3 className="font-bold">Lớp đang học</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {classes.map((item) => (
              <div key={item.class_id} className="rounded-lg border border-[#e4eaf2] bg-[#f8fafc] p-4">
                <div className="font-bold">{item.name}</div>
                <div className="mt-1 text-sm text-[#667085]">Giáo viên: {item.teacher_name}</div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#344054]">
                  <span className="rounded-full bg-white px-2.5 py-1">{item.class_code}</span>
                  <span className="rounded-full bg-white px-2.5 py-1">{item.published_assignment_count} bài</span>
                  <span className="rounded-full bg-white px-2.5 py-1">{item.membership_status}</span>
                </div>
              </div>
            ))}
            {!classes.length && <div className="text-sm text-[#667085]">Bé chưa tham gia lớp nào.</div>}
          </div>
        </div>

        <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold">
            <Link size={18} />
            Nhập mã lớp
          </h3>
          <input
            value={classCode}
            onChange={(event) => {
              setClassCode(event.target.value.toUpperCase());
              setClassCodeError("");
            }}
            className={`mt-4 w-full rounded-lg border px-3 py-2 text-sm font-semibold outline-none focus:border-[#12b76a] ${
              classCodeError ? "border-[#f04438] bg-[#fff4f3]" : "border-[#d0d8e4]"
            }`}
            placeholder="SUNFLOWER-3"
          />
          {classCodeError && <p className="mt-2 text-xs font-semibold text-[#b42318]">{classCodeError}</p>}
          <button
            onClick={() => onJoinClass(classCode).catch((error) => setClassCodeError(getFriendlyJoinClassError(error)))}
            className="mt-3 w-full rounded-lg bg-[#172033] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#26344d]"
          >
            Tham gia lớp
          </button>
        </div>
      </div>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-bold">
              <BookOpen size={18} />
              Bài được giao
            </h3>
            <label className="mt-4 block">
              <span className="text-xs font-bold uppercase tracking-wide text-[#667085]">Chọn lớp</span>
              <select
                value={selectedClassId}
                onChange={(event) => {
                  setSelectedClassId(event.target.value);
                  setShowAllAssignments(false);
                }}
                className="mt-1 w-full rounded-lg border border-[#d0d8e4] bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-[#12b76a]"
              >
                {classes.map((item) => (
                  <option key={item.class_id} value={item.class_id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {visibleAssignments.map((assignment) => (
            <button
              key={assignment.assignment_id}
              onClick={() => onSelectAssignment(assignment.assignment_id)}
              className={`min-h-[132px] w-full rounded-xl border bg-white p-4 text-left shadow-sm transition ${
                selectedAssignmentId === assignment.assignment_id ? "border-[#12b76a] bg-[#ecfdf3]" : "border-[#e4eaf2] hover:bg-[#f8fafc]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="line-clamp-2 font-bold">{assignment.title}</div>
                  <div className="mt-1 text-sm text-[#667085]">{assignment.class_name}</div>
                </div>
                {assignment.submitted ? <CheckCircle2 className="text-[#12b76a]" size={20} /> : <CalendarClock className="text-[#f79009]" size={20} />}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-[#667085]">
                <span>Hạn {formatDate(assignment.due_at)}</span>
                <span>{assignmentStatusLabel(assignment.status)}</span>
                <span>{assignment.submitted ? "Đã nộp" : "Chưa nộp"}</span>
              </div>
            </button>
          ))}
          {filteredAssignments.length > 5 && (
            <button
              onClick={() => setShowAllAssignments((current) => !current)}
              className="w-full rounded-lg border border-[#12b76a] px-4 py-2.5 text-sm font-bold text-[#087443] hover:bg-[#ecfdf3]"
            >
              {showAllAssignments ? "Thu gọn" : "Xem tất cả"}
            </button>
          )}
          {!filteredAssignments.length && <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 text-sm text-[#667085]">Chưa có bài giao trong lớp đã chọn.</div>}
        </div>

        <div className="min-w-0">
          {assignmentDetail ? (
            <div className="space-y-4">
              <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <h2 className="text-xl font-bold">{assignmentDetail.title}</h2>
                    <p className="mt-1 text-sm text-[#667085]">{assignmentDetail.lesson_title} - {assignmentDetail.teacher_name}</p>
                    <p className="mt-3 rounded-lg bg-[#f8fafc] p-3 text-sm leading-6 text-[#344054]">{assignmentDetail.instructions ?? "Giáo viên chưa thêm hướng dẫn."}</p>
                  </div>
                  <button onClick={() => onStartLearning(assignmentDetail)} disabled={isAssignmentClosed} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#12b76a] px-4 text-sm font-bold text-white hover:bg-[#0f9f5f] disabled:cursor-not-allowed disabled:bg-[#98a2b3]">
                    <PlayCircle size={17} />
                    Chơi game phát âm
                  </button>
                </div>
              </section>

              <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
                <h3 className="font-bold">Bài tập PDF</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {assignmentDetail.worksheet_file_url && (
                    <a href={`http://localhost:8000${assignmentDetail.worksheet_file_url}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d0d8e4] px-4 py-2.5 text-sm font-bold text-[#344054] hover:bg-[#f8fafc]">
                      <FileText size={16} />
                      Tải đề bài PDF
                    </a>
                  )}
                  {assignmentDetail.answer_template_url && (
                    <a href={`http://localhost:8000${assignmentDetail.answer_template_url}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d0d8e4] px-4 py-2.5 text-sm font-bold text-[#344054] hover:bg-[#f8fafc]">
                      <FileText size={16} />
                      Tải phiếu trả lời
                    </a>
                  )}
                </div>
                <div className="mt-4 rounded-lg bg-[#f8fafc] p-4 text-sm text-[#667085]">
                  Trạng thái: <span className="font-bold text-[#344054]">{assignmentDetail.latest_grading_status ?? (assignmentDetail.submitted ? "Đã nộp" : "Chưa nộp")}</span>
                  {assignmentDetail.latest_score != null && (
                    <span className="ml-3 font-bold text-[#067647]">
                      Điểm {assignmentDetail.latest_score}/{assignmentDetail.latest_max_score ?? assignmentDetail.max_score}
                    </span>
                  )}
                  {assignmentDetail.latest_feedback && <div className="mt-2 text-[#344054]">{assignmentDetail.latest_feedback}</div>}
                </div>
                {!isAssignmentClosed && (
                  <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#b8c4d6] px-3 py-3 text-sm font-semibold text-[#344054]">
                      <FileText size={16} />
                      <span className="min-w-0 flex-1 truncate">{answerFile?.name ?? "Chọn file trả lời (.doc, .docx, .pdf)"}</span>
                      <input type="file" accept=".doc,.docx,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(event) => setAnswerFile(event.target.files?.[0] ?? null)} />
                    </label>
                    <button
                      onClick={() => answerFile && onUploadAnswer(answerFile).then(() => setAnswerFile(null))}
                      disabled={!answerFile || !token}
                      className="h-11 rounded-lg bg-[#12b76a] px-4 text-sm font-bold text-white hover:bg-[#0f9f5f] disabled:opacity-50"
                    >
                      Nộp bài
                    </button>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
                <h3 className="font-bold">Tài liệu bài học</h3>
                <div className="mt-4 grid gap-3">
                  {assignmentDetail.materials.map((material) => <MaterialCard key={material.id} material={material} />)}
                  {!assignmentDetail.materials.length && <div className="rounded-lg bg-[#f8fafc] p-4 text-sm text-[#667085]">Bài học này chưa có tài liệu.</div>}
                </div>
              </section>
            </div>
          ) : (
            <div className="rounded-xl border border-[#dfe6ef] bg-white p-10 text-center text-[#667085] shadow-sm">Chọn một bài được giao để xem tài liệu.</div>
          )}
        </div>
      </section>
    </section>
  );
}

export function ParentDashboard({ user, onLogout }: ParentDashboardProps) {
  const token = getStoredToken();
  const [activeSection, setActiveSection] = useState<ParentSection>("profiles");
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [classes, setClasses] = useState<ParentClass[]>([]);
  const [assignments, setAssignments] = useState<ParentAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [assignmentDetail, setAssignmentDetail] = useState<ParentAssignmentDetail | null>(null);
  const [learningAssignment, setLearningAssignment] = useState<ParentAssignmentDetail | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) ?? null,
    [children, selectedChildId],
  );

  async function loadChildren(selectFirst = false) {
    if (!token) return;
    const result = await listParentChildren(token);
    setChildren(result);
    if (selectFirst || !selectedChildId || !result.some((child) => child.id === selectedChildId)) {
      const next = result.find((child) => child.status === "ACTIVE") ?? result[0] ?? null;
      setSelectedChildId(next?.id ?? null);
    }
  }

  async function loadChildWorkspace(childId: string) {
    if (!token) return;
    const [classResult, assignmentResult] = await Promise.all([
      listChildClasses(token, childId),
      listChildAssignments(token, childId),
    ]);
    setClasses(classResult);
    setAssignments(assignmentResult);
    const firstAssignmentId = assignmentResult[0]?.assignment_id ?? null;
    setSelectedAssignmentId((current) =>
      current && assignmentResult.some((item) => item.assignment_id === current) ? current : firstAssignmentId,
    );
    if (!assignmentResult.length) setAssignmentDetail(null);
  }

  async function loadAssignmentDetail(childId: string, assignmentId: string) {
    if (!token) return;
    setAssignmentDetail(await getChildAssignmentDetail(token, childId, assignmentId));
  }

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    loadChildren(true)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Không tải được hồ sơ con"))
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    if (!selectedChildId) {
      setClasses([]);
      setAssignments([]);
      setAssignmentDetail(null);
      return;
    }
    setMessage("");
    setSelectedAssignmentId(null);
    setAssignmentDetail(null);
    loadChildWorkspace(selectedChildId).catch((requestError) =>
      setError(requestError instanceof Error ? requestError.message : "Không tải được không gian học"),
    );
  }, [selectedChildId, token]);

  useEffect(() => {
    if (!selectedChildId || !selectedAssignmentId) return;
    loadAssignmentDetail(selectedChildId, selectedAssignmentId).catch((requestError) =>
      setError(requestError instanceof Error ? requestError.message : "Không tải được chi tiết bài giao"),
    );
  }, [selectedChildId, selectedAssignmentId, token]);

  async function handleCreateChild(payload: {
    display_name: string;
    birth_year: number;
    nickname?: string | null;
    avatar_url?: string | null;
    profile_note?: string | null;
  }) {
    if (!token) return;
    setError("");
    setMessage("");
    try {
      const child = await createParentChild(token, payload);
      await loadChildren();
      setSelectedChildId(child.id);
      setMessage("Đã tạo hồ sơ con.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không tạo được hồ sơ con");
    }
  }

  async function handleUpdateChild(
    childId: string,
    payload: {
      display_name?: string;
      birth_year?: number | null;
      nickname?: string | null;
      avatar_url?: string | null;
      profile_note?: string | null;
      status?: "ACTIVE" | "ARCHIVED";
    },
  ) {
    if (!token) return;
    setError("");
    setMessage("");
    try {
      await updateParentChild(token, childId, payload);
      await loadChildren();
      setMessage(payload.status === "ARCHIVED" ? "Đã lưu trữ hồ sơ." : "Đã cập nhật hồ sơ.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không cập nhật được hồ sơ");
    }
  }

  async function handleJoinClass(classCode: string) {
    if (!token || !selectedChild) return;
    setError("");
    setMessage("");
    if (!classCode.trim()) throw new Error("CLASS_CODE_REQUIRED");
    const result = await joinClassByCode(token, selectedChild.id, classCode.trim());
    await Promise.all([loadChildren(), loadChildWorkspace(selectedChild.id)]);
    setMessage(result.already_joined ? "Bé đã ở trong lớp này." : `Đã tham gia lớp ${result.class_name}.`);
  }

  async function handleUploadAnswerFile(file: File) {
    if (!token || !selectedChildId || !assignmentDetail) return;
    setError("");
    setMessage("");
    try {
      await uploadAssignmentSubmissionFile(token, selectedChildId, assignmentDetail.assignment_id, file);
      await Promise.all([loadChildWorkspace(selectedChildId), loadAssignmentDetail(selectedChildId, assignmentDetail.assignment_id)]);
      setMessage("Đã nộp phiếu trả lời.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không nộp được phiếu trả lời");
    }
  }

  if (token && selectedChild && learningAssignment) {
    return (
      <ChildLearningSession
        token={token}
        child={selectedChild}
        assignment={learningAssignment}
        onBack={() => setLearningAssignment(null)}
        onCompleted={() => {
          loadChildren();
          loadChildWorkspace(selectedChild.id);
        }}
      />
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f7fb] text-[#172033]">
      <header className="sticky top-0 z-20 border-b border-[#dfe6ef] bg-white/95 backdrop-blur">
        <div className="flex w-full items-center justify-between px-6 py-3 lg:pl-[304px]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#12b76a] text-white shadow-sm">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#087443]">Doodle English</p>
              <h1 className="text-xl font-bold text-[#172033]">Không gian phụ huynh</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <div className="font-semibold">{user.full_name}</div>
              <div className="text-sm text-[#667085]">{user.email}</div>
            </div>
            <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-lg border border-[#cfd8e3] bg-white px-4 py-2 text-sm font-semibold text-[#344054] transition hover:bg-[#f7f9fc]">
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <section className="w-full px-4 py-5 sm:px-6 lg:pl-[304px]">
        <aside className="rounded-xl border border-[#dfe6ef] bg-white p-3 shadow-sm lg:fixed lg:left-0 lg:top-0 lg:z-30 lg:h-screen lg:w-[280px] lg:overflow-y-auto lg:rounded-none lg:border-y-0 lg:border-l-0 lg:p-5">
          <div className="mb-3 rounded-lg bg-[#ecfdf3] px-3 py-2">
            <div className="text-xs font-bold uppercase tracking-wide text-[#087443]">Parent</div>
            <div className="mt-1 truncate text-sm font-semibold text-[#172033]">{user.full_name}</div>
          </div>
          <nav className="grid gap-1 sm:grid-cols-2 lg:block lg:space-y-1">
            {navItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                  key === activeSection ? "bg-[#ecfdf3] text-[#087443]" : "text-[#475467] hover:bg-[#f5f8fc]"
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="mt-5 max-w-[calc(1440px-304px)] space-y-5 lg:mt-0">
          {(error || message) && (
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${error ? "border-[#fecdca] bg-[#fff4f3] text-[#b42318]" : "border-[#abefc6] bg-[#f0fdf4] text-[#067647]"}`}>
              <CircleAlert size={18} />
              {error || message}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-xl border border-[#dfe6ef] bg-white p-8 text-center text-[#667085] shadow-sm">Đang tải hồ sơ...</div>
          ) : activeSection === "profiles" ? (
            <ParentChildProfilesPage
              children={children}
              selectedChild={selectedChildId ? selectedChild : null}
              selectedChildId={selectedChildId}
              onSelectChild={(childId) => setSelectedChildId(childId || null)}
              onCreateChild={handleCreateChild}
              onUpdateChild={handleUpdateChild}
            />
          ) : activeSection === "progress" ? (
            <section className="space-y-4">
              <ChildSelector children={children} selectedChildId={selectedChildId} onSelect={setSelectedChildId} />
              {selectedChild ? <ParentProgressPanel token={token ?? ""} child={selectedChild} /> : null}
            </section>
          ) : activeSection === "chat" ? (
            <section className="space-y-4">
              <ChildSelector children={children} selectedChildId={selectedChildId} onSelect={setSelectedChildId} />
              {selectedChild ? <ParentChatPanel token={token ?? ""} child={selectedChild} classes={classes} /> : null}
            </section>
          ) : (
            <ParentClassesPage
              token={token ?? ""}
              children={children}
              selectedChild={selectedChild}
              selectedChildId={selectedChildId}
              classes={classes}
              assignments={assignments}
              assignmentDetail={assignmentDetail}
              selectedAssignmentId={selectedAssignmentId}
              onSelectChild={setSelectedChildId}
              onJoinClass={handleJoinClass}
              onSelectAssignment={setSelectedAssignmentId}
              onStartLearning={setLearningAssignment}
              onUploadAnswer={handleUploadAnswerFile}
            />
          )}
        </div>
      </section>
    </main>
  );
}
