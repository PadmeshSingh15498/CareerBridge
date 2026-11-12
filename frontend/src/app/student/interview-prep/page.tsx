"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Sparkles,
  Mic,
  MicOff,
  Send,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  TrendingUp,
  Award,
  History,
  Shield,
  Briefcase,
  Building2,
  FileText,
  ChevronRight,
  HelpCircle,
  Clock,
  Play,
  Upload,
  Loader2,
  BarChart3,
  Target,
  RefreshCw,
} from "lucide-react";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { api } from "@/lib/api";

type ViewMode = "setup" | "practice" | "summary" | "history";

interface QuestionItem {
  id: number;
  question: string;
  difficulty: string;
  expected_concepts: string[];
}

interface DimensionScores {
  technical_accuracy: number;
  relevance: number;
  completeness: number;
  conceptual_understanding: number;
  communication: number;
  problem_solving: number;
}

interface AnswerEvaluation {
  question_id: number;
  overall_score: number;
  dimension_scores: DimensionScores;
  dimension_explanations: Record<string, string>;
  missing_concepts: string[];
  actionable_improvements: string[];
  follow_up_question?: string;
  next_question?: QuestionItem;
  session_completed: boolean;
  disclaimer: string;
}

interface SessionSummary {
  session_id: string;
  target_role: string;
  company_target?: string;
  interview_type: string;
  difficulty: string;
  status: string;
  overall_score: number;
  dimension_averages: DimensionScores;
  weak_topics: string[];
  recommendations: string[];
  disclaimer: string;
}

interface PerformanceHistoryData {
  total_sessions: number;
  average_overall_score: number;
  improvement_trends: Array<{
    date: string;
    score: number;
    role: string;
    type: string;
  }>;
  weak_topics: string[];
  recommended_revision_areas: string[];
  sessions: Array<{
    id: string;
    target_role: string;
    company_target?: string;
    interview_type: string;
    difficulty: string;
    status: string;
    overall_score?: number;
    total_questions: number;
    created_at: string;
  }>;
}

