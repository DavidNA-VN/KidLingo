import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  ListFilter,
  Plus,
  Save,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { getStoredToken } from "../lib/auth";
import { listLessons, type LessonSummary } from "../lib/lessons";
import type { TeacherClassSummary } from "../lib/teacher";
import {
  createTeacherAssignment,
  getTeacherAssignmentDetail,
  listTeacherAssignments,
  updateTeacherAssignment,
  uploadAssignmentAnswerTemplate,
  uploadAssignmentWorksheet,
  type TeacherAssignmentDetail,
  type TeacherAssignmentListItem,
} from "../lib/teacherAssignments";

type TeacherAssignmentsProps = {
  classes: TeacherClassSummary[];
  selectedClassId?: string | null;
  onOpenSubmissions?: (section: string, classId?: string, assignmentId?: string) => void;
  onOpenStudentProfile?: (classId: string | null | undefined, childId: string) => void;
};

type AssignmentStatus = "PUBLISHED" | "CLOSED";

const statusLabels = {
  PUBLISHED: "Đã giao",
  CLOSED: "Đã đóng",
};

function formatDate(value: string | null) {
  if (!value) return "Chưa có hạn";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function splitDateTime(value: string | null) {
  if (!value) return { date: "", time: "" };
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000).toISOString();
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
}

