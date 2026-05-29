import { Coins, FileText, Star, X } from "lucide-react";
import { useEffect, useState } from "react";

import { getStoredToken } from "../lib/auth";
import { getTeacherStudentProfile, type TeacherStudentProfile } from "../lib/teacher";

type StudentProfileDrawerProps = {
  classId: string | null;
  childId: string | null;
  onClose: () => void;
};

function formatDate(value: string | null) {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(value),
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function avatarColor(seed: string) {
  const colors = ["#1d73e8", "#12b76a", "#f79009", "#7a5af8", "#e11d48"];
  const index = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    ACTIVE: "Đang học",
    ARCHIVED: "Đã lưu trữ",
  };
  return labels[status] ?? status;
}

export function StudentProfileDrawer({ classId, childId, onClose }: StudentProfileDrawerProps) {
  const token = getStoredToken();
  const [profile, setProfile] = useState<TeacherStudentProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !classId || !childId) {
      setProfile(null);
      return;
    }

    setProfile(null);
    setError("");
    getTeacherStudentProfile(token, classId, childId)
      .then(setProfile)
      .catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : "Không tải được hồ sơ học sinh"),
      );
  }, [token, classId, childId]);

  if (!classId || !childId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <aside className="h-full w-full max-w-[460px] overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#edf1f5] bg-white px-5 py-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-[#667085]">Hồ sơ học sinh</div>
            <h2 className="text-lg font-bold text-[#172033]">{profile?.display_name ?? "Đang tải..."}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#d0d8e4] p-2 text-[#344054] hover:bg-[#f8fafc]"
            aria-label="Đóng hồ sơ học sinh"
          >
            <X size={18} />
          </button>
        </div>

        {error ? (
          <div className="m-5 rounded-lg border border-[#fecdca] bg-[#fff4f3] p-4 text-sm font-semibold text-[#b42318]">
            Không tải được hồ sơ học sinh: {error}
          </div>
        ) : !profile ? (
          <div className="m-5 rounded-lg bg-[#f8fafc] p-4 text-sm text-[#667085]">Đang tải hồ sơ...</div>
        ) : (
          <div className="space-y-4 p-5">
            <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover shadow-sm"
                  />
                ) : (
                  <div
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-xl font-black text-white shadow-sm"
                    style={{ backgroundColor: avatarColor(profile.display_name) }}
                  >
                    {initials(profile.display_name)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="break-words text-xl font-bold">{profile.display_name}</h3>
                  <div className="mt-1 text-sm font-semibold text-[#667085]">
                    {profile.nickname ? `${profile.nickname} - ` : ""}
                    {profile.birth_year ? `Sinh ${profile.birth_year}` : "Chưa có năm sinh"}
                    {profile.age != null ? ` - ${profile.age} tuổi` : ""}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-[#344054]">
                    <span className="rounded-full bg-[#f8fafc] px-2.5 py-1">{statusLabel(profile.status)}</span>
                    <span className="rounded-full bg-[#f8fafc] px-2.5 py-1">
                      {statusLabel(profile.membership_status)}
                    </span>
                  </div>
                </div>
              </div>
              {profile.profile_note && (
                <div className="mt-4 rounded-lg bg-[#f8fafc] p-3 text-sm leading-6 text-[#344054]">
                  {profile.profile_note}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
              <h3 className="font-bold">Phụ huynh và lớp</h3>
              <div className="mt-3 grid gap-3 text-sm">
                <div className="rounded-lg bg-[#f8fafc] p-3">
                  <div className="text-xs font-bold uppercase text-[#667085]">Phụ huynh</div>
                  <div className="mt-1 font-bold">{profile.parent.full_name}</div>
                  <div className="mt-1 break-words text-[#667085]">{profile.parent.email}</div>
                </div>
                <div className="rounded-lg bg-[#f8fafc] p-3">
                  <div className="text-xs font-bold uppercase text-[#667085]">Lớp</div>
                  <div className="mt-1 font-bold">{profile.class_name}</div>
                  <div className="mt-1 text-[#667085]">Vào lớp: {formatDate(profile.joined_at)}</div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#dfe6ef] bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#667085]">
                  <Star size={14} className="text-[#f4b400]" />
                  Sao
                </div>
                <div className="mt-2 text-2xl font-black">{profile.total_stars}</div>
              </div>
              <div className="rounded-xl border border-[#dfe6ef] bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#667085]">
                  <Coins size={14} className="text-[#1d73e8]" />
                  Xu
                </div>
                <div className="mt-2 text-2xl font-black">{profile.total_coins}</div>
              </div>
              <div className="rounded-xl border border-[#dfe6ef] bg-white p-4 shadow-sm">
                <div className="text-xs font-bold uppercase text-[#667085]">Bài giao</div>
                <div className="mt-2 text-2xl font-black">{profile.assignment_count}</div>
              </div>
              <div className="rounded-xl border border-[#dfe6ef] bg-white p-4 shadow-sm">
                <div className="text-xs font-bold uppercase text-[#667085]">Bài nộp</div>
                <div className="mt-2 text-2xl font-black">{profile.submission_count}</div>
              </div>
            </section>

            <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 font-bold">
                <FileText size={17} />
                Bài nộp gần đây
              </h3>
              <div className="mt-4 space-y-3">
                {profile.latest_submissions.map((submission) => (
                  <div key={submission.id} className="rounded-lg bg-[#f8fafc] p-3 text-sm">
                    <div className="font-bold">{submission.assignment_title}</div>
                    <div className="mt-1 text-xs font-semibold text-[#667085]">
                      {submission.grading_status} - {formatDate(submission.submitted_at ?? submission.created_at)}
                    </div>
                    <div className="mt-2 text-xs font-bold text-[#344054]">
                      {submission.score != null ? `Điểm ${submission.score}/${submission.max_score ?? 10}` : "Chưa chấm"}
                    </div>
                  </div>
                ))}
                {!profile.latest_submissions.length && (
                  <div className="rounded-lg bg-[#f8fafc] p-4 text-sm text-[#667085]">
                    Chưa có bài nộp trong lớp này.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}
