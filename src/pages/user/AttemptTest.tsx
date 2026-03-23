import { useState, useEffect } from "react";
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
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function AttemptTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [test, setTest] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [result, setResult] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const fetchTest = async () => {
      const { data, error } = await supabase.from("tests").select("*").eq("id", id).single();
      if (data) {
        setTest(data);
        setTimeLeft(data.timeLimit * 60);
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

  const handleSubmit = async () => {
    const endTime = Date.now();
    const timeTakenSeconds = Math.floor((endTime - startTime) / 1000);
    
    let correct = 0;
    let wrong = 0;
    
    test.questions.forEach((q: any, index: number) => {
      const qId = q.id || `q-${index}`;
      if (answers[qId]) {
        if (answers[qId] === q.correctAnswer) {
          correct += 1;
        } else {
          wrong += 1;
        }
      }
    });

    const totalQuestions = test.questions.length;
    const accuracy = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

    const resultData = { 
      user_id: user?.id,
      test_id: id,
      score: correct, 
      correct,
      wrong,
      total_items: totalQuestions,
      accuracy,
      time_taken: timeTakenSeconds,
      user_answers: answers, // Store the actual answers chosen
      created_at: new Date().toISOString()
    };

    // Save to Supabase
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatTimeTaken = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  if (!test) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium">Preparing your assessment...</p>
      </div>
    </div>
  );

  if (result) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white py-8 md:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-500/30 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold tracking-widest text-blue-400 mb-4 md:mb-6">
              <ShieldCheck size={12} md:size={14} />
              SECURE ASSESSMENT RECORD
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-6 md:mb-8 tracking-tight leading-tight">KEEP PUSHING HARDER!</h1>
            
            <div className="flex justify-center gap-4 md:gap-8 text-gray-400 text-[10px] md:text-sm mb-8 md:mb-12">
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
              <div className="bg-white text-gray-900 rounded-3xl p-8 md:p-12 w-48 h-48 md:w-64 md:h-64 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.3)]">
                <span className="text-5xl md:text-7xl font-black leading-none">{result.accuracy}%</span>
                <span className="text-[8px] md:text-[10px] font-bold tracking-[0.2em] text-gray-400 mt-2 uppercase">Aggregate Accuracy</span>
                <button className="mt-4 md:mt-6 bg-[#ff4d6d]/10 text-[#ff4d6d] border border-[#ff4d6d]/20 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 md:gap-2">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#ff4d6d] rounded-full animate-pulse"></div>
                  Keep Practicing
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
              {[
                { label: "Total Items", value: result.totalItems, icon: <FileText size={16} md:size={20} className="text-blue-400" /> },
                { label: "Correct", value: result.correct, icon: <CheckCircle2 size={16} md:size={20} className="text-green-400" /> },
                { label: "Wrong", value: result.wrong, icon: <XCircle size={16} md:size={20} className="text-red-400" /> },
                { label: "Time Taken", value: formatTimeTaken(result.timeTaken), icon: <Clock size={16} md:size={20} className="text-orange-400" /> }
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 text-gray-900 flex flex-col items-center justify-center gap-1.5 md:gap-2 shadow-lg">
                  {stat.icon}
                  <span className="text-lg md:text-2xl font-black">{stat.value}</span>
                  <span className="text-[8px] md:text-[10px] font-bold tracking-widest text-gray-400 uppercase">{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-12 md:mb-16">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 md:px-12 py-3 md:py-4 rounded-xl font-black tracking-widest uppercase text-[10px] md:text-xs flex items-center justify-center gap-2 md:gap-3 transition-all shadow-lg shadow-blue-600/20">
                <Share2 size={18} md:size={20} />
                Share Results
              </button>
              <button 
                onClick={() => navigate("/user")}
                className="bg-[#1e293b] hover:bg-[#334155] text-white px-8 md:px-12 py-3 md:py-4 rounded-xl font-black tracking-widest uppercase text-[10px] md:text-xs flex items-center justify-center gap-2 md:gap-3 transition-all border border-gray-700"
              >
                <LayoutDashboard size={18} md:size={20} />
                Dashboard
              </button>
            </div>

            <div className="border-t border-gray-800 pt-8 md:pt-12">
              <div className="text-left mb-6 md:mb-8">
                <h3 className="text-xl md:text-2xl font-black tracking-tight">Technical Review</h3>
                <p className="text-gray-500 text-[10px] md:text-xs font-bold tracking-widest uppercase mt-1">Audit your performance item by item.</p>
              </div>

              <div className="space-y-4">
                {test.questions.map((q: any, index: number) => {
                  const qId = q.id || `q-${index}`;
                  const userAnswer = answers[qId];
                  const isCorrect = userAnswer === q.correctAnswer;
                  
                  return (
                    <div key={index} className="bg-white/5 border border-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 text-left">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[9px] md:text-[10px] font-black tracking-widest text-gray-500 uppercase">Item {index + 1}</span>
                        {userAnswer ? (
                          isCorrect ? (
                            <span className="bg-green-500/10 text-green-500 text-[9px] md:text-[10px] font-black tracking-widest uppercase px-2.5 md:px-3 py-1 rounded-full flex items-center gap-1.5">
                              <CheckCircle2 size={10} md:size={12} /> Correct
                            </span>
                          ) : (
                            <span className="bg-red-500/10 text-red-500 text-[9px] md:text-[10px] font-black tracking-widest uppercase px-2.5 md:px-3 py-1 rounded-full flex items-center gap-1.5">
                              <XCircle size={10} md:size={12} /> Incorrect
                            </span>
                          )
                        ) : (
                          <span className="bg-gray-500/10 text-gray-500 text-[9px] md:text-[10px] font-black tracking-widest uppercase px-2.5 md:px-3 py-1 rounded-full flex items-center gap-1.5">
                            Unattempted
                          </span>
                        )}
                      </div>
                      
                      <p className="text-base md:text-lg font-bold mb-4 leading-tight">{q.questionText}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-gray-800">
                          <p className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Your Answer</p>
                          <p className={`text-sm md:text-base font-bold ${userAnswer ? (isCorrect ? 'text-green-400' : 'text-red-400') : 'text-gray-600'}`}>
                            {userAnswer || "No answer provided"}
                          </p>
                        </div>
                        <div className="bg-green-500/5 rounded-xl p-3 md:p-4 border border-green-500/20">
                          <p className="text-[9px] md:text-[10px] font-bold text-green-500/60 uppercase tracking-widest mb-1">Correct Answer</p>
                          <p className="text-sm md:text-base font-bold text-green-400">{q.correctAnswer}</p>
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
  const attemptedCount = Object.keys(answers).length;
  const remainingCount = test.questions.length - attemptedCount;
  const progress = Math.round((attemptedCount / test.questions.length) * 100);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
            <ShieldCheck className="text-white" size={20} />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black tracking-tighter text-gray-900 uppercase">PrepDosth</h1>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Secure Portal V2.1</p>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[8px] md:text-[10px] font-bold text-gray-400 tracking-widest uppercase">Time Left</span>
            <span className={`text-lg md:text-2xl font-black tabular-nums ${timeLeft! < 60 ? 'text-red-600' : 'text-green-500'}`}>
              {formatTime(timeLeft!)}
            </span>
          </div>
          <button 
            onClick={() => setShowSubmitModal(true)}
            className="bg-[#ff1f44] hover:bg-[#e61b3d] text-white px-4 md:px-8 py-2 rounded-xl font-black tracking-widest uppercase text-xs md:text-sm transition-all shadow-lg shadow-red-600/20"
          >
            Finish
          </button>
        </div>
      </header>

      <main className="flex-grow p-3 md:p-6 max-w-7xl mx-auto w-full">
        {/* Navigation Hub */}
        <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-3 md:p-6 mb-4 md:mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <LayoutDashboard size={12} md:size={14} className="text-gray-400" />
            <span className="text-[9px] md:text-[10px] font-black tracking-widest text-gray-400 uppercase">Navigation Hub</span>
          </div>
          <div className="relative">
            <div className="flex overflow-x-auto pb-3 md:pb-4 gap-2 scrollbar-hide snap-x">
              {test.questions.map((_: any, i: number) => {
                const qId = _.id || `q-${i}`;
                const isAttempted = !!answers[qId];
                const isCurrent = currentQuestionIndex === i;
                
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentQuestionIndex(i)}
                    className={`flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-lg text-[10px] md:text-xs font-bold transition-all border snap-start ${
                      isCurrent 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : isAttempted
                          ? 'bg-green-50 border-green-200 text-green-600'
                          : 'bg-white border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            {/* Scroll Indicators for Mobile */}
            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-100 rounded-full overflow-hidden md:hidden">
              <div 
                className="h-full bg-gray-400 transition-all duration-300"
                style={{ 
                  width: `${100 / test.questions.length}%`,
                  marginLeft: `${(currentQuestionIndex / test.questions.length) * 100}%`
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question Area */}
        <div className="bg-white rounded-xl md:rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 md:px-8 py-3 md:py-6 border-b border-gray-100 flex justify-between items-center">
            <span className="text-[8px] md:text-[10px] font-black tracking-widest text-gray-400 uppercase">
              Question {currentQuestionIndex + 1} of {test.questions.length}
            </span>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden sm:block w-32 md:w-48 h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-[8px] md:text-[10px] font-black tracking-widest text-blue-600 uppercase bg-blue-50 px-2 md:px-3 py-1 rounded-full">
                {progress}% Complete
              </span>
            </div>
          </div>

          <div className="p-5 md:p-12">
            <h2 className="text-lg md:text-3xl font-black text-gray-900 mb-6 md:mb-12 leading-tight">
              {currentQuestion.questionText}
            </h2>

            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {currentQuestion.options.map((opt: string, i: number) => {
                const letter = String.fromCharCode(65 + i);
                const isSelected = answers[currentQId] === opt;
                
                return (
                  <button
                    key={i}
                    onClick={() => handleOptionChange(currentQId, opt)}
                    className={`flex items-center p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all text-left group ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/50 shadow-md' 
                        : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-7 h-7 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-[10px] md:text-sm font-black transition-all mr-3 md:mr-6 flex-shrink-0 ${
                      isSelected 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-50 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 border border-gray-200'
                    }`}>
                      {letter}
                    </div>
                    <span className={`text-sm md:text-lg font-bold ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-4 md:px-8 py-3 md:py-6 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              className="flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl border border-gray-200 text-gray-400 font-black tracking-widest uppercase text-[8px] md:text-[10px] hover:bg-white hover:text-gray-900 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={12} md:size={14} />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>
            
            <div className="flex gap-1 md:gap-1.5">
              {[...Array(Math.min(3, test.questions.length))].map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 md:h-1.5 rounded-full transition-all duration-300 ${
                    i === (currentQuestionIndex % 3) ? 'w-3 md:w-6 bg-blue-600' : 'w-1 md:w-1.5 bg-gray-300'
                  }`}
                ></div>
              ))}
            </div>

            <button
              onClick={() => {
                if (currentQuestionIndex < test.questions.length - 1) {
                  setCurrentQuestionIndex(prev => prev + 1);
                } else {
                  setShowSubmitModal(true);
                }
              }}
              className="flex items-center gap-1 md:gap-2 px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl bg-[#0f172a] text-white font-black tracking-widest uppercase text-[8px] md:text-[10px] hover:bg-[#1e293b] transition-all shadow-lg shadow-gray-900/10"
            >
              <span className="hidden sm:inline">{currentQuestionIndex === test.questions.length - 1 ? "Finish Attempt" : "Next Question"}</span>
              <span className="sm:hidden">{currentQuestionIndex === test.questions.length - 1 ? "Finish" : "Next"}</span>
              <ChevronRight size={12} md:size={14} />
            </button>
          </div>
        </div>
      </main>

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
                    <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Attempted:</span>
                    <span className="text-xl font-black text-gray-900">{attemptedCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Remaining:</span>
                    <span className="text-xl font-black text-[#ff1f44]">{remainingCount}</span>
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
      </AnimatePresence>
    </div>
  );
}
