import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../services/supabaseClient";
import { Edit, Trash2, Plus, FileText, Loader2, AlertCircle } from "lucide-react";
import ConfirmationModal from "../../components/ConfirmationModal";
import mammoth from "mammoth";

export default function ManageTests() {
  const [tests, setTests] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTest, setCurrentTest] = useState<any>({ questions: [] });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const fetchTests = async () => {
    const { data, error } = await supabase.from("tests").select("*");
    if (data) setTests(data);
    if (error) console.error("Error fetching tests:", error);
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Test",
      message: "Are you sure you want to delete this test? This action cannot be undone.",
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("tests").delete().eq("id", id);
          if (error) throw error;
          fetchTests();
        } catch (error: any) {
          console.error("Error deleting test:", error);
          alert(`Failed to delete test: ${error.message || "Unknown error"}`);
        }
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;

      if (!text.trim()) {
        throw new Error("The selected file is empty or could not be read.");
      }

      // Label-based Table Parsing (No AI)
      const questions: any[] = [];
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      
      let currentQ: any = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const nextLine = lines[i + 1] || "";

        // 1. Start of a new question
        if (line.toLowerCase() === "question") {
          // Save previous question if it exists
          if (currentQ && currentQ.options.length > 0) {
            while (currentQ.options.length < 4) currentQ.options.push("Option " + (currentQ.options.length + 1));
            questions.push(currentQ);
          }
          
          currentQ = {
            questionText: nextLine,
            options: [],
            correctAnswerIndex: 0
          };
          i++; // Skip the next line as it's the question text
          continue;
        }

        if (!currentQ) continue;

        // 2. Option label
        if (line.toLowerCase() === "option") {
          currentQ.options.push(nextLine);
          i++; // Skip the next line as it's the option text
          continue;
        }

        // 3. Answer label (usually a number like 1, 2, 3, 4)
        if (line.toLowerCase() === "answer") {
          const ansVal = parseInt(nextLine);
          if (!isNaN(ansVal)) {
            currentQ.correctAnswerIndex = ansVal - 1; // Convert 1-based to 0-based
          }
          i++;
          continue;
        }
        
        // 4. Solution label (can be used for extra info if needed)
        if (line.toLowerCase() === "solution") {
          // We can append solution to question text or ignore
          i++;
          continue;
        }
      }
      
      // Push the last question
      if (currentQ && currentQ.options.length > 0) {
        while (currentQ.options.length < 4) currentQ.options.push("Option " + (currentQ.options.length + 1));
        questions.push(currentQ);
      }

      // Final pass: Map indices to actual option text
      const finalQuestions = questions.map(q => ({
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.options[q.correctAnswerIndex] || q.options[0]
      }));

      if (finalQuestions.length > 0) {
        setCurrentTest({
          ...currentTest,
          questions: [...(currentTest.questions || []), ...finalQuestions]
        });
      } else {
        throw new Error("Could not find any questions. Please ensure your Word file has labels like 'Question', 'Option', and 'Answer' in separate rows.");
      }
    } catch (error: any) {
      console.error("Error parsing Word file:", error);
      setError(`Failed to parse Word file: ${error.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Prepare data for Supabase
      const testData = {
        title: currentTest.title,
        timeLimit: parseInt(currentTest.timeLimit),
        questions: currentTest.questions.map((q: any, index: number) => ({
          ...q,
          id: q.id || `q-${Date.now()}-${index}`
        }))
      };

      let result;
      if (currentTest.id) {
        result = await supabase.from("tests").update(testData).eq("id", currentTest.id);
      } else {
        result = await supabase.from("tests").insert([testData]);
      }

      if (result.error) throw result.error;

      setIsEditing(false);
      setCurrentTest({ questions: [] });
      fetchTests();
    } catch (err: any) {
      console.error("Error saving test:", err);
      setError(`Failed to save test: ${err.message || "Unknown error"}`);
    }
  };

  const addQuestion = () => {
    setCurrentTest({
      ...currentTest,
      questions: [...(currentTest.questions || []), { questionText: "", options: ["", "", "", ""], correctAnswer: "" }]
    });
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...currentTest.questions];
    newQuestions[index][field] = value;
    setCurrentTest({ ...currentTest, questions: newQuestions });
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const newQuestions = [...currentTest.questions];
    newQuestions[qIndex].options[optIndex] = value;
    setCurrentTest({ ...currentTest, questions: newQuestions });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Tests</h1>
        <button onClick={() => { setIsEditing(true); setCurrentTest({ questions: [] }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
          <Plus size={20} /> Create Test
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">{currentTest.id ? "Edit Test" : "Create New Test"}</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" placeholder="Test Title" value={currentTest.title || ""} onChange={e => setCurrentTest({...currentTest, title: e.target.value})} className="border p-3 rounded-lg w-full" required />
              <input type="number" placeholder="Time Limit (mins)" value={currentTest.timeLimit || ""} onChange={e => setCurrentTest({...currentTest, timeLimit: e.target.value})} className="border p-3 rounded-lg w-full" required />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <h3 className="text-xl font-bold text-gray-800">Questions</h3>
                <div className="flex gap-3">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".docx" 
                    className="hidden" 
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={isUploading}
                    className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                    {isUploading ? "Processing..." : "Upload Word File"}
                  </button>
                  <button type="button" onClick={addQuestion} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium hover:bg-green-200 transition">
                    + Add Question
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {currentTest.questions?.map((q: any, qIndex: number) => (
                  <div key={qIndex} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <input type="text" placeholder={`Question ${qIndex + 1}`} value={q.questionText} onChange={e => updateQuestion(qIndex, 'questionText', e.target.value)} className="border p-3 rounded-lg w-full mb-4" required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {q.options.map((opt: string, optIndex: number) => (
                        <input key={optIndex} type="text" placeholder={`Option ${optIndex + 1}`} value={opt} onChange={e => updateOption(qIndex, optIndex, e.target.value)} className="border p-3 rounded-lg w-full" required />
                      ))}
                    </div>
                    <select value={q.correctAnswer} onChange={e => updateQuestion(qIndex, 'correctAnswer', e.target.value)} className="border p-3 rounded-lg w-full bg-white" required>
                      <option value="">Select Correct Answer</option>
                      {q.options.map((opt: string, optIndex: number) => (
                        opt && <option key={optIndex} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-4 justify-end mt-8">
              <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Save Test</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
              <th className="p-4 font-semibold">Title</th>
              <th className="p-4 font-semibold">Time Limit</th>
              <th className="p-4 font-semibold">Questions</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tests.map(test => (
              <tr key={test.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="p-4 font-medium text-gray-800">{test.title}</td>
                <td className="p-4 text-gray-600">{test.timeLimit} mins</td>
                <td className="p-4 text-gray-600">{test.questions?.length || 0}</td>
                <td className="p-4 flex justify-end gap-3">
                  <button onClick={() => { setCurrentTest(test); setIsEditing(true); }} className="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded-lg transition"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(test.id)} className="text-red-600 hover:text-red-800 p-2 bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {tests.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">No tests found. Create one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
}
