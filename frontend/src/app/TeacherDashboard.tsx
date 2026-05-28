import {
  Archive,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Coins,
  Copy,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Plus,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { LessonStudio } from "./LessonStudio";
import { TeacherAssignments } from "./TeacherAssignments";
import { TeacherChat } from "./TeacherChat";
import { TeacherOverview } from "./TeacherOverview";
import { TeacherSubmissions } from "./TeacherSubmissions";
import type { AuthUser } from "../lib/auth";
import { getStoredToken } from "../lib/auth";
import {
  createTeacherClass,
  getTeacherClassDetail,
  listTeacherClasses,
  updateChildMembership,
  type TeacherClassDetail,
  type TeacherClassSummary,
} from "../lib/teacher";

type TeacherDashboardProps = {
  user: AuthUser;
  onLogout: () => void;
};

const navItems = [
  { label: "Tổng quan", icon: LayoutDashboard },
  { label: "Lớp học", icon: UsersRound },
  { label: "Bài học", icon: BookOpen },
  { label: "Bài giao", icon: GraduationCap },
  { label: "Bài nộp", icon: CheckCircle2 },
  { label: "Trao đổi", icon: MessageSquareText },
];

function displayNavLabel(label: string) {
  return label;
}

function formatDate(value: string | null) {
  if (!value) return "Chưa có hạn";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(value));
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "ACTIVE" || status === "PUBLISHED";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive ? "bg-[#e8f7ef] text-[#067647]" : "bg-[#f2f4f7] text-[#667085]"
      }`}
    >
      {status === "ACTIVE"
        ? "Đang học"
        : status === "ARCHIVED"
          ? "Đã lưu trữ"
          : status === "PUBLISHED"
            ? "Đã giao"
            : status}
    </span>
  );
}

export function TeacherDashboard({ user, onLogout }: TeacherDashboardProps) {
  const [classes, setClasses] = useState<TeacherClassSummary[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classDetail, setClassDetail] = useState<TeacherClassDetail | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [activeSection, setActiveSection] = useState("Tổng quan");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [copiedClassCode, setCopiedClassCode] = useState("");
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const token = getStoredToken();

  const totals = useMemo(
    () => ({
      classes: classes.length,
      children: classes.reduce((sum, item) => sum + item.active_child_count, 0),
      assignments: classes.reduce((sum, item) => sum + item.assignment_count, 0),
      submissions: classes.reduce((sum, item) => sum + item.submission_count, 0),
    }),
    [classes],
  );

  async function loadClasses(selectFirst = false) {
    if (!token) return;
    const items = await listTeacherClasses(token);
    setClasses(items);
    if (selectFirst || !selectedClassId) {
      setSelectedClassId(items[0]?.id ?? null);
    }
  }

  async function loadClassDetail(classId: string) {
    if (!token) return;
    setIsDetailLoading(true);
    try {
      const detail = await getTeacherClassDetail(token, classId);
      setClassDetail(detail);
    } finally {
      setIsDetailLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    loadClasses(true)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Cannot load classes"))
  }, [token]);

  useEffect(() => {
    if (selectedClassId) {
      loadClassDetail(selectedClassId).catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : "Cannot load class detail"),
      );
    } else {
      setClassDetail(null);
    }
  }, [selectedClassId]);

  async function handleCreateClass() {
    if (!token || !newClassName.trim()) return;
    setError("");
    try {
      const created = await createTeacherClass(token, {
        name: newClassName,
        description: newClassDescription || undefined,
      });
      setNewClassName("");
      setNewClassDescription("");
      await loadClasses();
      setSelectedClassId(created.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Cannot create class");
    }
  }

  async function handleArchiveChild(childId: string) {
    if (!token || !selectedClassId) return;
    await updateChildMembership(token, selectedClassId, childId, "ARCHIVED");
    await Promise.all([loadClasses(), loadClassDetail(selectedClassId)]);
  }

  async function handleCopyClassCode(classCode: string | null) {
    if (!classCode) return;
    await navigator.clipboard.writeText(classCode);
    setCopiedClassCode(classCode);
    window.setTimeout(() => setCopiedClassCode(""), 1600);
  }

  function handleOpenSection(section: string, classId?: string, assignmentId?: string) {
    setActiveSection(section);
    if (classId) {
      setSelectedClassId(classId);
    }
    setSelectedAssignmentId(assignmentId ?? null);
  }

  const selectedClass = classes.find((item) => item.id === selectedClassId) ?? null;
  const scopedTotals = selectedClass
    ? {
        classes: 1,
        children: selectedClass.active_child_count,
        assignments: selectedClass.assignment_count,
        submissions: selectedClass.submission_count,
      }
    : totals;
  const displayTotals = scopedTotals;
  const showClassContext = true;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f7fb] text-[#172033]">
      <header className="sticky top-0 z-20 border-b border-[#dfe6ef] bg-white/95 backdrop-blur">
        <div className="flex w-full items-center justify-between px-6 py-3 lg:pl-[304px]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1d73e8] text-white shadow-sm">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1d73e8]">
                Doodle English
              </p>
            <h1 className="text-xl font-bold text-[#172033]">Không gian giáo viên</h1>
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

      <section className="w-full px-4 py-5 sm:px-6 lg:pl-[304px]">
        <aside className="rounded-xl border border-[#dfe6ef] bg-white p-3 shadow-sm lg:fixed lg:left-0 lg:top-0 lg:z-30 lg:h-screen lg:w-[280px] lg:overflow-y-auto lg:rounded-none lg:border-y-0 lg:border-l-0 lg:p-5">
          <div className="mb-3 rounded-lg bg-[#f5f9ff] px-3 py-2">
            <div className="text-xs font-bold uppercase tracking-wide text-[#1d73e8]">Teacher</div>
            <div className="mt-1 truncate text-sm font-semibold text-[#172033]">{user.full_name}</div>
          </div>
          <nav className="space-y-1">
            {navItems.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => setActiveSection(label)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                  label === activeSection
                    ? "bg-[#eaf3ff] text-[#155dcc]"
                    : "text-[#475467] hover:bg-[#f5f8fc]"
                }`}
              >
                <Icon size={17} />
                {displayNavLabel(label)}
              </button>
            ))}
          </nav>
        </aside>

        <div className="mt-5 max-w-[calc(1440px-304px)] space-y-6 lg:mt-0">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-[#fecdca] bg-[#fff4f3] px-4 py-3 text-sm font-semibold text-[#b42318]">
              <CircleAlert size={18} />
              {error}
            </div>
          )}

          <section className="grid gap-4 md:grid-cols-4">
            {[
              ["Lớp học", displayTotals.classes, UsersRound],
              ["Học sinh đang học", displayTotals.children, GraduationCap],
              ["Bài giao", displayTotals.assignments, BookOpen],
              ["Bài nộp", displayTotals.submissions, CheckCircle2],
            ].map(([label, value, Icon]) => (
              <div key={label as string} className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-[#667085]">{label as string}</div>
                  <Icon className="text-[#1d73e8]" size={20} />
                </div>
                <div className="mt-3 text-3xl font-bold">{value as number}</div>
              </div>
            ))}
          </section>

          {showClassContext && (
            <section className="rounded-xl border border-[#dfe6ef] bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-bold text-[#172033]">Ngữ cảnh lớp</div>
                  <div className="text-sm text-[#667085]">
                    {selectedClass ? `${selectedClass.name} · ${selectedClass.class_code ?? "Chưa có mã"}` : "Chọn lớp để xem dữ liệu"}
                  </div>
                </div>
                <select
                  value={selectedClassId ?? ""}
                  onChange={(event) => setSelectedClassId(event.target.value || null)}
                  className="min-w-[260px] rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm font-semibold outline-none focus:border-[#1d73e8]"
                >
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </section>
          )}

          {activeSection === "Tổng quan" ? (
            <TeacherOverview selectedClassId={selectedClassId} selectedClassName={selectedClass?.name} onOpenSection={handleOpenSection} />
          ) : activeSection === "Bài học" ? (
            <LessonStudio classes={classes} selectedClassId={selectedClassId} />
          ) : activeSection === "Bài giao" ? (
            <TeacherAssignments classes={classes} selectedClassId={selectedClassId} onOpenSubmissions={handleOpenSection} />
          ) : activeSection === "Bài nộp" ? (
            <TeacherSubmissions classes={classes} selectedClassId={selectedClassId} selectedAssignmentId={selectedAssignmentId} />
          ) : activeSection === "Trao đổi" ? (
            <TeacherChat classes={classes} selectedClassId={selectedClassId} />
          ) : (
          <section className="grid min-w-0 gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
                <h3 className="font-bold">Tạo lớp mới</h3>
                <p className="mt-1 text-sm text-[#667085]">Tạo lớp xong hệ thống sẽ tự chuyển ngữ cảnh sang lớp mới.</p>
                <div className="mt-4 space-y-3">
                  <input
                    value={newClassName}
                    onChange={(event) => setNewClassName(event.target.value)}
                    className="w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
                    placeholder="Tên lớp"
                  />
                  <textarea
                    value={newClassDescription}
                    onChange={(event) => setNewClassDescription(event.target.value)}
                    className="min-h-20 w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
                    placeholder="Mô tả ngắn"
                  />
                  <button
                    onClick={handleCreateClass}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1d73e8] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#155dcc]"
                  >
                    <Plus size={16} />
                    Tạo lớp
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {!classDetail || isDetailLoading ? (
                <div className="rounded-xl border border-[#dfe6ef] bg-white p-8 text-center text-[#667085] shadow-sm">
                  Đang tải không gian lớp học...
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-[#dfe6ef] bg-white p-6 shadow-sm">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <h2 className="text-2xl font-bold">{classDetail.name}</h2>
                          <StatusBadge status="ACTIVE" />
                        </div>
                        <p className="max-w-2xl text-sm text-[#667085]">
                          {classDetail.description ?? "Chưa có mô tả."}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-[#344054]">
                          <span>Mã lớp: {classDetail.class_code ?? "Chưa thiết lập"}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyClassCode(classDetail.class_code)}
                            disabled={!classDetail.class_code}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#d0d8e4] px-2.5 py-1.5 text-xs font-bold text-[#344054] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Copy size={14} />
                            {copiedClassCode === classDetail.class_code ? "Đã copy" : "Copy"}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-lg bg-[#f5f9ff] px-4 py-3">
                          <div className="text-2xl font-bold">{classDetail.active_child_count}</div>
                          <div className="text-xs text-[#667085]">Đang học</div>
                        </div>
                        <div className="rounded-lg bg-[#f7f9fc] px-4 py-3">
                          <div className="text-2xl font-bold">{classDetail.assignment_count}</div>
                          <div className="text-xs text-[#667085]">Bài giao</div>
                        </div>
                        <div className="rounded-lg bg-[#f7f9fc] px-4 py-3">
                          <div className="text-2xl font-bold">{classDetail.submission_count}</div>
                          <div className="text-xs text-[#667085]">Bài nộp</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid min-w-0 gap-4">
                    <section className="min-w-0 rounded-xl border border-[#dfe6ef] bg-white shadow-sm">
                      <div className="border-b border-[#edf1f5] px-5 py-4">
                        <h3 className="font-bold">Danh sách học sinh</h3>
                        <p className="text-sm text-[#667085]">Các hồ sơ trẻ đang được liên kết với lớp này.</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left text-sm">
                          <thead className="bg-[#f8fafc] text-xs uppercase tracking-wide text-[#667085]">
                            <tr>
                              <th className="px-4 py-3">Học sinh</th>
                              <th className="px-4 py-3">Phụ huynh</th>
                              <th className="px-4 py-3">Thưởng</th>
                              <th className="px-4 py-3">Trạng thái</th>
                              <th className="px-4 py-3 text-right">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#edf1f5]">
                            {classDetail.roster.map((child) => (
                              <tr key={child.id} className="align-middle">
                                <td className="px-4 py-4">
                                  <div className="font-bold">{child.display_name}</div>
                                  <div className="text-xs text-[#667085]">
                                    Năm sinh {child.birth_year ?? "N/A"}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="font-semibold">{child.parent.full_name}</div>
                                  <div className="max-w-[190px] truncate text-xs text-[#667085]">{child.parent.email}</div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex gap-3">
                                    <span className="inline-flex items-center gap-1 font-semibold">
                                      <Star size={15} className="text-[#f4b400]" />
                                      {child.total_stars}
                                    </span>
                                    <span className="inline-flex items-center gap-1 font-semibold">
                                      <Coins size={15} className="text-[#1d73e8]" />
                                      {child.total_coins}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <StatusBadge status={child.membership_status} />
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <button
                                    onClick={() => handleArchiveChild(child.id)}
                                    disabled={child.membership_status === "ARCHIVED"}
                                    className="inline-flex items-center gap-1 rounded-lg border border-[#d0d8e4] px-3 py-2 text-xs font-bold text-[#344054] transition hover:bg-[#f7f9fc] disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Archive size={14} />
                                    Lưu trữ
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>

                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
                      <h3 className="font-bold">Bài giao</h3>
                      <div className="mt-4 space-y-3">
                        {classDetail.assignments.map((assignment) => (
                          <div key={assignment.id} className="rounded-lg bg-[#f8fafc] p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-bold">{assignment.title}</div>
                                <div className="text-sm text-[#667085]">{assignment.lesson_title}</div>
                              </div>
                              <StatusBadge status={assignment.status} />
                            </div>
                            <div className="mt-3 flex gap-4 text-xs font-semibold text-[#667085]">
                              <span>Hạn {formatDate(assignment.due_at)}</span>
                              <span>{assignment.submission_count} bài nộp</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
                      <h3 className="font-bold">Bài nộp gần đây</h3>
                      <div className="mt-4 space-y-3">
                        {classDetail.recent_submissions.map((submission) => (
                          <div key={submission.id} className="rounded-lg bg-[#f8fafc] p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-bold">{submission.child_name}</div>
                                <div className="text-sm text-[#667085]">{submission.assignment_title}</div>
                              </div>
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                  submission.is_correct
                                    ? "bg-[#e8f7ef] text-[#067647]"
                                    : "bg-[#fff3e6] text-[#b54708]"
                                }`}
                              >
                                {submission.is_correct ? "Đúng" : "Cần xem lại"}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-[#667085]">
                              <span>Dự đoán: {submission.predicted_class}</span>
                              <span>{Math.round(submission.confidence * 100)}% tin cậy</span>
                              <span>{submission.stars_earned} sao</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </>
              )}
            </div>
          </section>
          )}
        </div>
      </section>
    </main>
  );
}
