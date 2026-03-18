import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";

export default function AttemptTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [test, setTest] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [result, setResult] = useState<any>(null);

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
    let score = 0;
    test.questions.forEach((q: any) => {
      if (answers[q.id] === q.correctAnswer) {
        score += (test.marks / test.questions.length);
      }
    });
    setResult({ score, totalMarks: test.marks });
  };

  if (!test) return <div className="text-center mt-20 text-xl font-medium">Loading test...</div>;

  if (result) {
    return (
      <div className="max-w-2xl mx-auto mt-16 bg-white p-12 rounded-3xl shadow-xl border border-gray-100 text-center">
        <h2 className="text-4xl font-extrabold text-gray-800 mb-6">Test Completed!</h2>
        <div className="bg-blue-50 p-8 rounded-2xl mb-8">
          <p className="text-2xl text-gray-600 mb-2">Your Score</p>
          <p className="text-6xl font-black text-blue-600">{result.score} <span className="text-3xl text-gray-400">/ {result.totalMarks}</span></p>
        </div>
        <button onClick={() => navigate("/user")} className="bg-gray-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-900 transition shadow-md">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 sticky top-4 z-10">
        <h1 className="text-2xl font-bold text-gray-800">{test.title}</h1>
        <div className={`text-xl font-mono font-bold px-4 py-2 rounded-lg ${timeLeft! < 60 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'}`}>
          Time Left: {formatTime(timeLeft!)}
        </div>
      </div>

      <div className="space-y-8">
        {test.questions.map((q: any, index: number) => (
          <div key={q.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6"><span className="text-blue-600 mr-2">Q{index + 1}.</span> {q.questionText}</h3>
            <div className="space-y-3">
              {q.options.map((opt: string, i: number) => (
                <label key={i} className={`flex items-center p-4 rounded-xl border cursor-pointer transition ${answers[q.id] === opt ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => handleOptionChange(q.id, opt)}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500 mr-4"
                  />
                  <span className="text-gray-700 font-medium">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <button onClick={handleSubmit} className="bg-green-600 text-white px-12 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg">
          Submit Test
        </button>
      </div>
    </div>
  );
}