function combineDateTime(date: string, time: string) {
  if (!date) return null;
  const timeValue = time || "23:59";
  return new Date(`${date}T${timeValue}:00`).toISOString();
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "PUBLISHED"
      ? "bg-[#e8f7ef] text-[#067647]"
      : "bg-[#f2f4f7] text-[#667085]";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${color}`}>{statusLabels[status as keyof typeof statusLabels] ?? status}</span>;
}

function FieldLabel({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-xs font-bold uppercase tracking-wide text-[#667085]">{label}</span>
      <div className="mt-1">{children}</div>
      {help && <p className="mt-1 text-xs leading-5 text-[#667085]">{help}</p>}
    </label>
  );
}

function FilePicker({
  label,
  value,
  accept,
  onChange,
}: {
  label: string;
  value: File | null;
  accept: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#b8c4d6] px-3 py-3 text-sm font-semibold text-[#344054]">
      <Upload size={16} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate" title={value?.name ?? label}>
        {value?.name ?? label}
      </span>
      <input type="file" accept={accept} className="hidden" onChange={(event) => onChange(event.target.files?.[0] ?? null)} />
    </label>
  );
}

function AssignmentDetailPanel({
  detail,
  onSave,
  onOpenSubmissions,
  onOpenStudentProfile,
  isSaving,
}: {
  detail: TeacherAssignmentDetail;
  onSave: (payload: { title: string; instructions: string; due_at: string | null; max_score?: number }) => Promise<void>;
  onOpenSubmissions?: (section: string, classId?: string, assignmentId?: string) => void;
  onOpenStudentProfile?: (classId: string | null | undefined, childId: string) => void;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState(detail.title);
  const [instructions, setInstructions] = useState(detail.instructions ?? "");
  const [dueDate, setDueDate] = useState(splitDateTime(detail.due_at).date);
  const [dueTime, setDueTime] = useState(splitDateTime(detail.due_at).time);
  const [maxScore, setMaxScore] = useState(String(detail.max_score ?? 10));

  useEffect(() => {
    const due = splitDateTime(detail.due_at);
    setTitle(detail.title);
    setInstructions(detail.instructions ?? "");
    setDueDate(due.date);
    setDueTime(due.time);
    setMaxScore(String(detail.max_score ?? 10));
  }, [detail.assignment_id]);

  return (
    <div className="min-w-0 space-y-4">
      <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="break-words text-xl font-bold">{detail.title}</h2>
              <StatusBadge status={detail.status} />
            </div>
            <p className="text-sm text-[#667085]">
              {detail.class_name} - {detail.lesson_title}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center lg:grid-cols-4">
            <div className="rounded-lg bg-[#f5f9ff] px-4 py-3">
              <div className="text-2xl font-bold">{percent(detail.completion_rate)}</div>
              <div className="text-xs text-[#667085]">Hoàn thành</div>
            </div>
            <div className="rounded-lg bg-[#f8fafc] px-4 py-3">
              <div className="text-2xl font-bold">{detail.submitted_child_count}</div>
              <div className="text-xs text-[#667085]">Đã nộp</div>
            </div>
            <div className="rounded-lg bg-[#fff7ed] px-4 py-3">
              <div className="text-2xl font-bold">{detail.missing_child_count}</div>
              <div className="text-xs text-[#667085]">Chưa nộp</div>
            </div>
            <div className="rounded-lg bg-[#f0fdf4] px-4 py-3">
              <div className="text-2xl font-bold">{detail.ungraded_submission_count}</div>
              <div className="text-xs text-[#667085]">Chưa chấm</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 font-bold">
          <Save size={18} />
          Chỉnh bài giao
        </h3>
        <div className="mt-4 space-y-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_150px]">
            <FieldLabel label="Tên bài giao">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
              />
            </FieldLabel>
            <FieldLabel label="Điểm tối đa" help="Từ 1 đến 100, hỗ trợ bước 0.5 điểm.">
              <input
                value={maxScore}
                onChange={(event) => setMaxScore(event.target.value)}
                type="number"
                min="1"
                max="100"
                step="0.5"
                className="w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
              />
            </FieldLabel>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <FieldLabel label="Ngày hết hạn" help="Chọn ngày cuối cùng học sinh có thể nộp bài.">
              <input
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                type="date"
                className="w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
              />
            </FieldLabel>
            <FieldLabel label="Giờ hết hạn" help="Nếu bỏ trống, hệ thống dùng 23:59 của ngày đã chọn.">
              <input
                value={dueTime}
                onChange={(event) => setDueTime(event.target.value)}
                type="time"
                className="w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
              />
            </FieldLabel>
          </div>

          <FieldLabel label="Hướng dẫn làm bài" help="Nêu rõ học sinh cần xem gì, làm gì và nộp file nào.">
            <textarea
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              className="min-h-24 w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
              placeholder="Ví dụ: Xem video, làm phiếu PDF, điền phiếu trả lời Word rồi nộp lại."
            />
          </FieldLabel>

          <button
            onClick={() =>
              onSave({
                title,
                instructions,
                due_at: combineDateTime(dueDate, dueTime),
                max_score: Number.parseFloat(maxScore) || 10,
              })
            }
            disabled={isSaving || !title.trim()}
            className="rounded-lg bg-[#1d73e8] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            Lưu thay đổi
          </button>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold">
            <FileText size={18} />
            Tài liệu đã giao
          </h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-[#e4eaf2] p-4">
              <div className="text-xs font-bold uppercase text-[#1d73e8]">PDF đề bài</div>
              <div className="mt-1 break-words font-bold">{detail.worksheet_file_url ? "Đã upload worksheet" : "Chưa upload worksheet"}</div>
              {detail.worksheet_file_url && (
                <a href={`http://localhost:8000${detail.worksheet_file_url}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-lg border border-[#d0d8e4] px-3 py-2 text-xs font-bold text-[#344054] hover:bg-[#f8fafc]">
                  Mở PDF
                </a>
              )}
            </div>
            <div className="rounded-lg border border-[#e4eaf2] p-4">
              <div className="text-xs font-bold uppercase text-[#1d73e8]">Phiếu trả lời</div>
              <div className="mt-1 break-words font-bold">{detail.answer_template_url ? "Đã upload file Word" : "Chưa upload file Word"}</div>
              {detail.answer_template_url && (
                <a href={`http://localhost:8000${detail.answer_template_url}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-lg border border-[#d0d8e4] px-3 py-2 text-xs font-bold text-[#344054] hover:bg-[#f8fafc]">
                  Tải phiếu trả lời
                </a>
              )}
            </div>
            <div className="rounded-lg bg-[#f8fafc] p-4 text-sm text-[#667085]">
              Lesson nguồn: <span className="font-semibold text-[#344054]">{detail.lesson_title}</span> - {detail.material_count} tài liệu học
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold">
            <CheckCircle2 size={18} />
            Bài nộp mới nhất
          </h3>
          <div className="mt-4 space-y-3">
            {detail.recent_submissions.slice(0, 5).map((submission) => (
              <div key={submission.id} className="rounded-lg bg-[#f8fafc] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <button
                      type="button"
                      onClick={() => onOpenStudentProfile?.(detail.class_id, submission.child_id)}
                      className="font-bold text-[#155dcc] hover:underline"
                    >
                      {submission.child_name}
                    </button>
                    <div className="mt-1 text-sm text-[#667085]">{submission.grading_status}</div>
                  </div>
                  <div className="text-sm font-bold text-[#067647]">
                    {submission.score != null ? `${submission.score}/${submission.max_score ?? detail.max_score}` : "Chưa chấm"}
                  </div>
                </div>
              </div>
            ))}
            {!detail.recent_submissions.length && <div className="rounded-lg bg-[#f8fafc] p-4 text-sm text-[#667085]">Chưa có bài nộp.</div>}
          </div>
          <button
            onClick={() => onOpenSubmissions?.("Bài nộp", detail.class_id, detail.assignment_id)}
            className="mt-4 rounded-lg border border-[#1d73e8] px-3 py-2 text-xs font-bold text-[#155dcc] hover:bg-[#f2f7ff]"
          >
            Xem tất cả bài nộp
          </button>
        </section>

        <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold">
            <AlertTriangle size={18} />
            Học sinh chưa nộp
          </h3>
          <div className="mt-4 space-y-3">
            {detail.missing_children.slice(0, 5).map((child) => (
              <div key={child.id} className="rounded-lg bg-[#f8fafc] p-4">
                <button
                  onClick={() => onOpenStudentProfile?.(detail.class_id, child.id)}
                  className="font-bold text-[#155dcc] hover:underline"
                >
                  {child.display_name}
                </button>
                <div className="mt-1 text-sm text-[#667085]">{child.parent_name}</div>
                <div className="mt-1 max-w-full truncate text-xs text-[#667085]">{child.parent_email}</div>
              </div>
            ))}
            {detail.missing_children.length > 5 && (
              <div className="text-sm font-semibold text-[#667085]">Còn {detail.missing_children.length - 5} học sinh chưa nộp.</div>
            )}
            {!detail.missing_children.length && (
              <div className="rounded-lg bg-[#f0fdf4] p-4 text-sm font-semibold text-[#067647]">
                Tất cả học sinh active đã nộp bài này.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export function TeacherAssignments({ classes, selectedClassId, onOpenSubmissions, onOpenStudentProfile }: TeacherAssignmentsProps) {
  const token = getStoredToken();
  const [items, setItems] = useState<TeacherAssignmentListItem[]>([]);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TeacherAssignmentDetail | null>(null);
  const [classFilter, setClassFilter] = useState(selectedClassId ?? classes[0]?.id ?? "");
  const [lessonFilter, setLessonFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newLessonId, setNewLessonId] = useState("");
  const [newTitle, setNewTitle] = useState("Bài tập PDF mới");
  const [newInstructions, setNewInstructions] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newDueTime, setNewDueTime] = useState("23:59");
  const [newMaxScore, setNewMaxScore] = useState("10");
  const [worksheetFile, setWorksheetFile] = useState<File | null>(null);
  const [answerTemplateFile, setAnswerTemplateFile] = useState<File | null>(null);

  const filteredItems = useMemo(() => {
    if (lessonFilter === "ALL") return items;
    return items.filter((item) => item.lesson_id === lessonFilter);
  }, [items, lessonFilter]);
  const selectedClassName = classes.find((item) => item.id === classFilter)?.name ?? "Lớp đã chọn";
  const isClassLocked = Boolean(selectedClassId);

  async function loadAssignments(selectFirst = false) {
    if (!token) return;
    setIsLoading(true);
    setError("");
    try {
      const result = await listTeacherAssignments(token, {
        class_id: classFilter,
      });
      setItems(result);
      const nextId = selectFirst ? result[0]?.assignment_id ?? null : selectedId;
      if (nextId) setSelectedId(nextId);
      if (!nextId) setDetail(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không tải được bài giao");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadDetail(assignmentId: string) {
    if (!token) return;
    setError("");
    try {
      setDetail(await getTeacherAssignmentDetail(token, assignmentId));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không tải được chi tiết bài giao");
    }
  }

  useEffect(() => {
    loadAssignments(true);
  }, [token, classFilter]);

  useEffect(() => {
    if (!token || !classFilter) {
      setLessons([]);
      setNewLessonId("");
      return;
    }
    listLessons(token, classFilter)
      .then((items) => {
        setLessons(items);
        setNewLessonId((current) => (current && items.some((item) => item.id === current) ? current : items[0]?.id ?? ""));
        setLessonFilter((current) => (current === "ALL" || items.some((item) => item.id === current) ? current : "ALL"));
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Không tải được bài học"));
  }, [token, classFilter]);

  useEffect(() => {
    if (!selectedClassId || selectedClassId === classFilter) return;
    setClassFilter(selectedClassId);
    setLessonFilter("ALL");
    setSelectedId(null);
    setDetail(null);
  }, [selectedClassId, classFilter]);

  useEffect(() => {
    const nextId = filteredItems[0]?.assignment_id ?? null;
    if (selectedId && filteredItems.some((item) => item.assignment_id === selectedId)) return;
    setSelectedId(nextId);
    if (!nextId) setDetail(null);
  }, [lessonFilter, filteredItems, selectedId]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId]);

  async function handleCreatePdfAssignment() {
    if (!token || !classFilter || !newLessonId || !newTitle.trim()) return;
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const created = await createTeacherAssignment(token, {
        class_id: classFilter,
        lesson_id: newLessonId,
        title: newTitle,
        instructions: newInstructions,
        assignment_type: "PDF_ASSIGNMENT",
        max_score: Number.parseFloat(newMaxScore) || 10,
        due_at: combineDateTime(newDueDate, newDueTime),
        status: "PUBLISHED",
      });
      let detailResult: TeacherAssignmentDetail | null = null;
      if (worksheetFile) {
        detailResult = await uploadAssignmentWorksheet(token, created.id, worksheetFile);
      }
      if (answerTemplateFile) {
        detailResult = await uploadAssignmentAnswerTemplate(token, created.id, answerTemplateFile);
      }
      setWorksheetFile(null);
      setAnswerTemplateFile(null);
      setMessage("Đã tạo bài tập PDF.");
      await loadAssignments();
      setSelectedId(created.id);
      if (detailResult) setDetail(detailResult);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không tạo được bài tập PDF");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSave(payload: { title: string; instructions: string; due_at: string | null; max_score?: number }) {
    if (!token || !selectedId) return;
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateTeacherAssignment(token, selectedId, payload);
      setDetail(updated);
      setMessage("Đã cập nhật bài giao.");
      await loadAssignments();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không cập nhật được bài giao");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="grid min-w-0 gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Bài giao</h2>
              <p className="text-sm text-[#667085]">Quản lý bài tập, tiến độ và học sinh chưa nộp.</p>
            </div>
            <ClipboardList className="text-[#1d73e8]" size={22} />
          </div>

          <div className="grid gap-2">
            <select
              value={lessonFilter}
              onChange={(event) => {
                setLessonFilter(event.target.value);
                setSelectedId(null);
                setDetail(null);
              }}
              className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none"
            >
              <option value="ALL">Tất cả bài học</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-1 gap-2">
              {isClassLocked ? (
                <div className="rounded-lg border border-[#d0d8e4] bg-[#f8fafc] px-3 py-2 text-sm font-semibold text-[#344054]">
                  {selectedClassName}
                </div>
              ) : (
                <select
                  value={classFilter}
                  onChange={(event) => {
                    setClassFilter(event.target.value);
                    setLessonFilter("ALL");
                    setSelectedId(null);
                    setDetail(null);
                  }}
                  className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none"
                >
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold">
            <Plus size={18} />
            Tạo bài tập PDF
          </h3>
          {!classFilter ? (
            <div className="mt-4 rounded-lg bg-[#fff7ed] p-4 text-sm font-semibold text-[#b54708]">
              Chọn một lớp trước khi tạo bài tập.
            </div>
          ) : !lessons.length ? (
            <div className="mt-4 rounded-lg bg-[#f8fafc] p-4 text-sm text-[#667085]">
              Lớp này chưa có bài học. Hãy tạo bài học trước ở trang Bài học.
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              <section className="space-y-3">
                <div className="text-sm font-bold text-[#172033]">Nội dung</div>
                <FieldLabel label="Bài học" help="Danh sách này chỉ gồm lesson thuộc lớp đang chọn.">
                  <select
                    value={newLessonId}
                    onChange={(event) => setNewLessonId(event.target.value)}
                    className="w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
                  >
                    {lessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </option>
                    ))}
                  </select>
                </FieldLabel>
                <FieldLabel label="Tên bài giao">
                  <input
                    value={newTitle}
                    onChange={(event) => setNewTitle(event.target.value)}
                    className="w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
                    placeholder="Tên bài tập"
                  />
                </FieldLabel>
                <FieldLabel label="Hướng dẫn" help="Nêu rõ học sinh cần xem gì, làm gì và nộp file nào.">
                  <textarea
                    value={newInstructions}
                    onChange={(event) => setNewInstructions(event.target.value)}
                    className="min-h-20 w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
                    placeholder="Ví dụ: Xem tài liệu, làm bài trong PDF, điền phiếu trả lời Word rồi nộp lại."
                  />
                </FieldLabel>
              </section>

              <section className="space-y-3">
                <div className="text-sm font-bold text-[#172033]">File bài giao</div>
                <FilePicker label="Upload PDF đề bài" value={worksheetFile} accept="application/pdf" onChange={setWorksheetFile} />
                <FilePicker
                  label="Upload phiếu trả lời Word"
                  value={answerTemplateFile}
                  accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={setAnswerTemplateFile}
                />
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-[#172033]">
                  <CalendarClock size={16} />
                  Deadline và điểm
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <FieldLabel label="Ngày hết hạn" help="Chọn ngày cuối cùng nhận bài.">
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(event) => setNewDueDate(event.target.value)}
                      className="w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
                    />
                  </FieldLabel>
                  <FieldLabel label="Giờ hết hạn" help="Nếu bỏ trống, hệ thống dùng 23:59.">
                    <input
                      type="time"
                      value={newDueTime}
                      onChange={(event) => setNewDueTime(event.target.value)}
                      className="w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
                    />
                  </FieldLabel>
                </div>
                <div className="grid gap-3">
                  <FieldLabel label="Điểm tối đa" help="Từ 1 đến 100, hỗ trợ bước 0.5 điểm.">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="0.5"
                      value={newMaxScore}
                      onChange={(event) => setNewMaxScore(event.target.value)}
                      className="w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
                    />
                  </FieldLabel>
                </div>
              </section>

              <button onClick={handleCreatePdfAssignment} disabled={isSaving || !newLessonId || !newTitle.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1d73e8] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                <Plus size={16} />
                Tạo bài tập
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {filteredItems.map((item) => (
            <button
              key={item.assignment_id}
              onClick={() => setSelectedId(item.assignment_id)}
              className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm transition ${
                selectedId === item.assignment_id ? "border-[#1d73e8] bg-[#f2f7ff]" : "border-[#e4eaf2] hover:bg-[#f8fafc]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-bold">{item.title}</div>
                  <div className="mt-1 text-sm text-[#667085]">{item.class_name}</div>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#edf1f5]">
                <div className="h-full bg-[#1d73e8]" style={{ width: `${Math.round(item.completion_rate * 100)}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-[#667085]">
                <span>{item.submitted_child_count}/{item.assigned_child_count} đã nộp</span>
                <span>{item.missing_child_count} chưa nộp</span>
                <span>Hạn {formatDate(item.due_at)}</span>
              </div>
            </button>
          ))}
          {isLoading && <div className="rounded-xl bg-white p-5 text-sm text-[#667085]">Đang tải bài giao...</div>}
          {!isLoading && !filteredItems.length && (
            <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 text-sm text-[#667085]">
              Không có bài giao phù hợp với bộ lọc.
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        {(error || message) && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              error ? "border-[#fecdca] bg-[#fff4f3] text-[#b42318]" : "border-[#abefc6] bg-[#f0fdf4] text-[#067647]"
            }`}
          >
            {error || message}
          </div>
        )}

        {detail ? (
          <AssignmentDetailPanel detail={detail} onSave={handleSave} onOpenSubmissions={onOpenSubmissions} onOpenStudentProfile={onOpenStudentProfile} isSaving={isSaving} />
        ) : (
          <div className="rounded-xl border border-[#dfe6ef] bg-white p-8 text-center text-[#667085] shadow-sm">
            <ListFilter className="mx-auto mb-3 text-[#98a2b3]" size={28} />
            Chọn một bài giao để xem chi tiết.
          </div>
        )}
      </div>
    </section>
  );
}
