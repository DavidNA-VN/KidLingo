import {
  Edit2,
  ExternalLink,
  FileText,
  Link2,
  PlaySquare,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getStoredToken } from "../lib/auth";
import {
  addYoutubeMaterial,
  createLesson,
  deleteMaterial,
  getLesson,
  listLessons,
  updateMaterial,
  uploadPdfMaterial,
  type LessonDetail,
  type LessonMaterial,
  type LessonSummary,
} from "../lib/lessons";
import type { TeacherClassSummary } from "../lib/teacher";

type LessonStudioProps = {
  classes: TeacherClassSummary[];
  selectedClassId?: string | null;
};

function materialLabel(type: string) {
  if (type === "PDF") return "PDF";
  if (type === "YOUTUBE_VIDEO") return "Video YouTube";
  if (type === "SPEAKING_PROMPT") return "Luyện nói";
  if (type === "DOODLE_VOCAB") return "Doodle bắt buộc";
  return "Ghi chú";
}

function materialIcon(type: string) {
  if (type === "PDF") return FileText;
  if (type === "YOUTUBE_VIDEO") return PlaySquare;
  return FileText;
}

function materialHref(material: LessonMaterial) {
  if (material.type === "PDF" && material.file_url) return `http://localhost:8000${material.file_url}`;
  if (material.type === "YOUTUBE_VIDEO" && material.external_url) return material.external_url;
  return null;
}

type MaterialCardProps = {
  material: LessonMaterial;
  isLoading: boolean;
  onSave: (materialId: string, payload: { title: string; description: string; sort_order: number }) => Promise<void>;
  onDelete: (materialId: string) => Promise<void>;
};

