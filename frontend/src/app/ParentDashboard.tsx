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
  PlayCircle,
  Plus,
  Sparkles,
  Star,
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

function formatDate(value: string | null) {
  if (!value) return "Chưa có hạn";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(value),
  );
}

function materialLabel(type: string) {
  const labels: Record<string, string> = {
    PDF: "PDF",
    YOUTUBE_VIDEO: "Video",
    SPEAKING_PROMPT: "Luyện nói",
    DOODLE_VOCAB: "Doodle demo",
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
    <div className="rounded-xl border border-[#e4eaf2] bg-white p-4">
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
      {material.vocabulary_items?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {material.vocabulary_items.map((item) => (
            <span key={item.class_key} className="rounded-full bg-[#f8fafc] px-2.5 py-1 text-xs font-bold text-[#344054]">
              {item.english} · {item.vi}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ParentDashboard({ user, onLogout }: ParentDashboardProps) {
  const token = getStoredToken();
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [classes, setClasses] = useState<ParentClass[]>([]);
  const [assignments, setAssignments] = useState<ParentAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [assignmentDetail, setAssignmentDetail] = useState<ParentAssignmentDetail | null>(null);
  const [learningAssignment, setLearningAssignment] = useState<ParentAssignmentDetail | null>(null);
  const [newChildName, setNewChildName] = useState("");
  const [newChildBirthYear, setNewChildBirthYear] = useState("");
  const [editChildName, setEditChildName] = useState("");
  const [editBirthYear, setEditBirthYear] = useState("");
  const [classCode, setClassCode] = useState("SUNFLOWER-3");
  const [classCodeError, setClassCodeError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const isAssignmentClosed = assignmentDetail?.status === "CLOSED";

  const activeChildren = useMemo(() => children.filter((child) => child.status === "ACTIVE"), [children]);
  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) ?? null,
    [children, selectedChildId],
  );

  async function loadChildren(selectFirst = false) {
    if (!token) return;
    const result = await listParentChildren(token);
    setChildren(result);
    if (selectFirst || !selectedChildId) {
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
    setClassCodeError("");
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

  useEffect(() => {
    setEditChildName(selectedChild?.display_name ?? "");
    setEditBirthYear(selectedChild?.birth_year ? String(selectedChild.birth_year) : "");
  }, [selectedChild?.id]);

  async function handleCreateChild() {
    if (!token || !newChildName.trim()) return;
    setError("");
    setMessage("");
    try {
      const child = await createParentChild(token, {
        display_name: newChildName.trim(),
        birth_year: newChildBirthYear ? Number(newChildBirthYear) : null,
      });
      setNewChildName("");
      setNewChildBirthYear("");
      await loadChildren();
      setSelectedChildId(child.id);
      setMessage("Đã tạo hồ sơ con.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không tạo được hồ sơ con");
    }
  }

  async function handleUpdateChild(status?: "ACTIVE" | "ARCHIVED") {
    if (!token || !selectedChild) return;
    setError("");
    setMessage("");
    try {
      await updateParentChild(token, selectedChild.id, {
        display_name: editChildName.trim(),
        birth_year: editBirthYear ? Number(editBirthYear) : null,
        status,
      });
      await loadChildren();
      setMessage(status === "ARCHIVED" ? "Đã lưu trữ hồ sơ." : "Đã cập nhật hồ sơ.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không cập nhật được hồ sơ");
    }
  }

  async function handleJoinClass() {
    if (!token || !selectedChild) return;
    setError("");
    setClassCodeError("");
    setMessage("");
    if (!classCode.trim()) {
      setClassCodeError("Vui lòng nhập mã lớp giáo viên đã gửi.");
      return;
    }
    try {
      const result = await joinClassByCode(token, selectedChild.id, classCode.trim());
      await Promise.all([loadChildren(), loadChildWorkspace(selectedChild.id)]);
      setMessage(result.already_joined ? "Bé đã ở trong lớp này, không tạo trùng." : `Đã tham gia lớp ${result.class_name}.`);
    } catch (requestError) {
      setClassCodeError(getFriendlyJoinClassError(requestError));
    }
  }

  async function handleUploadAnswerFile() {
    if (!token || !selectedChildId || !assignmentDetail || !answerFile) return;
    setError("");
    setMessage("");
    try {
      await uploadAssignmentSubmissionFile(token, selectedChildId, assignmentDetail.assignment_id, answerFile);
      setAnswerFile(null);
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
      <header className="border-b border-[#dfe6ef] bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4">
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
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-[#cfd8e3] bg-white px-4 py-2 text-sm font-semibold text-[#344054] transition hover:bg-[#f7f9fc]"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-[1440px] gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Hồ sơ của con</h2>
                <p className="text-sm text-[#667085]">Chọn hồ sơ để xem lớp và bài được giao.</p>
              </div>
              <UserRound className="text-[#12b76a]" size={22} />
            </div>
            <div className="space-y-2">
              {activeChildren.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`w-full rounded-lg border p-4 text-left transition ${
                    selectedChildId === child.id
                      ? "border-[#12b76a] bg-[#ecfdf3]"
                      : "border-[#e4eaf2] bg-white hover:bg-[#f8fafc]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold">{child.display_name}</div>
                      <div className="mt-1 text-xs font-semibold text-[#667085]">
                        {child.birth_year ? `Sinh năm ${child.birth_year}` : "Chưa có năm sinh"}
                      </div>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-[#087443]">
                      {child.class_count} lớp
                    </span>
                  </div>
                  <div className="mt-3 flex gap-3 text-xs font-semibold text-[#667085]">
                    <span className="inline-flex items-center gap-1">
                      <Star size={14} className="text-[#f4b400]" />
                      {child.total_stars}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Coins size={14} className="text-[#1d73e8]" />
                      {child.total_coins}
                    </span>
                    <span>{child.published_assignment_count} bài</span>
                  </div>
                </button>
              ))}
              {isLoading && <div className="rounded-lg bg-[#f8fafc] p-4 text-sm text-[#667085]">Đang tải hồ sơ...</div>}
              {!isLoading && !activeChildren.length && (
                <div className="rounded-lg bg-[#f8fafc] p-4 text-sm text-[#667085]">Chưa có hồ sơ active.</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
            <h3 className="font-bold">Tạo hồ sơ mới</h3>
            <div className="mt-4 grid gap-3">
              <input value={newChildName} onChange={(event) => setNewChildName(event.target.value)} className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#12b76a]" placeholder="Tên của bé" />
              <input value={newChildBirthYear} onChange={(event) => setNewChildBirthYear(event.target.value)} type="number" className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#12b76a]" placeholder="Năm sinh" />
              <button onClick={handleCreateChild} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#12b76a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0f9f5f]">
                <Plus size={16} />
                Tạo hồ sơ
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          {(error || message) && (
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${error ? "border-[#fecdca] bg-[#fff4f3] text-[#b42318]" : "border-[#abefc6] bg-[#f0fdf4] text-[#067647]"}`}>
              <CircleAlert size={18} />
              {error || message}
            </div>
          )}

          {selectedChild ? (
            <>
              <section className="rounded-xl border border-[#dfe6ef] bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <h2 className="text-2xl font-bold">{selectedChild.display_name}</h2>
                      <span className="rounded-full bg-[#ecfdf3] px-2.5 py-1 text-xs font-bold text-[#087443]">{selectedChild.status}</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px]">
                      <input value={editChildName} onChange={(event) => setEditChildName(event.target.value)} className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#12b76a]" />
                      <input value={editBirthYear} onChange={(event) => setEditBirthYear(event.target.value)} type="number" className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#12b76a]" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleUpdateChild()} className="rounded-lg border border-[#12b76a] px-4 py-2.5 text-sm font-bold text-[#087443] hover:bg-[#ecfdf3]">Lưu hồ sơ</button>
                    <button onClick={() => handleUpdateChild("ARCHIVED")} className="inline-flex items-center gap-2 rounded-lg border border-[#d0d8e4] px-4 py-2.5 text-sm font-bold text-[#344054] hover:bg-[#f8fafc]">
                      <Archive size={16} />
                      Lưu trữ
                    </button>
                  </div>
                </div>
              </section>

              <section className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.8fr)]">
                <ParentProgressPanel token={token ?? ""} child={selectedChild} />
                <ParentChatPanel token={token ?? ""} child={selectedChild} classes={classes} />
              </section>

              <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
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
                      setMessage("");
                    }}
                    aria-invalid={Boolean(classCodeError)}
                    aria-describedby={classCodeError ? "class-code-error" : undefined}
                    className={`mt-4 w-full rounded-lg border px-3 py-2 text-sm font-semibold outline-none focus:border-[#12b76a] ${
                      classCodeError ? "border-[#f04438] bg-[#fff4f3]" : "border-[#d0d8e4]"
                    }`}
                    placeholder="SUNFLOWER-3"
                  />
                  {classCodeError && (
                    <p id="class-code-error" className="mt-2 text-xs font-semibold text-[#b42318]">
                      {classCodeError}
                    </p>
                  )}
                  <button onClick={handleJoinClass} className="mt-3 w-full rounded-lg bg-[#172033] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#26344d]">Tham gia lớp</button>
                </div>
              </section>

              <section className="grid min-w-0 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="space-y-3">
                  <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
                    <h3 className="flex items-center gap-2 font-bold">
                      <BookOpen size={18} />
                      Bài được giao
                    </h3>
                    <p className="mt-1 text-sm text-[#667085]">Chỉ hiển thị bài giáo viên đã phát hành.</p>
                  </div>
                  {assignments.map((assignment) => (
                    <button key={assignment.assignment_id} onClick={() => setSelectedAssignmentId(assignment.assignment_id)} className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm transition ${selectedAssignmentId === assignment.assignment_id ? "border-[#12b76a] bg-[#ecfdf3]" : "border-[#e4eaf2] hover:bg-[#f8fafc]"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-bold">{assignment.title}</div>
                          <div className="mt-1 text-sm text-[#667085]">{assignment.class_name}</div>
                        </div>
                        {assignment.submitted ? <CheckCircle2 className="text-[#12b76a]" size={20} /> : <CalendarClock className={assignment.status === "CLOSED" ? "text-[#98a2b3]" : "text-[#f79009]"} size={20} />}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-[#667085]">
                        <span>Hạn {formatDate(assignment.due_at)}</span>
                        <span>{assignment.material_count} tài liệu</span>
                        <span>{assignmentStatusLabel(assignment.status)}</span>
                        <span>{assignment.submitted ? "Đã nộp" : "Chưa nộp"}</span>
                      </div>
                    </button>
                  ))}
                  {!assignments.length && <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 text-sm text-[#667085]">Chưa có bài publish cho hồ sơ này.</div>}
                </div>

                <div className="min-w-0">
                  {assignmentDetail ? (
                    <div className="space-y-4">
                      <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                          <div>
                            <h2 className="text-xl font-bold">{assignmentDetail.title}</h2>
                            <p className="mt-1 text-sm text-[#667085]">{assignmentDetail.lesson_title} · {assignmentDetail.teacher_name}</p>
                            <p className="mt-3 rounded-lg bg-[#f8fafc] p-3 text-sm leading-6 text-[#344054]">{assignmentDetail.instructions ?? "Giáo viên chưa thêm hướng dẫn."}</p>
                          </div>
                          <button onClick={() => setLearningAssignment(assignmentDetail)} disabled={isAssignmentClosed} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#12b76a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0f9f5f] disabled:cursor-not-allowed disabled:bg-[#98a2b3]">
                            <PlayCircle size={17} />
                            Bắt đầu học
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
                          <span className="ml-3 font-bold text-[#344054]">{assignmentStatusLabel(assignmentDetail.status)}</span>
                          {assignmentDetail.latest_score != null && (
                            <span className="ml-3 font-bold text-[#067647]">
                              Điểm {assignmentDetail.latest_score}/{assignmentDetail.latest_max_score ?? assignmentDetail.max_score}
                            </span>
                          )}
                          {assignmentDetail.latest_feedback && <div className="mt-2 text-[#344054]">{assignmentDetail.latest_feedback}</div>}
                        </div>
                        {isAssignmentClosed ? (
                          <div className="mt-4 rounded-lg bg-[#f2f4f7] p-4 text-sm font-semibold text-[#667085]">
                            Bài giao đã đóng, phụ huynh không thể nộp thêm.
                          </div>
                        ) : (
                          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#b8c4d6] px-3 py-3 text-sm font-semibold text-[#344054]">
                              <FileText size={16} />
                              <span className="min-w-0 flex-1 truncate">{answerFile?.name ?? "Chọn file trả lời (.doc, .docx, .pdf)"}</span>
                              <input type="file" accept=".doc,.docx,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(event) => setAnswerFile(event.target.files?.[0] ?? null)} />
                            </label>
                            <button onClick={handleUploadAnswerFile} disabled={!answerFile} className="rounded-lg bg-[#12b76a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0f9f5f] disabled:opacity-50">
                              Nộp bài
                            </button>
                          </div>
                        )}
                      </section>

                      <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
                        <h3 className="font-bold">Tài liệu bài học</h3>
                        <div className="mt-4 grid gap-3">
                          {assignmentDetail.materials.map((material) => <MaterialCard key={material.id} material={material} />)}
                          {!assignmentDetail.materials.length && <div className="rounded-lg bg-[#f8fafc] p-4 text-sm text-[#667085]">Lesson này chưa có tài liệu.</div>}
                        </div>
                      </section>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#dfe6ef] bg-white p-10 text-center text-[#667085] shadow-sm">Chọn một bài được giao để xem tài liệu.</div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <div className="rounded-xl border border-[#dfe6ef] bg-white p-10 text-center text-[#667085] shadow-sm">Tạo hồ sơ con để bắt đầu liên kết lớp học.</div>
          )}
        </div>
      </section>
    </main>
  );
}