export default function StudentInterviewPrepPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("setup");

  // Setup Form State
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [companyTarget, setCompanyTarget] = useState("Google");
  const [interviewType, setInterviewType] = useState("technical");
  const [difficulty, setDifficulty] = useState("entry_level");
  const [customTopics, setCustomTopics] = useState("Data Structures, System Design, Algorithms");
  const [totalQuestions, setTotalQuestions] = useState(3);
  const [isStarting, setIsStarting] = useState(false);

  // Active Practice State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<AnswerEvaluation | null>(null);
  const [completedSummary, setCompletedSummary] = useState<SessionSummary | null>(null);

  // Speech Recognition State
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // History State
  const [historyData, setHistoryData] = useState<PerformanceHistoryData | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Initialize Speech Recognition Check
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Fetch History when switching to history tab
  useEffect(() => {
    if (viewMode === "history") {
      fetchHistory();
    }
  }, [viewMode]);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.getInterviewHistory();
      const data = res?.data || res;
      setHistoryData(data);
    } catch (err) {
      console.error("Failed to fetch interview history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Start Voice Recording
  const startRecording = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. You can type your answer or upload an audio clip.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setAnswerText((prev) => (prev ? prev + " " + transcript : transcript));
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        stopRecording();
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Handle Audio File Upload Fallback
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsTranscribing(true);
      const res = await api.transcribeInterviewAudio(file);
      const data = res?.data || res;
      if (data.transcript) {
        setAnswerText((prev) => (prev ? prev + "\n" + data.transcript : data.transcript));
      }
    } catch (err) {
      console.error("Audio transcription failed:", err);
      alert("Audio transcription service could not process the file. Please type your answer.");
    } finally {
      setIsTranscribing(false);
      if (audioFileInputRef.current) audioFileInputRef.current.value = "";
    }
  };

  // Start New Session
  const handleStartSession = async () => {
    try {
      setIsStarting(true);
      const topicsList = customTopics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await api.startInterviewSession({
        target_role: targetRole,
        company_target: companyTarget,
        interview_type: interviewType,
        difficulty: difficulty,
        topics: topicsList,
        total_questions: totalQuestions,
      });

      const sessionData = res?.data || res;
      setSessionId(sessionData.session_id);
      setCurrentQuestionIndex(0);
      setCurrentQuestion(sessionData.first_question);
      setAnswerText("");
      setCurrentEvaluation(null);
      setCompletedSummary(null);
      setViewMode("practice");
    } catch (err: any) {
      console.error("Failed to start session:", err);
      alert("Failed to start mock interview session. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  // Submit Answer
  const handleSubmitAnswer = async () => {
    if (!sessionId || !currentQuestion || !answerText.trim()) return;

    if (isRecording) {
      stopRecording();
    }

    try {
      setIsSubmitting(true);
      const res = await api.submitInterviewAnswer(sessionId, {
        question_id: currentQuestion.id,
        answer_text: answerText,
      });

      const evalRes: AnswerEvaluation = res?.data || res;
      setCurrentEvaluation(evalRes);

      if (evalRes.session_completed) {
        // Fetch completed session details
        const summaryRes = await api.getInterviewSessionDetail(sessionId);
        const summary = summaryRes?.data || summaryRes;
        setCompletedSummary(summary);
      }
    } catch (err: any) {
      console.error("Answer submission failed:", err);
      alert("Evaluation failed. Please try submitting again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Advance to Next Question
  const handleNextQuestion = () => {
    if (!currentEvaluation?.next_question) {
      setViewMode("summary");
      return;
    }

    setCurrentQuestion(currentEvaluation.next_question);
    setCurrentQuestionIndex((idx) => idx + 1);
    setAnswerText("");
    setCurrentEvaluation(null);
  };

  const getDimensionLabel = (key: string) => {
    switch (key) {
      case "technical_accuracy":
        return "Technical Accuracy";
      case "relevance":
        return "Relevance";
      case "completeness":
        return "Completeness";
      case "conceptual_understanding":
        return "Conceptual Understanding";
      case "communication":
        return "Communication";
      case "problem_solving":
        return "Problem-Solving Approach";
      default:
        return key.replace("_", " ");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <WorkspaceShell role="student" activeTabTitle="AI Interview Practice Studio">
      {/* Top Header Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cb-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cb-forest/10 text-cb-forest">
              <CheckSquare className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold font-heading text-cb-primary tracking-tight">
              AI Interview Preparation Studio
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-cb-forest/10 text-cb-forest border border-cb-forest/20">
              STAR Method
            </span>
          </div>
          <p className="text-xs text-cb-secondary mt-1">
            Practice realistic Technical, Coding, HR, Behavioral, and Aptitude questions with 6-dimension AI scoring, speech-to-text, and adaptive follow-ups.
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-1 bg-cb-card border border-cb-border rounded-lg p-1 self-start md:self-auto">
          <button
            onClick={() => setViewMode("setup")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              viewMode === "setup"
                ? "bg-cb-forest text-white shadow-xs"
                : "text-cb-secondary hover:text-cb-primary hover:bg-cb-card-alt"
            }`}
          >
            New Session
          </button>
          {sessionId && (
            <button
              onClick={() => setViewMode("practice")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === "practice"
                  ? "bg-cb-forest text-white shadow-xs"
                  : "text-cb-secondary hover:text-cb-primary hover:bg-cb-card-alt"
              }`}
            >
              Active Studio
            </button>
          )}
          {completedSummary && (
            <button
              onClick={() => setViewMode("summary")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === "summary"
                  ? "bg-cb-forest text-white shadow-xs"
                  : "text-cb-secondary hover:text-cb-primary hover:bg-cb-card-alt"
              }`}
            >
              Summary
            </button>
          )}
          <button
            onClick={() => setViewMode("history")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === "history"
                ? "bg-cb-forest text-white shadow-xs"
                : "text-cb-secondary hover:text-cb-primary hover:bg-cb-card-alt"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* Advisory Disclaimer Banner */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs">
        <Shield className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="leading-snug">
          <span className="font-semibold">Notice:</span> AI-generated practice feedback, not an actual employer evaluation. Use this simulator to refine concept articulation, technical structure, and interview confidence.
        </p>
      </div>

      {/* =========================================================================
          VIEW 1: SETUP SCREEN
          ========================================================================= */}
      {viewMode === "setup" && (
        <div className="max-w-4xl mx-auto space-y-6 py-2">
          <div className="bg-cb-card border border-cb-border rounded-xl p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-cb-primary">Configure Your Practice Interview</h2>
              <p className="text-xs text-cb-secondary mt-0.5">
                Tailor the simulated interview round to your desired employer, role, and focus areas.
              </p>
            </div>

            {/* Target Role & Target Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1.5">
                  Target Job Role
                </label>
                <div className="space-y-2">
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-cb-border bg-cb-bg text-cb-primary focus:outline-none focus:border-cb-forest"
                  >
                    <option value="Software Engineer">Software Engineer (General)</option>
                    <option value="Frontend Developer">Frontend Developer (React / Next.js)</option>
                    <option value="Backend Developer">Backend Developer (Python / Node / Java)</option>
                    <option value="Full Stack Developer">Full Stack Developer</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                    <option value="DevOps & Cloud Engineer">DevOps & Cloud Engineer</option>
                    <option value="Mobile App Developer">Mobile App Developer (Flutter / React Native)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1.5">
                  Target Employer / Company Style
                </label>
                <input
                  type="text"
                  value={companyTarget}
                  onChange={(e) => setCompanyTarget(e.target.value)}
                  placeholder="e.g. Google, Microsoft, Amazon, Atlassian, TCS"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-cb-border bg-cb-bg text-cb-primary focus:outline-none focus:border-cb-forest"
                />
                <div className="flex gap-1.5 mt-1.5 overflow-x-auto">
                  {["Google", "Microsoft", "Amazon", "Atlassian", "TCS", "Accenture"].map((co) => (
                    <button
                      key={co}
                      type="button"
                      onClick={() => setCompanyTarget(co)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition ${
                        companyTarget === co
                          ? "bg-cb-forest text-white border-cb-forest"
                          : "bg-cb-card-alt text-cb-secondary border-cb-border hover:text-cb-primary"
                      }`}
                    >
                      {co}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interview Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-cb-primary mb-1.5">
                Interview Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: "technical", label: "Technical Round", desc: "Core CS, Systems, APIs" },
                  { id: "coding", label: "Coding & Logic", desc: "Algorithms & Data Structures" },
                  { id: "behavioral", label: "Behavioral (STAR)", desc: "Conflict, Teamwork, Leadership" },
                  { id: "hr", label: "HR & Culture", desc: "Motivations, Career Goals" },
                  { id: "aptitude", label: "Aptitude & Logic", desc: "Puzzles & Reasoning" },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setInterviewType(type.id)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      interviewType === type.id
                        ? "bg-cb-forest/10 border-cb-forest text-cb-forest shadow-xs"
                        : "bg-cb-bg border-cb-border text-cb-secondary hover:border-cb-forest/30 hover:text-cb-primary"
                    }`}
                  >
                    <span className="text-xs font-bold block mb-1 text-cb-primary">{type.label}</span>
                    <span className="text-[10px] leading-tight text-cb-secondary">{type.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty & Number of Questions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1.5">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "entry_level", label: "Fresher / Campus" },
                    { id: "intermediate", label: "Intermediate (1-3 yrs)" },
                    { id: "senior", label: "Senior (3+ yrs)" },
                  ].map((diff) => (
                    <button
                      key={diff.id}
                      type="button"
                      onClick={() => setDifficulty(diff.id)}
                      className={`py-2 px-2 text-center rounded-lg border text-xs font-semibold transition ${
                        difficulty === diff.id
                          ? "bg-cb-forest text-white border-cb-forest"
                          : "bg-cb-bg border-cb-border text-cb-secondary hover:text-cb-primary"
                      }`}
                    >
                      {diff.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1.5">
                  Questions in Mock Session
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { count: 3, label: "Quick (3 Qs)" },
                    { count: 5, label: "Standard (5 Qs)" },
                    { count: 8, label: "Deep-Dive (8 Qs)" },
                  ].map((q) => (
                    <button
                      key={q.count}
                      type="button"
                      onClick={() => setTotalQuestions(q.count)}
                      className={`py-2 px-2 text-center rounded-lg border text-xs font-semibold transition ${
                        totalQuestions === q.count
                          ? "bg-cb-forest text-white border-cb-forest"
                          : "bg-cb-bg border-cb-border text-cb-secondary hover:text-cb-primary"
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Focus Topics */}
            <div>
              <label className="block text-xs font-semibold text-cb-primary mb-1.5">
                Target Topics (Comma-separated)
              </label>
              <input
                type="text"
                value={customTopics}
                onChange={(e) => setCustomTopics(e.target.value)}
                placeholder="e.g. Arrays, Trees, REST APIs, Microservices, System Design"
                className="w-full px-3 py-2 text-xs rounded-lg border border-cb-border bg-cb-bg text-cb-primary focus:outline-none focus:border-cb-forest"
              />
              <p className="text-[11px] text-cb-secondary mt-1">
                The generator will incorporate questions evaluating these specific technical areas.
              </p>
            </div>

            {/* Launch Button */}
            <div className="pt-2">
              <button
                onClick={handleStartSession}
                disabled={isStarting}
                className="w-full py-3 rounded-xl bg-cb-forest text-white font-semibold text-sm hover:bg-cb-forest/90 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Curating Questions & Initializing Evaluator...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Start Practice Session</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: ACTIVE PRACTICE STUDIO (1 Question at a time)
          ========================================================================= */}
      {viewMode === "practice" && currentQuestion && (
        <div className="space-y-6">
          {/* Question Banner */}
          <div className="p-6 bg-cb-card border border-cb-border rounded-xl shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-cb-border">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-cb-forest text-white">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-cb-bg border border-cb-border text-cb-secondary uppercase">
                  {interviewType}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-cb-bg border border-cb-border text-cb-secondary capitalize">
                  {difficulty.replace("_", " ")}
                </span>
              </div>

              <div className="text-xs text-cb-secondary font-mono">
                Company Context: <span className="text-cb-forest font-semibold">{companyTarget}</span>
              </div>
            </div>

            {/* Question Prompt */}
            <div>
              <h2 className="text-lg font-bold text-cb-primary leading-snug">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Expected Key Concepts */}
            {currentQuestion.expected_concepts && currentQuestion.expected_concepts.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[11px] text-cb-secondary font-mono flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-cb-forest" /> Expected Focus:
                </span>
                {currentQuestion.expected_concepts.map((concept, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cb-card-alt border border-cb-border text-cb-primary"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Answer Composer Area */}
          <div className="bg-cb-card border border-cb-border rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-cb-primary flex items-center gap-2">
                <span>Your Answer</span>
                <span className="text-[11px] font-normal text-cb-secondary font-mono">
                  ({answerText.trim() ? answerText.trim().split(/\s+/).length : 0} words)
                </span>
              </label>

              {/* Voice & Audio Controls */}
              <div className="flex items-center gap-2">
                {/* Fallback audio file upload */}
                <input
                  type="file"
                  accept="audio/*"
                  ref={audioFileInputRef}
                  onChange={handleAudioUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => audioFileInputRef.current?.click()}
                  disabled={isTranscribing}
                  className="p-1.5 rounded-lg border border-cb-border text-cb-secondary hover:text-cb-primary hover:bg-cb-card-alt text-xs font-medium flex items-center gap-1"
                  title="Upload recorded audio clip for transcription"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upload Audio</span>
                </button>

                {/* Live Speech Recognition Button */}
                {speechSupported && (
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isRecording
                        ? "bg-rose-600 text-white animate-pulse"
                        : "bg-cb-forest/10 text-cb-forest border border-cb-forest/20 hover:bg-cb-forest/20"
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-3.5 h-3.5" />
                        <span>Recording ({recordingSeconds}s)... Stop</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" />
                        <span>Record Voice Answer</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Answer Textarea */}
            <div className="relative">
              <textarea
                rows={7}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type your structured answer here, or click 'Record Voice Answer' to speak naturally. Structure technical answers with problem statement, trade-offs, and complexity; structure behavioral answers using STAR (Situation, Task, Action, Result)..."
                className="w-full p-4 text-xs font-sans rounded-xl border border-cb-border bg-cb-bg text-cb-primary focus:outline-none focus:border-cb-forest leading-relaxed resize-y"
              />
              {isTranscribing && (
                <div className="absolute inset-0 bg-cb-card/80 backdrop-blur-xs flex items-center justify-center gap-2 text-xs font-semibold text-cb-forest rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transcribing speech audio...</span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setAnswerText("")}
                className="text-xs text-cb-secondary hover:text-rose-600 transition"
              >
                Clear Answer
              </button>

              <button
                onClick={handleSubmitAnswer}
                disabled={!answerText.trim() || isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-cb-forest text-white text-xs font-semibold hover:bg-cb-forest/90 transition shadow-xs flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating Across 6 Dimensions...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Answer for Evaluation</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* =========================================================================
              LIVE EVALUATION DRAWER / RESULTS (Appears after submission)
              ========================================================================= */}
          {currentEvaluation && (
            <div className="p-6 bg-cb-card border border-cb-forest/40 rounded-xl shadow-md space-y-6 animate-in fade-in duration-300">
              {/* Header with Overall Score */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cb-border">
                <div>
                  <span className="text-[11px] font-mono text-cb-secondary uppercase tracking-wider block">
                    AI Evaluation & Rubric Feedback
                  </span>
                  <h3 className="text-base font-bold text-cb-primary mt-0.5">
                    Question Assessment Complete
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-cb-secondary uppercase block">Overall Score</span>
                    <span className="text-xl font-bold font-mono text-cb-forest">
                      {Math.round(currentEvaluation.overall_score)}/100
                    </span>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-sm font-mono ${getScoreColor(
                      currentEvaluation.overall_score
                    )}`}
                  >
                    {Math.round(currentEvaluation.overall_score)}
                  </div>
                </div>
              </div>

              {/* 6 Dimensions Rubric Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-cb-primary mb-3 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-cb-forest" />
                  <span>Evaluation Across 6 Dimensions</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(currentEvaluation.dimension_scores).map(([key, score]) => (
                    <div key={key} className="p-3 bg-cb-bg border border-cb-border rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-cb-primary">{getDimensionLabel(key)}</span>
                        <span className="font-mono font-bold text-cb-forest">{Math.round(score)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-cb-card-alt rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getProgressBarColor(score)} transition-all duration-500`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-cb-secondary leading-tight line-clamp-2">
                        {currentEvaluation.dimension_explanations?.[key] || "Assessed against expected concept mastery."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Concepts & Actionable Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Missing Concepts */}
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Missing or Incomplete Concepts</span>
                  </div>
                  {currentEvaluation.missing_concepts && currentEvaluation.missing_concepts.length > 0 ? (
                    <ul className="space-y-1 text-xs text-amber-900/80">
                      {currentEvaluation.missing_concepts.map((concept, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{concept}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> All expected primary concepts were addressed!
                    </p>
                  )}
                </div>

                {/* Actionable Improvements */}
                <div className="p-4 bg-cb-forest/5 border border-cb-forest/20 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-cb-forest">
                    <TrendingUp className="w-4 h-4 text-cb-forest" />
                    <span>Actionable Improvements</span>
                  </div>
                  <ul className="space-y-1 text-xs text-cb-primary/80">
                    {currentEvaluation.actionable_improvements?.map((imp, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-cb-forest font-bold">→</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Dynamic Follow-up Question */}
              {currentEvaluation.follow_up_question && (
                <div className="p-4 bg-cb-card-alt border border-cb-border rounded-xl space-y-1">
                  <span className="text-[10px] font-mono uppercase text-cb-secondary flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-cb-forest" />
                    Recommended Follow-up Question from Interviewer
                  </span>
                  <p className="text-xs font-semibold text-cb-primary italic">
                    "{currentEvaluation.follow_up_question}"
                  </p>
                </div>
              )}

              {/* Advance Button */}
              <div className="pt-2 flex justify-end">
                {currentEvaluation.session_completed ? (
                  <button
                    onClick={() => setViewMode("summary")}
                    className="px-6 py-2.5 rounded-xl bg-cb-forest text-white text-xs font-semibold hover:bg-cb-forest/90 transition shadow-sm flex items-center gap-2"
                  >
                    <span>View Complete Session Summary</span>
                    <Award className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 rounded-xl bg-cb-forest text-white text-xs font-semibold hover:bg-cb-forest/90 transition shadow-sm flex items-center gap-2"
                  >
                    <span>Next Question ({currentQuestionIndex + 2} of {totalQuestions})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 3: SESSION COMPLETION SUMMARY
          ========================================================================= */}
      {viewMode === "summary" && completedSummary && (
        <div className="max-w-4xl mx-auto space-y-6 py-2">
          <div className="bg-cb-card border border-cb-border rounded-xl p-6 shadow-sm space-y-6">
            <div className="text-center space-y-2 pb-6 border-b border-cb-border">
              <div className="w-14 h-14 rounded-2xl bg-cb-forest text-cb-lime font-mono font-bold flex items-center justify-center text-xl mx-auto shadow-sm">
                <Award className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold font-heading text-cb-primary">
                Practice Session Completed!
              </h2>
              <p className="text-xs text-cb-secondary max-w-md mx-auto">
                Comprehensive evaluation generated for {completedSummary.target_role} ({completedSummary.interview_type} round).
              </p>

              <div className="pt-2">
                <span className="text-3xl font-extrabold font-mono text-cb-forest">
                  {Math.round(completedSummary.overall_score || 0)}/100
                </span>
                <span className="block text-xs font-mono text-cb-secondary mt-1">
                  Overall Practice Performance
                </span>
              </div>
            </div>

            {/* Dimension Breakdown */}
            {completedSummary.dimension_averages && (
              <div>
                <h3 className="text-xs font-bold text-cb-primary mb-3">Overall Dimension Competency</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(completedSummary.dimension_averages).map(([dim, score]) => (
                    <div key={dim} className="p-3 bg-cb-bg border border-cb-border rounded-lg">
                      <span className="text-xs font-semibold text-cb-primary block">{getDimensionLabel(dim)}</span>
                      <span className="text-lg font-bold font-mono text-cb-forest">{Math.round(score)}%</span>
                      <div className="w-full h-1.5 bg-cb-card-alt rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full ${getProgressBarColor(score)}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weak Topics & Recommended Revision */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl space-y-2">
                <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Areas Requiring Revision
                </span>
                {completedSummary.weak_topics && completedSummary.weak_topics.length > 0 ? (
                  <ul className="space-y-1 text-xs text-rose-900/80">
                    {completedSummary.weak_topics.map((topic, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-cb-secondary">No critical weak topics identified.</p>
                )}
              </div>

              <div className="p-4 bg-cb-forest/5 border border-cb-forest/20 rounded-xl space-y-2">
                <span className="text-xs font-bold text-cb-forest flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> Recommended Next Steps
                </span>
                {completedSummary.recommendations && completedSummary.recommendations.length > 0 ? (
                  <ul className="space-y-1 text-xs text-cb-primary/80">
                    {completedSummary.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-cb-forest font-bold">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-cb-secondary">Continue regular mock sessions to build fluency.</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-cb-border">
              <button
                onClick={() => setViewMode("history")}
                className="px-4 py-2 rounded-lg border border-cb-border text-cb-primary hover:bg-cb-card-alt text-xs font-semibold transition"
              >
                View Historical Progress
              </button>

              <button
                onClick={() => {
                  setSessionId(null);
                  setCurrentQuestion(null);
                  setCurrentEvaluation(null);
                  setCompletedSummary(null);
                  setViewMode("setup");
                }}
                className="px-5 py-2.5 rounded-xl bg-cb-forest text-white text-xs font-semibold hover:bg-cb-forest/90 transition shadow-xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Practice Another Interview</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: PERFORMANCE HISTORY & IMPROVEMENT TRENDS
          ========================================================================= */}
      {viewMode === "history" && (
        <div className="space-y-6">
          {loadingHistory ? (
            <div className="p-12 text-center bg-cb-card border border-cb-border rounded-xl">
              <Loader2 className="w-6 h-6 animate-spin text-cb-forest mx-auto mb-2" />
              <p className="text-xs text-cb-secondary">Loading your interview track record...</p>
            </div>
          ) : !historyData || historyData.total_sessions === 0 ? (
            <div className="p-12 text-center bg-cb-card border border-dashed border-cb-border rounded-xl space-y-3">
              <CheckSquare className="w-10 h-10 text-cb-secondary/40 mx-auto" />
              <h3 className="text-sm font-semibold text-cb-primary">No Practice Sessions Yet</h3>
              <p className="text-xs text-cb-secondary max-w-sm mx-auto">
                Take your first simulated interview to generate multi-dimensional scores, weakness heatmaps, and improvement tracking over time.
              </p>
              <button
                onClick={() => setViewMode("setup")}
                className="px-4 py-2 rounded-xl bg-cb-forest text-white text-xs font-semibold hover:bg-cb-forest/90 transition"
              >
                Start Your First Session
              </button>
            </div>
          ) : (
            <>
              {/* Analytics Summary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-cb-card border border-cb-border rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-cb-secondary uppercase">Total Mock Interviews</span>
                  <div className="text-2xl font-bold font-mono text-cb-primary">
                    {historyData.total_sessions}
                  </div>
                  <span className="text-[11px] text-cb-secondary">Completed practice sessions</span>
                </div>

                <div className="p-4 bg-cb-card border border-cb-border rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-cb-secondary uppercase">Average Overall Score</span>
                  <div className="text-2xl font-bold font-mono text-cb-forest">
                    {Math.round(historyData.average_overall_score)}%
                  </div>
                  <span className="text-[11px] text-cb-secondary">Across all rounds & dimensions</span>
                </div>

                <div className="p-4 bg-cb-card border border-cb-border rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-cb-secondary uppercase">Weak Topics Identified</span>
                  <div className="text-2xl font-bold font-mono text-amber-600">
                    {historyData.weak_topics?.length || 0}
                  </div>
                  <span className="text-[11px] text-cb-secondary">Target areas for revision</span>
                </div>
              </div>

              {/* Weak Topics & Revision Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-cb-card border border-cb-border rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-cb-primary flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Persistent Weak Topics Across Sessions</span>
                  </h3>
                  {historyData.weak_topics && historyData.weak_topics.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {historyData.weak_topics.map((topic, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-amber-500/10 text-amber-800 border border-amber-500/20"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-cb-secondary">No persistent weak topics identified yet.</p>
                  )}
                </div>

                <div className="p-4 bg-cb-card border border-cb-border rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-cb-primary flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-cb-forest" />
                    <span>Recommended Revision Checklist</span>
                  </h3>
                  {historyData.recommended_revision_areas && historyData.recommended_revision_areas.length > 0 ? (
                    <ul className="space-y-1 text-xs text-cb-primary/80">
                      {historyData.recommended_revision_areas.map((rec, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-cb-forest font-bold">✓</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-cb-secondary">Complete more sessions to build targeted checklists.</p>
                  )}
                </div>
              </div>

              {/* Historical Sessions Table */}
              <div className="bg-cb-card border border-cb-border rounded-xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-cb-border flex items-center justify-between">
                  <h3 className="text-xs font-bold text-cb-primary">Session History</h3>
                  <button
                    onClick={fetchHistory}
                    className="p-1 rounded text-cb-secondary hover:text-cb-primary"
                    title="Refresh history"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-cb-border">
                  {historyData.sessions?.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-cb-card-alt/50 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-cb-primary">{sess.target_role}</span>
                          {sess.company_target && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cb-forest/10 text-cb-forest font-semibold">
                              {sess.company_target}
                            </span>
                          )}
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cb-bg border border-cb-border text-cb-secondary uppercase">
                            {sess.interview_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-cb-secondary">
                          <span>{sess.total_questions} Questions</span>
                          <span>•</span>
                          <span className="capitalize">{sess.difficulty.replace("_", " ")}</span>
                          <span>•</span>
                          <span>{new Date(sess.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        {sess.overall_score !== undefined && sess.overall_score !== null ? (
                          <div
                            className={`px-3 py-1 rounded-lg border font-mono font-bold text-xs ${getScoreColor(
                              sess.overall_score
                            )}`}
                          >
                            {Math.round(sess.overall_score)}%
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-cb-secondary">Incomplete</span>
                        )}

                        <button
                          onClick={async () => {
                            try {
                              const detail = await api.getInterviewSessionDetail(sess.id);
                              setCompletedSummary(detail);
                              setViewMode("summary");
                            } catch (e) {
                              alert("Could not load session details");
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg border border-cb-border text-xs font-semibold text-cb-primary hover:bg-cb-card-alt transition"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </WorkspaceShell>
  );
}
