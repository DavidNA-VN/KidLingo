import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Coins,
  Eraser,
  FileText,
  Loader2,
  Mic,
  PenLine,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Volume2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";

import { DOODLE_ALPHABETS, DOODLE_VOCABULARY } from "../lib/doodleVocabulary";
import { createSubmission, predictDoodle, type DoodlePrediction, type SubmissionResult } from "../lib/learning";
import type { LessonMaterial, ParentAssignmentDetail, ParentChild } from "../lib/parent";
import { isPronunciationPassed, speakEnglish, startEnglishRecognition } from "../lib/speech";

type ChildLearningSessionProps = {
  token: string;
  child: ParentChild;
  assignment: ParentAssignmentDetail;
  onBack: () => void;
  onCompleted: () => void;
};

function materialLabel(type: string) {
  const labels: Record<string, string> = {
    PDF: "PDF",
    YOUTUBE_VIDEO: "Video luyện nói",
    SPEAKING_PROMPT: "Bài nói",
    DOODLE_VOCAB: "Doodle",
    NOTE: "Ghi chú",
  };
  return labels[type] ?? type;
}

function LearningMaterial({ material }: { material: LessonMaterial }) {
  return (
    <article className="rounded-xl border border-[#dfe6ef] bg-white p-4 shadow-sm">
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
            Mở tài liệu
          </a>
        )}
      </div>
      <h3 className="font-bold text-[#172033]">{material.title}</h3>
      {material.description && <p className="mt-1 text-sm leading-6 text-[#667085]">{material.description}</p>}
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
    </article>
  );
}