function MaterialCard({ material, isLoading, onSave, onDelete }: MaterialCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(material.title);
  const [description, setDescription] = useState(material.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(material.sort_order));
  const href = materialHref(material);
  const Icon = materialIcon(material.type);

  useEffect(() => {
    setTitle(material.title);
    setDescription(material.description ?? "");
    setSortOrder(String(material.sort_order));
    setIsEditing(false);
  }, [material.id, material.title, material.description, material.sort_order]);

  async function handleSave() {
    await onSave(material.id, {
      title,
      description,
      sort_order: Number.parseInt(sortOrder, 10) || 0,
    });
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="rounded-lg border border-[#cfe0f6] bg-[#f7fbff] p-4">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold uppercase tracking-wide text-[#1d73e8]">{materialLabel(material.type)}</div>
            <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_96px]">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="min-w-0 rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm font-semibold outline-none focus:border-[#1d73e8]"
              />
              <input
                value={sortOrder}
                type="number"
                onChange={(event) => setSortOrder(event.target.value)}
                className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
                aria-label="Thứ tự"
              />
            </div>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 min-h-20 w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
              placeholder="Mô tả hoặc hướng dẫn ngắn"
            />
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || !title.trim()}
              className="inline-flex items-center gap-1 rounded-lg border border-[#1d73e8] px-3 py-2 text-xs font-bold text-[#155dcc] transition hover:bg-[#eef6ff] disabled:opacity-50"
            >
              <Save size={14} />
              Lưu
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#d0d8e4] px-3 py-2 text-xs font-bold text-[#344054] transition hover:bg-white"
            >
              <X size={14} />
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <article className="rounded-lg border border-[#e4eaf2] bg-white p-4 shadow-sm">
      <div className="flex min-w-0 flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#1d73e8]">
            <Icon size={16} />
            {materialLabel(material.type)}
          </div>
          <h4 className="mt-2 break-words text-lg font-bold text-[#172033]">{material.title}</h4>
          {material.description && (
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#667085]">{material.description}</p>
          )}

          {material.type === "PDF" && material.file_url && (
            <div className="mt-3 rounded-lg bg-[#f8fafc] px-3 py-2 text-sm font-semibold text-[#344054]">
              <span className="break-all">{material.file_url.split("/").pop()}</span>
            </div>
          )}

          {material.type === "YOUTUBE_VIDEO" && material.youtube_video_id && (
            <div className="mt-3 overflow-hidden rounded-lg border border-[#dfe6ef] bg-black">
              <iframe
                className="aspect-video w-full"
                src={`https://www.youtube.com/embed/${material.youtube_video_id}`}
                title={material.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-[#d0d8e4] px-3 py-2 text-xs font-bold text-[#344054] transition hover:bg-[#f8fafc]"
            >
              <ExternalLink size={14} />
              Mở
            </a>
          )}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-[#1d73e8] px-3 py-2 text-xs font-bold text-[#155dcc] transition hover:bg-[#f2f7ff]"
          >
            <Edit2 size={14} />
            Sửa
          </button>
          <button
            type="button"
            onClick={() => onDelete(material.id)}
            disabled={isLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-[#fecdca] px-3 py-2 text-xs font-bold text-[#b42318] transition hover:bg-[#fff4f3] disabled:opacity-50"
          >
            <Trash2 size={14} />
            Gỡ
          </button>
        </div>
      </div>
    </article>
  );
}

export function LessonStudio({ classes, selectedClassId }: LessonStudioProps) {
  const token = getStoredToken();
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);
  const [title, setTitle] = useState("Buổi 1 - Tài liệu và luyện nói");
  const [description, setDescription] = useState("Tài liệu PDF, video luyện nói và hướng dẫn học trên lớp.");
  const [pdfTitle, setPdfTitle] = useState("Phiếu bài tập buổi 1");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [youtubeTitle, setYoutubeTitle] = useState("Video luyện phát âm");
  const [youtubeUrl, setYoutubeUrl] = useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [activeAddForm, setActiveAddForm] = useState<"PDF" | "YOUTUBE_VIDEO" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );
  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId) ?? null,
    [lessons, selectedLessonId],
  );
  const visibleMaterials = useMemo(
    () => lessonDetail?.materials.filter((material) => material.type !== "DOODLE_VOCAB") ?? [],
    [lessonDetail?.materials],
  );

  async function loadLessons(selectFirst = false) {
    if (!token || !selectedClassId) return;
    const items = await listLessons(token, selectedClassId);
    setLessons(items);
    if (selectFirst && items[0]) setSelectedLessonId(items[0].id);
    if (!items.length) {
      setSelectedLessonId(null);
      setLessonDetail(null);
    }
  }

  async function loadDetail(lessonId: string) {
    if (!token) return;
    const detail = await getLesson(token, lessonId);
    setLessonDetail(detail);
  }

  useEffect(() => {
    setLessons([]);
    setSelectedLessonId(null);
    setLessonDetail(null);
    setActiveAddForm(null);
    if (!selectedClassId) return;
    loadLessons(true).catch((requestError) =>
      setError(requestError instanceof Error ? requestError.message : "Không tải được bài học"),
    );
  }, [token, selectedClassId]);

  useEffect(() => {
    if (selectedLessonId) {
      loadDetail(selectedLessonId).catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : "Không tải được chi tiết bài học"),
      );
    } else {
      setLessonDetail(null);
    }
  }, [selectedLessonId]);

  async function runAction(action: () => Promise<void>, success: string) {
    setError("");
    setMessage("");
    setIsLoading(true);
    try {
      await action();
      setMessage(success);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateLesson() {
    if (!token || !selectedClassId || !title.trim()) return;
    await runAction(async () => {
      const created = await createLesson(token, { class_id: selectedClassId, title, description });
      await loadLessons();
      setSelectedLessonId(created.id);
    }, "Đã tạo bài học.");
  }

  async function handleUploadPdf() {
    if (!token || !selectedLessonId || !pdfFile || !pdfTitle.trim()) return;
    await runAction(async () => {
      await uploadPdfMaterial(token, selectedLessonId, { title: pdfTitle, file: pdfFile, sort_order: 1 });
      await Promise.all([loadLessons(), loadDetail(selectedLessonId)]);
      setPdfFile(null);
      setActiveAddForm(null);
    }, "Đã lưu PDF.");
  }

  async function handleAddYoutube() {
    if (!token || !selectedLessonId || !youtubeTitle.trim() || !youtubeUrl.trim()) return;
    await runAction(async () => {
      await addYoutubeMaterial(token, selectedLessonId, {
        title: youtubeTitle,
        external_url: youtubeUrl,
        description: "Học sinh xem video và luyện nói theo.",
        sort_order: 2,
      });
      await Promise.all([loadLessons(), loadDetail(selectedLessonId)]);
      setActiveAddForm(null);
    }, "Đã thêm video YouTube.");
  }

  async function handleUpdateMaterial(
    materialId: string,
    payload: { title: string; description: string; sort_order: number },
  ) {
    if (!token || !selectedLessonId) return;
    await runAction(async () => {
      await updateMaterial(token, selectedLessonId, materialId, {
        title: payload.title,
        description: payload.description,
        sort_order: payload.sort_order,
      });
      await Promise.all([loadLessons(), loadDetail(selectedLessonId)]);
    }, "Đã cập nhật tài liệu.");
  }

  async function handleDeleteMaterial(materialId: string) {
    if (!token || !selectedLessonId) return;
    const confirmed = window.confirm("Gỡ tài liệu này khỏi bài học?");
    if (!confirmed) return;
    await runAction(async () => {
      await deleteMaterial(token, selectedLessonId, materialId);
      await Promise.all([loadLessons(), loadDetail(selectedLessonId)]);
    }, "Đã gỡ tài liệu.");
  }

  return (
    <section className="grid min-w-0 gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-bold">Bài học</h2>
            <p className="mt-1 text-sm text-[#667085]">
              {selectedClass ? `Thư viện nội dung của ${selectedClass.name}.` : "Chọn lớp để xem bài học."}
            </p>
          </div>
          <div className="mt-4 space-y-2">
            {lessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => setSelectedLessonId(lesson.id)}
                className={`w-full rounded-lg border p-4 text-left transition ${
                  lesson.id === selectedLessonId
                    ? "border-[#1d73e8] bg-[#f2f7ff]"
                    : "border-[#e4eaf2] hover:bg-[#f8fafc]"
                }`}
              >
                <div className="break-words font-bold">{lesson.title}</div>
                <div className="mt-2 flex gap-3 text-xs text-[#667085]">
                  <span>{lesson.material_count} tài liệu</span>
                  <span>{lesson.assignment_count} bài giao</span>
                </div>
              </button>
            ))}
            {!lessons.length && (
              <div className="rounded-lg bg-[#f8fafc] p-4 text-sm text-[#667085]">
                Chưa có bài học trong lớp này.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <h3 className="font-bold">Tạo bài học mới</h3>
          <div className="mt-4 space-y-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
              placeholder="Tên bài học"
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-20 w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
              placeholder="Mô tả"
            />
            <button
              onClick={handleCreateLesson}
              disabled={isLoading || !selectedClassId || !title.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1d73e8] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#155dcc] disabled:opacity-60"
            >
              <Plus size={16} />
              Tạo bài học
            </button>
          </div>
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        {(message || error) && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              error ? "border-[#fecdca] bg-[#fff4f3] text-[#b42318]" : "border-[#abefc6] bg-[#f0fdf4] text-[#067647]"
            }`}
          >
            {error || message}
          </div>
        )}

        <div className="rounded-xl border border-[#dfe6ef] bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <h2 className="break-words text-2xl font-bold">{selectedLesson?.title ?? "Chọn một bài học"}</h2>
              <p className="mt-2 max-w-2xl whitespace-pre-wrap break-words text-sm leading-6 text-[#667085]">
                {lessonDetail?.description ?? "Bài học có thể chứa PDF, video YouTube, ghi chú và prompt luyện nói."}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#eaf3ff] px-3 py-1 text-sm font-bold text-[#155dcc]">
              {visibleMaterials.length} tài liệu
            </span>
          </div>
        </div>

        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <h3 className="font-bold">Nội dung bài học</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAddForm((current) => (current === "PDF" ? null : "PDF"))}
                  disabled={!selectedLessonId}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#d0d8e4] px-3 py-2 text-xs font-bold text-[#344054] transition hover:bg-[#f8fafc] disabled:opacity-50"
                >
                  <Upload size={14} />
                  Thêm PDF
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAddForm((current) => (current === "YOUTUBE_VIDEO" ? null : "YOUTUBE_VIDEO"))}
                  disabled={!selectedLessonId}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#d0d8e4] px-3 py-2 text-xs font-bold text-[#344054] transition hover:bg-[#f8fafc] disabled:opacity-50"
                >
                  <Link2 size={14} />
                  Thêm video
                </button>
              </div>
            </div>

            {activeAddForm === "PDF" && (
              <div className="mt-4 rounded-lg border border-dashed border-[#b8c4d6] bg-[#f8fafc] p-4">
                <h4 className="font-bold">Upload PDF</h4>
                <div className="mt-3 space-y-3">
                  <input
                    value={pdfTitle}
                    onChange={(event) => setPdfTitle(event.target.value)}
                    className="w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
                    placeholder="Tên tài liệu PDF"
                  />
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
                    className="block w-full min-w-0 overflow-hidden rounded-lg border border-dashed border-[#b8c4d6] bg-white px-3 py-3 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-[#172033] file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleUploadPdf}
                      disabled={!selectedLessonId || !pdfFile || isLoading || !pdfTitle.trim()}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#172033] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      <Save size={16} />
                      Lưu PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAddForm(null)}
                      className="rounded-lg border border-[#d0d8e4] px-4 py-2.5 text-sm font-bold text-[#344054]"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeAddForm === "YOUTUBE_VIDEO" && (
              <div className="mt-4 rounded-lg border border-dashed border-[#b8c4d6] bg-[#f8fafc] p-4">
                <h4 className="font-bold">Video YouTube</h4>
                <div className="mt-3 space-y-3">
                  <input
                    value={youtubeTitle}
                    onChange={(event) => setYoutubeTitle(event.target.value)}
                    className="w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
                    placeholder="Tên video"
                  />
                  <input
                    value={youtubeUrl}
                    onChange={(event) => setYoutubeUrl(event.target.value)}
                    className="w-full min-w-0 rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleAddYoutube}
                      disabled={!selectedLessonId || isLoading || !youtubeTitle.trim() || !youtubeUrl.trim()}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#1d73e8] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      <Link2 size={16} />
                      Lưu video
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAddForm(null)}
                      className="rounded-lg border border-[#d0d8e4] px-4 py-2.5 text-sm font-bold text-[#344054]"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-3">
              {visibleMaterials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  isLoading={isLoading}
                  onSave={handleUpdateMaterial}
                  onDelete={handleDeleteMaterial}
                />
              ))}
              {!visibleMaterials.length && (
                <div className="rounded-lg bg-[#f8fafc] p-5 text-sm text-[#667085]">
                  Chưa có tài liệu. Hãy thêm PDF hoặc video YouTube.
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
              <h3 className="font-bold">Hoạt động cố định</h3>
              <div className="mt-3 rounded-lg bg-[#f8fafc] p-4">
                <div className="text-sm font-bold text-[#172033]">Doodle từ vựng</div>
                <p className="mt-2 text-sm leading-6 text-[#667085]">
                  Hoạt động doodle được mở theo bài học/lớp, không cần thêm như một tài liệu riêng.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
