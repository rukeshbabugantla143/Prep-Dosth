import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Trophy,
  AlertCircle
} from "lucide-react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import MathText from "../../components/common/MathText";

export default function TestReview() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      if (!resultId) return;
      
      const { data, error } = await supabase
        .from("test_results")
        .select(`
          *,
          tests (*)
        `)
        .eq("id", resultId)
        .single();
      
      if (data) setResult(data);
      if (error) console.error("Error fetching test review:", error);
      setLoading(false);
    };
    fetchResult();
  }, [resultId]);

  if (loading) return <LoadingSpinner />;
  if (!result) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Result Not Found</h2>
        <button onClick={() => navigate("/user/results")} className="mt-4 text-blue-600 hover:underline">Back to Results</button>
      </div>
    </div>
  );

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate("/user/results")}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-none">{result.tests?.title}</h1>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-1">Detailed Review • {new Date(result.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
            <Trophy size={24} className="mx-auto text-orange-500 mb-2" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Score</p>
            <p className="text-2xl font-black text-gray-900">{result.score}/{result.total_marks || result.total_items}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
            <CheckCircle2 size={24} className="mx-auto text-green-500 mb-2" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Accuracy</p>
            <p className="text-2xl font-black text-green-600">{result.accuracy}%</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
            <Clock size={24} className="mx-auto text-blue-500 mb-2" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Time Taken</p>
            <p className="text-2xl font-black text-gray-900">{formatTime(result.time_taken)}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
            <XCircle size={24} className="mx-auto text-red-500 mb-2" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Wrong</p>
            <p className="text-2xl font-black text-red-600">{result.wrong}</p>
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-gray-900 mb-4">Question Analysis</h2>
          {result.tests?.questions?.map((q: any, idx: number) => {
            const qId = q.id || `q-${idx}`;
            const userAnswer = result.user_answers?.[qId];
            const isCorrect = userAnswer === q.correctAnswer;
            const isUnanswered = !userAnswer;

            return (
              <div key={idx} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Question {idx + 1}</span>
                  {isUnanswered ? (
                    <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Unanswered</span>
                  ) : isCorrect ? (
                    <span className="bg-green-50 text-green-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle2 size={12} /> Correct
                    </span>
                  ) : (
                    <span className="bg-red-50 text-red-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                      <XCircle size={12} /> Incorrect
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-8 leading-relaxed">
                  <MathText text={q.questionText || q.text} />
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((option: string, oIdx: number) => {
                    const isSelected = userAnswer === option;
                    const isCorrectOption = q.correctAnswer === option;
                    
                    let borderColor = "border-gray-100";
                    let bgColor = "bg-white";
                    let textColor = "text-gray-700";

                    if (isCorrectOption) {
                      borderColor = "border-green-500";
                      bgColor = "bg-green-50";
                      textColor = "text-green-700";
                    } else if (isSelected && !isCorrect) {
                      borderColor = "border-red-500";
                      bgColor = "bg-red-50";
                      textColor = "text-red-700";
                    }

                    return (
                      <div 
                        key={oIdx}
                        className={`p-4 rounded-2xl border-2 ${borderColor} ${bgColor} ${textColor} font-bold text-sm flex items-center justify-between`}
                      >
                        <MathText text={option} />
                        {isCorrectOption && <CheckCircle2 size={16} className="text-green-600" />}
                        {isSelected && !isCorrect && <XCircle size={16} className="text-red-600" />}
                      </div>
                    );
                  })}
                </div>

                {!isCorrect && !isUnanswered && (
                  <div className="mt-6 p-4 bg-yellow-50 rounded-2xl border border-yellow-100 flex items-start gap-3">
                    <AlertCircle size={18} className="text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-yellow-800 uppercase tracking-widest mb-1">Correction</p>
                      <p className="text-sm text-yellow-700 font-medium">
                        You selected <span className="font-bold">"<MathText text={userAnswer} />"</span>, but the correct answer is <span className="font-bold">"<MathText text={q.correctAnswer} />"</span>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