export function ChildLearningSession({ token, child, assignment, onBack, onCompleted }: ChildLearningSessionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(DOODLE_ALPHABETS[0] ?? "A");
  const visibleItems = useMemo(
    () => DOODLE_VOCABULARY.filter((item) => item.english.toUpperCase().startsWith(selectedLetter)),
    [selectedLetter],
  );
  const [targetClass, setTargetClass] = useState(visibleItems[0]?.class_key ?? DOODLE_VOCABULARY[0].class_key);
  const targetItem = useMemo(
    () => DOODLE_VOCABULARY.find((item) => item.class_key === targetClass) ?? DOODLE_VOCABULARY[0],
    [targetClass],
  );
  const [prediction, setPrediction] = useState<DoodlePrediction | null>(null);
  const [submission, setSubmission] = useState<SubmissionResult | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isCorrectPrediction = Boolean(prediction?.is_correct);
  const speechPassed = isCorrectPrediction ? isPronunciationPassed(transcript, targetItem.english) : false;

  useEffect(() => {
    const first = visibleItems[0];
    if (first && !visibleItems.some((item) => item.class_key === targetClass)) {
      setTargetClass(first.class_key);
      setPrediction(null);
      setSubmission(null);
      setTranscript("");
    }
  }, [selectedLetter, targetClass, visibleItems]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 12;
    context.strokeStyle = "#111827";
  }, []);

  function getCanvasPoint(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function startDrawing(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const point = getCanvasPoint(event);
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
    setIsDrawing(true);
  }

  function draw(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const point = getCanvasPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function resetResult() {
    setPrediction(null);
    setSubmission(null);
    setTranscript("");
    setError("");
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    resetResult();
  }

  async function handlePredict() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsPredicting(true);
    setError("");
    setSubmission(null);
    try {
      const result = await predictDoodle(token, {
        child_id: child.id,
        assignment_id: assignment.assignment_id,
        image_data_url: canvas.toDataURL("image/png"),
        target_class: targetItem.class_key,
        top_k: 3,
      });
      setPrediction(result);
      setTranscript("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không nhận dạng được doodle");
    } finally {
      setIsPredicting(false);
    }
  }

  function handleListen() {
    if (!isCorrectPrediction) return;
    setError("");
    setIsListening(true);
    startEnglishRecognition(
      (value) => setTranscript(value),
      () => setIsListening(false),
      () => {
        setIsListening(false);
        setError("Trình duyệt chưa hỗ trợ nhận diện giọng nói. Bé có thể nhập câu đọc thủ công để demo.");
      },
    );
  }

  async function handleSubmit() {
    const canvas = canvasRef.current;
    if (!canvas || !prediction || !isCorrectPrediction) return;
    setIsSubmitting(true);
    setError("");
    try {
      const result = await createSubmission(token, {
        child_id: child.id,
        assignment_id: assignment.assignment_id,
        target_class: targetItem.class_key,
        predicted_class: prediction.predicted_class,
        confidence: prediction.confidence,
        is_correct: prediction.is_correct,
        top_predictions: prediction.top_predictions,
        canvas_image_data_url: canvas.toDataURL("image/png"),
        speech_transcript: transcript || null,
        speech_passed: speechPassed,
      });
      setSubmission(result);
      onCompleted();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không lưu được bài nộp");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f7fb] text-[#172033]">
      <header className="border-b border-[#dfe6ef] bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#d0d8e4] bg-white text-[#344054] hover:bg-[#f8fafc]"
              aria-label="Quay lại"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#087443]">Buổi học của {child.display_name}</p>
              <h1 className="text-xl font-bold">{assignment.title}</h1>
            </div>
          </div>
          <div className="rounded-lg bg-[#ecfdf3] px-3 py-2 text-sm font-bold text-[#087443]">
            {child.total_stars} sao · {child.total_coins} xu
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1440px] gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="min-w-0 space-y-5">
          <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-bold">{assignment.lesson_title}</h2>
                <p className="mt-2 max-w-3xl rounded-lg bg-[#f8fafc] p-3 text-sm leading-6 text-[#344054]">
                  {assignment.instructions ?? "Hoàn thành tài liệu giáo viên giao, sau đó chơi doodle để luyện từ vựng tiếng Anh."}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#edf4ff] px-3 py-1.5 text-xs font-bold text-[#155dcc]">
                <Sparkles size={14} />
                Doodle game 10 từ
              </span>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            {assignment.materials
              .filter((material) => material.type !== "DOODLE_VOCAB")
              .map((material) => (
                <LearningMaterial key={material.id} material={material} />
              ))}
          </section>

          <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <PenLine size={20} className="text-[#12b76a]" />
                Trò chơi doodle luyện từ vựng
              </h2>
              <p className="mt-1 text-sm text-[#667085]">
                Chọn chữ cái đầu, nhìn nghĩa tiếng Việt rồi vẽ hình. Khi AI đoán đúng, bé sẽ mở khóa từ tiếng Anh và phần luyện đọc.
              </p>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {DOODLE_ALPHABETS.map((letter) => (
                <button
                  key={letter}
                  onClick={() => {
                    setSelectedLetter(letter);
                    resetResult();
                  }}
                  className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-black ${
                    selectedLetter === letter
                      ? "border-[#12b76a] bg-[#12b76a] text-white"
                      : "border-[#d0d8e4] bg-white text-[#344054] hover:bg-[#f8fafc]"
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <button
                  key={item.class_key}
                  onClick={() => {
                    setTargetClass(item.class_key);
                    clearCanvas();
                  }}
                  className={`rounded-xl border p-4 text-left transition ${
                    targetItem.class_key === item.class_key
                      ? "border-[#12b76a] bg-[#ecfdf3]"
                      : "border-[#e4eaf2] bg-[#f8fafc] hover:bg-white"
                  }`}
                >
                  <div className="text-xs font-bold uppercase tracking-[0.12em] text-[#667085]">Hãy vẽ</div>
                  <div className="mt-1 text-xl font-black text-[#172033]">{item.vi}</div>
                </button>
              ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="min-w-0">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={420}
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerLeave={stopDrawing}
                  className="h-[360px] w-full touch-none rounded-xl border border-[#cfd8e3] bg-white shadow-inner"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={clearCanvas} className="inline-flex items-center gap-2 rounded-lg border border-[#d0d8e4] px-4 py-2.5 text-sm font-bold text-[#344054] hover:bg-[#f8fafc]">
                    <Eraser size={16} />
                    Xóa vẽ lại
                  </button>
                  <button onClick={handlePredict} disabled={isPredicting} className="inline-flex items-center gap-2 rounded-lg bg-[#12b76a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0f9f5f] disabled:opacity-60">
                    {isPredicting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    Kiểm tra bằng AI
                  </button>
                </div>
              </div>

              <aside className="rounded-xl border border-[#e4eaf2] bg-[#f8fafc] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#667085]">Đề bài</p>
                <h3 className="mt-2 text-3xl font-black text-[#172033]">{targetItem.vi}</h3>
                <p className="mt-2 text-sm leading-6 text-[#667085]">
                  Bé hãy vẽ hình này vào khung bên trái. Từ tiếng Anh sẽ chỉ hiện ra khi AI nhận dạng đúng.
                </p>
              </aside>
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold">
              <Award size={19} className="text-[#f4b400]" />
              Kết quả trò chơi
            </h2>

            {!prediction && (
              <div className="mt-4 rounded-lg bg-[#f8fafc] p-4 text-sm leading-6 text-[#667085]">
                Bé vẽ theo nghĩa tiếng Việt. Nếu AI nhận đúng, hệ thống sẽ hiện từ tiếng Anh, phiên âm, nghe mẫu và phần đọc thử.
              </div>
            )}

            {prediction && !isCorrectPrediction && (
              <div className="mt-4 rounded-xl border border-[#fedf89] bg-[#fffbeb] p-4">
                <div className="flex items-center gap-2 font-bold text-[#b54708]">
                  <XCircle size={20} />
                  Gần đúng rồi, mình thử vẽ lại nhé
                </div>
                <p className="mt-2 text-sm leading-6 text-[#7a5b12]">
                  AI chưa nhận ra đúng hình “{targetItem.vi}”. Bé có thể thêm nét rõ hơn, vẽ lớn hơn hoặc xóa để thử lại.
                </p>
              </div>
            )}

            {prediction && isCorrectPrediction && (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-[#abefc6] bg-[#f0fdf4] p-4">
                  <div className="flex items-center gap-2 font-bold text-[#087443]">
                    <CheckCircle2 size={20} />
                    Đúng rồi
                  </div>
                  <div className="mt-3 text-3xl font-black">{targetItem.english}</div>
                  <div className="text-lg font-bold text-[#12b76a]">{targetItem.vi}</div>
                  <div className="mt-1 text-sm font-semibold text-[#667085]">{targetItem.phonetic}</div>
                  <div className="mt-3 text-sm font-bold text-[#344054]">
                    Confidence: {(prediction.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="rounded-xl border border-[#e4eaf2] p-4">
                  <p className="text-sm font-bold text-[#344054]">Nghe và đọc lại</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => speakEnglish(targetItem.english)} className="inline-flex items-center gap-2 rounded-lg border border-[#155dcc] px-3 py-2 text-sm font-bold text-[#155dcc] hover:bg-[#edf4ff]">
                      <Play size={16} />
                      Nghe mẫu
                    </button>
                    <button onClick={handleListen} disabled={isListening} className="inline-flex items-center gap-2 rounded-lg bg-[#172033] px-3 py-2 text-sm font-bold text-white hover:bg-[#26344d] disabled:opacity-60">
                      {isListening ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
                      Đọc thử
                    </button>
                  </div>
                  <input
                    value={transcript}
                    onChange={(event) => setTranscript(event.target.value)}
                    className="mt-3 w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#12b76a]"
                    placeholder="Kết quả giọng nói hoặc nhập thủ công"
                  />
                  <div className={`mt-2 text-sm font-bold ${speechPassed ? "text-[#087443]" : "text-[#b54708]"}`}>
                    {speechPassed ? "Phát âm đạt yêu cầu" : "Hãy đọc đúng từ tiếng Anh trước khi nộp"}
                  </div>
                </div>

                <button onClick={handleSubmit} disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#12b76a] px-4 py-3 text-sm font-bold text-white hover:bg-[#0f9f5f] disabled:opacity-60">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Nộp kết quả
                </button>
              </div>
            )}
          </section>

          {submission && (
            <section className="rounded-xl border border-[#abefc6] bg-[#f0fdf4] p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-bold text-[#087443]">
                <CheckCircle2 size={19} />
                Đã lưu bài nộp
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white p-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#667085]">
                    <Award size={15} />
                    Sao
                  </div>
                  <div className="mt-1 text-2xl font-black text-[#172033]">+{submission.stars_earned}</div>
                </div>
                <div className="rounded-lg bg-white p-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#667085]">
                    <Coins size={15} />
                    Xu
                  </div>
                  <div className="mt-1 text-2xl font-black text-[#172033]">+{submission.coins_earned}</div>
                </div>
              </div>
              <button onClick={clearCanvas} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#12b76a] px-4 py-2.5 text-sm font-bold text-[#087443] hover:bg-white">
                <RotateCcw size={16} />
                Chơi lượt khác
              </button>
            </section>
          )}

          {error && <div className="rounded-xl border border-[#fecdca] bg-[#fff4f3] p-4 text-sm font-semibold text-[#b42318]">{error}</div>}
        </aside>
      </section>
    </main>
  );
}
