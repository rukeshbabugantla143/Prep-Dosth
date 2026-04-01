import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Share2,
  LayoutDashboard,
  ShieldCheck,
  User,
  Calendar as CalendarIcon,
  Trophy,
  Target,
  AlertTriangle,
  FileText,
  Menu,
  X,
  Info,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import MathText from "../../components/common/MathText";

type QuestionStatus = 'NOT_VISITED' | 'NOT_ANSWERED' | 'ANSWERED' | 'MARKED' | 'ANSWERED_MARKED';
const shuffleArray = (array: any[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function AttemptTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [test, setTest] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set([0]));
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [result, setResult] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showQuestionPaper, setShowQuestionPaper] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [startTime] = useState(Date.now());
  const [isStarted, setIsStarted] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  const dynamicSections = useMemo(() => {
    if (!test || !test.questions) return [];

    const groups: Record<string, any> = {};
    const sectionOrder = test.sections || ["General Section"];

    // Initialize groups with predefined sections to preserve order
    sectionOrder.forEach((s: string) => {
      groups[s] = { name: s, count: 0, marks: 0, id: s };
    });

    test.questions.forEach((q: any) => {
      const sectionName = q.section || "General Section";
      if (!groups[sectionName]) {
        groups[sectionName] = { name: sectionName, count: 0, marks: 0, id: sectionName };
      }
      groups[sectionName].count += 1;
      groups[sectionName].marks += (q.marks || 1);
    });

    // Filter out sections with no questions if desired, or keep them all.
    // Let's keep them all if they were predefined, or only those with questions.
    // Usually, if an admin defines a section, they expect it to be there.
    return Object.values(groups).filter((s: any) => s.count > 0);
  }, [test]);

  useEffect(() => {
    const fetchTest = async () => {
      // PARAM PROTECTION: Catch 'undefined' UUID string from bad params
      if (!id || id === "undefined") {
        console.warn("AttemptTest: Invalid Test ID detected. Redirecting...");
        navigate("/user/tests");
        return;
      }

      const { data, error } = await supabase.from("tests").select("*").eq("id", id).single();
      if (data) {
        const sectionOrder = data.sections || ["General Section"];
        let processedQuestions: any[] = [];
        const questionsBySection: Record<string, any[]> = {};

        // 1. Group questions by their section name
        (data.questions || []).forEach((q: any) => {
          const sName = q.section || "General Section";
          if (!questionsBySection[sName]) questionsBySection[sName] = [];
          questionsBySection[sName].push(q);
        });

        // 2. Process sections in the order they were defined by the admin
        sectionOrder.forEach((sName: string) => {
          if (questionsBySection[sName]) {
            // Shuffle only the questions within this specific section
            const shuffled = shuffleArray(questionsBySection[sName]).map((q: any) => ({
              ...q,
              options: shuffleArray(q.options || [])
            }));
            processedQuestions = [...processedQuestions, ...shuffled];
            delete questionsBySection[sName]; // Mark as processed
          }
        });

        // 3. Fallback: Add any remaining questions from sections not in the main order list
        Object.keys(questionsBySection).forEach((sName: string) => {
          const shuffled = shuffleArray(questionsBySection[sName]).map((q: any) => ({
            ...q,
            options: shuffleArray(q.options || [])
          }));
          processedQuestions = [...processedQuestions, ...shuffled];
        });

        setTest({ ...data, questions: processedQuestions });
        setTimeLeft(data.timeLimit * 60);

        if (processedQuestions.length > 0) {
          setActiveSection(processedQuestions[0].section || "General Section");
        }
      }
      if (error) console.error("Failed to fetch test", error);
    };
    fetchTest();
  }, [id]);

  useEffect(() => {
    if (timeLeft === null || result) return;

    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev! - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, result]);

  const handleOptionChange = (questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const clearResponse = () => {
    const currentQ = test.questions[currentQuestionIndex];
    const qId = currentQ.id || `q-${currentQuestionIndex}`;
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[qId];
      return newAnswers;
    });
  };

  const toggleMarkForReview = () => {
    setMarkedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(currentQuestionIndex)) {
        next.delete(currentQuestionIndex);
      } else {
        next.add(currentQuestionIndex);
      }
      return next;
    });
    handleNext();
  };

  const handleNext = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      setVisitedQuestions(prev => new Set(prev).add(nextIdx));
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const jumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setVisitedQuestions(prev => new Set(prev).add(index));
    if (window.innerWidth < 1024) setShowSidebar(false);
  };

  const handleSubmit = async () => {
    const endTime = Date.now();
    const timeTakenSeconds = Math.floor((endTime - startTime) / 1000);

    let correct = 0;
    let wrong = 0;
    let totalMarks = 0;

    test.questions.forEach((q: any, index: number) => {
      const qId = q.id || `q-${index}`;
      const qMarks = q.marks || 1;
      totalMarks += qMarks;

      if (answers[qId]) {
        if (answers[qId] === q.correctAnswer) {
          correct += qMarks;
        } else {
          wrong += 1; // Count of wrong questions
        }
      }
    });

    const totalQuestions = test.questions.length;
    const accuracy = totalQuestions > 0 ? Math.round((correct / totalMarks) * 100) : 0;

    const resultData = {
      user_id: user?.id,
      test_id: id,
      score: correct,
      correct,
      wrong,
      total_items: totalQuestions,
      total_marks: totalMarks,
      accuracy,
      time_taken: timeTakenSeconds,
      user_answers: answers,
      created_at: new Date().toISOString()
    };

    const { error: saveError } = await supabase.from("test_results").insert([resultData]);
    if (saveError) console.error("Error saving test result:", saveError);

    setResult({
      ...resultData,
      totalItems: totalQuestions,
      timeTaken: timeTakenSeconds,
      date: new Date().toLocaleDateString('en-GB')
    });
    setShowSubmitModal(false);
  };

  const getQuestionStatus = (index: number): QuestionStatus => {
    const q = test.questions[index];
    const qId = q.id || `q-${index}`;
    const isAnswered = !!answers[qId];
    const isMarked = markedQuestions.has(index);
    const isVisited = visitedQuestions.has(index);

    if (isAnswered && isMarked) return 'ANSWERED_MARKED';
    if (isMarked) return 'MARKED';
    if (isAnswered) return 'ANSWERED';
    if (isVisited) return 'NOT_ANSWERED';
    return 'NOT_VISITED';
  };

  const statusCounts = useMemo(() => {
    if (!test) return { ANSWERED: 0, NOT_ANSWERED: 0, NOT_VISITED: 0, MARKED: 0, ANSWERED_MARKED: 0 };
    const counts = { ANSWERED: 0, NOT_ANSWERED: 0, NOT_VISITED: 0, MARKED: 0, ANSWERED_MARKED: 0 };
    test.questions.forEach((_: any, i: number) => {
      counts[getQuestionStatus(i)]++;
    });
    return counts;
  }, [test, answers, markedQuestions, visitedQuestions]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatTimeTaken = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  useEffect(() => {
    if (test && test.questions[currentQuestionIndex]) {
      const section = test.questions[currentQuestionIndex].section || "General Section";
      setActiveSection(section);
    }
  }, [currentQuestionIndex, test]);

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    const firstIndex = test.questions.findIndex((q: any) => (q.section || "General Section") === sectionId);
    if (firstIndex !== -1) {
      setCurrentQuestionIndex(firstIndex);
    }
  };

  if (!test) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#008bb1]"></div>
      </div>
    );
  }

  if (!isStarted && !result) {
    return (
      <div className="h-screen bg-white flex flex-col font-sans text-gray-800 overflow-hidden">
        <header className="bg-[#008bb1] text-white px-6 py-3 flex justify-between items-center flex-shrink-0">
          <h1 className="text-lg font-bold">Exam Instructions</h1>
          <div className="text-sm font-medium">{user?.name || "Candidate Name"}</div>
        </header>

        <main className="flex-grow p-6 md:p-10 w-full overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              Target Exam: {test.title}
            </h2>

            <div className="overflow-hidden border border-gray-200 rounded-lg mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-sm font-bold">Section</th>
                    <th className="px-4 py-3 text-sm font-bold">Number of Questions</th>
                    <th className="px-4 py-3 text-sm font-bold">Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {dynamicSections.map((s: any, i: number) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-4 py-3 text-sm">{s.name}</td>
                      <td className="px-4 py-3 text-sm">{s.count}</td>
                      <td className="px-4 py-3 text-sm">{s.marks}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#1e293b] text-white font-bold">
                    <td className="px-4 py-3 text-sm">Total</td>
                    <td className="px-4 py-3 text-sm">{test.questions.length}</td>
                    <td className="px-4 py-3 text-sm">
                      {test.questions.reduce((acc: number, q: any) => acc + (q.marks || 1), 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {test.instructions ? (
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8">
                <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">Special Instructions</h3>
                <div
                  className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: test.instructions }}
                />
              </div>
            ) : (
              <ul className="space-y-2 text-sm text-gray-600 mb-8 list-disc pl-5">
                <li>You will be given <strong>{test.timeLimit} minutes</strong> to attempt {test.questions.length} questions.</li>
                <li>There are no negative marks.</li>
                <li>Questions will be available in English.</li>
                <li>The questions will be displayed on the screen one at a time.</li>
              </ul>
            )}

            <div className="grid md:grid-cols-2 gap-10 border-t border-gray-100 pt-8 hidden">
              <div>
                <h3 className="text-blue-700 font-bold border-b-2 border-blue-700 inline-block mb-4">General Instructions</h3>
                <ul className="space-y-3 text-[13px] leading-relaxed">
                  <li className="flex gap-2">
                    <span className="text-gray-400">•</span>
                    <span>The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gray-400">•</span>
                    <span>When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gray-400">•</span>
                    <span>The Question Palette displayed on the right side of screen will show the status of each question using specific symbols.</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-blue-700 font-bold border-b-2 border-blue-700 inline-block mb-4">Answering a Question</h3>
                <ul className="space-y-3 text-[13px] leading-relaxed">
                  <li className="flex gap-2">
                    <span className="text-gray-400">•</span>
                    <span>To select your answer, click on the button of one of the options.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gray-400">•</span>
                    <span>To deselect your chosen answer, click on the button of the chosen option again or click on the <strong>Clear Response</strong> button.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gray-400">•</span>
                    <span>To save your answer, you MUST click on the <strong>Save & Next</strong> button.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gray-400">•</span>
                    <span>To mark the question for review, click on the <strong>Mark for Review & Next</strong> button.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 mb-10">
            <label className="flex gap-4 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[13px] leading-relaxed text-gray-700">
                I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc. /any prohibited material with me into the Examination Hall. I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this Test and/or disciplinary action, which may include ban from future Tests / Examinations.
              </span>
            </label>
          </div>
        </main>

        <footer className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center flex-shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-2 rounded border border-gray-300 text-gray-600 font-medium hover:bg-gray-100 transition-all"
          >
            <ChevronLeft size={18} />
            Previous
          </button>
          <button
            disabled={!agreedToTerms}
            onClick={() => setIsStarted(true)}
            className={`flex items-center gap-2 px-8 py-2.5 rounded font-bold transition-all shadow-md ${agreedToTerms
                ? 'bg-[#87cedb] text-white hover:bg-[#76bdca]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            I am ready to begin
            <ChevronRight size={18} />
          </button>
        </footer>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-white text-gray-900 py-8 md:py-12 px-4">
        <div className="w-full max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold tracking-widest text-blue-600 mb-4 md:mb-6">
              <ShieldCheck size={12} md:size={14} />
              SECURE ASSESSMENT RECORD
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-6 md:mb-8 tracking-tight leading-tight text-gray-900">KEEP PUSHING HARDER!</h1>

            <div className="flex justify-center gap-4 md:gap-8 text-gray-500 text-[10px] md:text-sm mb-8 md:mb-12">
              <div className="flex items-center gap-1.5 md:gap-2">
                <User size={14} md:size={16} />
                <span className="uppercase font-bold tracking-wider truncate max-w-[100px] md:max-w-none">{user?.name || "User"}</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <CalendarIcon size={14} md:size={16} />
                <span className="uppercase font-bold tracking-wider">{result.date}</span>
              </div>
            </div>

            <div className="relative inline-block mb-12 md:mb-16">
              <div className="bg-gray-50 text-gray-900 rounded-3xl p-8 md:p-12 w-48 h-48 md:w-64 md:h-64 flex flex-col items-center justify-center shadow-sm border border-gray-100">
                <span className="text-5xl md:text-7xl font-black leading-none">{result.accuracy}%</span>
                <span className="text-[8px] md:text-[10px] font-bold tracking-[0.2em] text-gray-500 mt-2 uppercase">Aggregate Accuracy</span>
                <button className="mt-4 md:mt-6 bg-red-50 text-red-600 border border-red-100 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 md:gap-2">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full animate-pulse"></div>
                  Keep Practicing
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
              {[
                { label: "Total Items", value: result.totalItems, icon: <FileText size={16} md:size={20} className="text-blue-600" /> },
                { label: "Correct", value: result.correct, icon: <CheckCircle2 size={16} md:size={20} className="text-green-600" /> },
                { label: "Wrong", value: result.wrong, icon: <XCircle size={16} md:size={20} className="text-red-600" /> },
                { label: "Time Taken", value: formatTimeTaken(result.timeTaken), icon: <Clock size={16} md:size={20} className="text-orange-600" /> }
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 text-gray-900 flex flex-col items-center justify-center gap-1.5 md:gap-2 shadow-sm border border-gray-100">
                  {stat.icon}
                  <span className="text-lg md:text-2xl font-black">{stat.value}</span>
                  <span className="text-[8px] md:text-[10px] font-bold tracking-widest text-gray-400 uppercase">{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-12 md:mb-16">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 md:px-12 py-3 md:py-4 rounded-xl font-black tracking-widest uppercase text-[10px] md:text-xs flex items-center justify-center gap-2 md:gap-3 transition-all shadow-sm">
                <Share2 size={18} md:size={20} />
                Share Results
              </button>
              <button
                onClick={() => navigate("/user")}
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-8 md:px-12 py-3 md:py-4 rounded-xl font-black tracking-widest uppercase text-[10px] md:text-xs flex items-center justify-center gap-2 md:gap-3 transition-all border border-gray-200"
              >
                <LayoutDashboard size={18} md:size={20} />
                Dashboard
              </button>
            </div>

            <div className="border-t border-gray-100 pt-8 md:pt-12">
              <div className="text-left mb-6 md:mb-8">
                <h3 className="text-xl md:text-2xl font-black tracking-tight text-gray-900">Technical Review</h3>
                <p className="text-gray-500 text-[10px] md:text-xs font-bold tracking-widest uppercase mt-1">Audit your performance item by item.</p>
              </div>

              <div className="space-y-4">
                {test.questions.map((q: any, index: number) => {
                  const qId = q.id || `q-${index}`;
                  const userAnswer = answers[qId];
                  const isCorrect = userAnswer === q.correctAnswer;

                  return (
                    <div key={index} className="bg-white border border-gray-100 rounded-xl md:rounded-2xl p-4 md:p-6 text-left shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[9px] md:text-[10px] font-black tracking-widest text-gray-400 uppercase">Item {index + 1}</span>
                        {userAnswer ? (
                          isCorrect ? (
                            <span className="bg-green-50 text-green-600 text-[9px] md:text-[10px] font-black tracking-widest uppercase px-2.5 md:px-3 py-1 rounded-full flex items-center gap-1.5">
                              <CheckCircle2 size={10} md:size={12} /> Correct
                            </span>
                          ) : (
                            <span className="bg-red-50 text-red-600 text-[9px] md:text-[10px] font-black tracking-widest uppercase px-2.5 md:px-3 py-1 rounded-full flex items-center gap-1.5">
                              <XCircle size={10} md:size={12} /> Incorrect
                            </span>
                          )
                        ) : (
                          <span className="bg-gray-100 text-gray-500 text-[9px] md:text-[10px] font-black tracking-widest uppercase px-2.5 md:px-3 py-1 rounded-full flex items-center gap-1.5">
                            Unattempted
                          </span>
                        )}
                      </div>

                      <p className="text-base md:text-lg font-bold mb-4 leading-tight text-gray-900">
                        <MathText text={q.questionText} />
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-xl p-3 md:p-4 border border-gray-100">
                          <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Your Answer</p>
                          <p className={`text-sm md:text-base font-bold ${userAnswer ? (isCorrect ? 'text-green-600' : 'text-red-600') : 'text-gray-500'}`}>
                            {userAnswer ? <MathText text={userAnswer} /> : "No answer provided"}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-3 md:p-4 border border-green-100">
                          <p className="text-[9px] md:text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Correct Answer</p>
                          <p className="text-sm md:text-base font-bold text-green-700">
                            <MathText text={q.correctAnswer} />
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const currentQId = currentQuestion.id || `q-${currentQuestionIndex}`;
  const isMarked = markedQuestions.has(currentQuestionIndex);

  const statusStyles: Record<QuestionStatus, string> = {
    NOT_VISITED: 'bg-white border-gray-300 text-gray-700',
    NOT_ANSWERED: 'bg-[#ff1f44] border-[#ff1f44] text-white',
    ANSWERED: 'bg-[#2e7d32] border-[#2e7d32] text-white',
    MARKED: 'bg-[#6a1b9a] border-[#6a1b9a] text-white rounded-full',
    ANSWERED_MARKED: 'bg-[#6a1b9a] border-[#6a1b9a] text-white rounded-full relative after:content-[""] after:absolute after:bottom-0 after:right-0 after:w-2.5 after:h-2.5 after:bg-[#2e7d32] after:rounded-full after:border-2 after:border-white'
  };

  const getStatusShape = (status: QuestionStatus) => {
    if (status === 'ANSWERED') return { clipPath: 'polygon(0% 20%, 50% 0%, 100% 20%, 100% 100%, 0% 100%)' };
    if (status === 'NOT_ANSWERED') return { clipPath: 'polygon(0% 0%, 100% 0%, 100% 80%, 50% 100%, 0% 80%)' };
    return {};
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none overflow-hidden h-screen">
      {/* Top Header */}
      <header className="bg-[#0f172a] text-white px-4 py-2 flex justify-between items-center z-[60] shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-black tracking-tight uppercase">PrepDosth</h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowQuestionPaper(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1"
          >
            <FileText size={12} /> Question Paper
          </button>
          <button
            onClick={() => setShowInstructionsModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1"
          >
            <Info size={12} /> Instructions
          </button>
          <div className="bg-black/40 px-3 py-1 rounded border border-white/10 flex items-center gap-2">
            <span className="text-xs font-bold text-white tabular-nums">{formatTime(timeLeft!)}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-grow relative overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-grow flex flex-col overflow-hidden lg:mr-[300px] border-r border-gray-200">
          {/* Section Tabs */}
          <div className="bg-[#e8f0fe] border-b border-gray-200 px-2 py-1 flex gap-1 overflow-x-auto shrink-0">
            {dynamicSections.map((s: any) => (
              <button
                key={s.id}
                onClick={() => handleSectionClick(s.id)}
                className={`px-4 py-1 rounded-t text-[10px] font-bold whitespace-nowrap transition-all border-t border-l border-r ${activeSection === s.id
                    ? 'bg-[#008bb1] text-white border-[#008bb1]'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          <div className="bg-white border-b border-gray-200 px-4 py-1 flex justify-between items-center shrink-0">
            <div className="text-[11px] font-bold text-gray-700">Question Type: MCQ</div>
            <div className="text-[10px] font-bold text-gray-500">Marks for correct answer: <span className="text-green-600">1</span> | Negative Marks: <span className="text-red-600">0</span></div>
          </div>

          <div className="flex-grow overflow-y-auto p-6 md:p-10 relative">
            {/* Watermark */}
            <div className="absolute inset-0 pointer-events-none flex flex-wrap items-center justify-center opacity-[0.03] overflow-hidden select-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="text-4xl font-black uppercase -rotate-45 p-20 whitespace-nowrap">PrepDosth</div>
              ))}
            </div>

            <div className="w-full relative z-10 px-4">
              <div className="flex items-start gap-4 mb-8">
                <span className="text-lg font-black text-gray-900 shrink-0">Q.{currentQuestionIndex + 1}</span>
                <div className="text-base md:text-lg font-bold text-gray-900 leading-relaxed">
                  <MathText text={currentQuestion.questionText} />
                </div>
              </div>

              <div className="space-y-4 ml-10">
                {currentQuestion.options.map((opt: string, i: number) => {
                  const isSelected = answers[currentQId] === opt;
                  
                  return (
                    <label
                      key={i}
                      className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer group ${
                        isSelected 
                          ? 'border-blue-200 bg-blue-50/50 shadow-sm shadow-blue-100/50' 
                          : 'border-gray-100/50 hover:bg-gray-50'
                      }`}
                    >
                      <input 
                        type="radio"
                        name={`q-${currentQuestionIndex}`}
                        checked={isSelected}
                        onChange={() => handleOptionChange(currentQId, opt)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center text-[10px] font-black transition-all ${
                          isSelected 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                            : 'bg-white border-gray-200 text-gray-400 group-hover:border-blue-400 group-hover:text-blue-500'
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className={`text-sm font-bold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                          <MathText text={opt} />
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="bg-[#e8f0fe] border-t border-gray-300 p-2 flex justify-between items-center shrink-0">
            <div className="flex gap-2">
              <button
                onClick={toggleMarkForReview}
                className="bg-white text-gray-700 border border-gray-300 px-4 py-1.5 rounded text-[10px] font-bold hover:bg-gray-50 transition-all uppercase"
              >
                Mark for Review & Next
              </button>
              <button
                onClick={clearResponse}
                className="bg-white text-gray-700 border border-gray-300 px-4 py-1.5 rounded text-[10px] font-bold hover:bg-gray-50 transition-all uppercase"
              >
                Clear Response
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-1.5 rounded text-[10px] font-bold transition-all uppercase shadow-sm"
              >
                Save & Next
              </button>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="bg-[#008bb1] hover:bg-[#007aa0] text-white px-8 py-1.5 rounded text-[10px] font-bold transition-all uppercase shadow-sm"
              >
                Submit
              </button>
            </div>
          </div>
        </main>

        {/* Right Sidebar (Question Palette) */}
        <aside className="hidden lg:flex absolute top-0 right-0 bottom-0 w-[300px] bg-white flex-col overflow-hidden">
          {/* Candidate Info */}
          <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 overflow-hidden">
              <User size={32} />
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] font-black text-gray-900 uppercase truncate">{user?.name || "Candidate Name"}</p>
              <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tight">HT : {user?.id?.slice(0, 8).toUpperCase() || "N/A"}</p>
            </div>
          </div>

          {/* Status Summary */}
          <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-2 border-b border-gray-100">
            {[
              { label: 'Answered', count: statusCounts.ANSWERED, color: 'bg-[#2e7d32]', shape: 'ANSWERED' },
              { label: 'Not Answered', count: statusCounts.NOT_ANSWERED, color: 'bg-[#ff1f44]', shape: 'NOT_ANSWERED' },
              { label: 'Not Visited', count: statusCounts.NOT_VISITED, color: 'bg-white border-gray-300', shape: 'NOT_VISITED' },
              { label: 'Marked', count: statusCounts.MARKED, color: 'bg-[#6a1b9a] rounded-full', shape: 'MARKED' },
              { label: 'Ans & Marked', count: statusCounts.ANSWERED_MARKED, color: 'bg-[#6a1b9a] rounded-full relative after:content-[""] after:absolute after:bottom-0 after:right-0 after:w-1.5 after:h-1.5 after:bg-[#2e7d32] after:rounded-full after:border after:border-white', shape: 'ANSWERED_MARKED' }
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 border ${s.color}`}
                  style={getStatusShape(s.shape as QuestionStatus)}
                ></div>
                <span className="text-[8px] font-bold text-gray-600 uppercase">{s.count} {s.label}</span>
              </div>
            ))}
          </div>

          {/* Section Header */}
          <div className="bg-[#008bb1] text-white px-4 py-1.5 text-[11px] font-bold uppercase">
            {activeSection}
          </div>

          {/* Question Grid */}
          <div className="flex-grow p-4 overflow-y-auto bg-[#f8fafc]">
            <h3 className="text-[10px] font-black text-gray-800 uppercase mb-3">Choose a Question</h3>
            <div className="grid grid-cols-4 gap-2">
              {test.questions.map((q: any, i: number) => {
                if ((q.section || "General Section") !== activeSection) return null;

                const status = getQuestionStatus(i);
                const isCurrent = currentQuestionIndex === i;

                return (
                  <button
                    key={i}
                    onClick={() => jumpToQuestion(i)}
                    style={getStatusShape(status)}
                    className={`
                      w-10 h-10 flex items-center justify-center text-[11px] font-bold border transition-all
                      ${isCurrent ? 'ring-2 ring-[#008bb1] ring-offset-1' : ''}
                      ${statusStyles[status]}
                    `}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Submit Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubmitModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[2rem] overflow-hidden shadow-2xl w-full max-w-md"
            >
              <div className="bg-blue-600 p-8 text-white flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-2xl font-black tracking-tight">Submit Attempt?</h3>
              </div>

              <div className="bg-[#fff1f2] p-6 flex flex-col items-center text-center gap-2">
                <div className="flex items-center gap-2 text-[#e11d48]">
                  <AlertTriangle size={16} />
                  <p className="text-xs font-black tracking-tight leading-tight">
                    Note that the timer is ticking while you read. Close this window to return to the exam.
                  </p>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Answered:</span>
                    <span className="text-xl font-black text-gray-900">{statusCounts.ANSWERED + statusCounts.ANSWERED_MARKED}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Not Answered:</span>
                    <span className="text-xl font-black text-[#ff1f44]">{statusCounts.NOT_ANSWERED + statusCounts.MARKED}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Not Visited:</span>
                    <span className="text-xl font-black text-gray-400">{statusCounts.NOT_VISITED}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-4 rounded-xl font-black tracking-widest uppercase text-xs transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 bg-[#00a86b] hover:bg-[#008f5b] text-white py-4 rounded-xl font-black tracking-widest uppercase text-xs transition-all shadow-lg shadow-green-600/20"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showQuestionPaper && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuestionPaper(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            >
              <div className="bg-[#0f172a] p-4 text-white flex justify-between items-center">
                <h3 className="text-lg font-bold uppercase tracking-tight">Question Paper</h3>
                <button onClick={() => setShowQuestionPaper(false)} className="hover:bg-white/10 p-1 rounded">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-grow overflow-y-auto p-6 space-y-8">
                {test.questions.map((q: any, i: number) => (
                  <div key={i} className="border-b border-gray-100 pb-6 last:border-0">
                    <div className="flex gap-3 mb-4">
                      <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <div className="text-sm font-medium text-gray-900 leading-relaxed">
                        <MathText text={q.questionText || q.text} />
                      </div>
                    </div>
                    {q.image_url && (
                      <div className="ml-9 mb-4 max-w-md">
                        <img src={q.image_url} alt={`Question ${i + 1}`} className="rounded border border-gray-200" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <div className="ml-9 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                          <div className="w-5 h-5 rounded-md border border-gray-200 bg-white flex items-center justify-center text-[8px] font-black text-gray-400 shrink-0">
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="text-xs text-gray-700">
                            <MathText text={opt} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {showInstructionsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstructionsModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            >
              <div className="bg-[#0f172a] p-4 text-white flex justify-between items-center">
                <h3 className="text-lg font-bold uppercase tracking-tight">Instructions</h3>
                <button onClick={() => setShowInstructionsModal(false)} className="hover:bg-white/10 p-1 rounded">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-grow overflow-y-auto p-8">
                <h4 className="text-blue-700 font-black uppercase tracking-widest text-xs mb-4 border-b border-blue-100 pb-2">Exam Instructions</h4>
                <div
                  className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: test.instructions || "No special instructions provided for this exam." }}
                />

                <div className="mt-8 pt-8 border-t border-gray-100">
                  <h4 className="text-gray-900 font-black uppercase tracking-widest text-xs mb-4">General Information</h4>
                  <ul className="space-y-3 text-[13px] text-gray-600">
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>Total Questions: {test.questions.length}</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>Time Limit: {test.timeLimit} Minutes</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>Negative Marking: None</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
