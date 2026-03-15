import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Edit, Trash2, Plus } from "lucide-react";

export default function ManageTests() {
  const [tests, setTests] = useState<any[]>([]);
  const { token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [currentTest, setCurrentTest] = useState<any>({ questions: [] });

  const fetchTests = async () => {
    const res = await axios.get("/api/tests", { headers: { Authorization: `Bearer ${token}` } });
    setTests(res.data);
  };

  useEffect(() => {
    fetchTests();
  }, [token]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this test?")) {
      await axios.delete(`/api/tests/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchTests();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTest._id) {
      await axios.put(`/api/tests/${currentTest._id}`, currentTest, { headers: { Authorization: `Bearer ${token}` } });
    } else {
      await axios.post("/api/tests", currentTest, { headers: { Authorization: `Bearer ${token}` } });
    }
    setIsEditing(false);
    setCurrentTest({ questions: [] });
    fetchTests();
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
          <h2 className="text-2xl font-bold mb-6 text-gray-800">{currentTest._id ? "Edit Test" : "Create New Test"}</h2>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <input type="text" placeholder="Test Title" value={currentTest.title || ""} onChange={e => setCurrentTest({...currentTest, title: e.target.value})} className="border p-3 rounded-lg w-full" required />
              <input type="number" placeholder="Time Limit (mins)" value={currentTest.timeLimit || ""} onChange={e => setCurrentTest({...currentTest, timeLimit: e.target.value})} className="border p-3 rounded-lg w-full" required />
              <input type="number" placeholder="Total Marks" value={currentTest.marks || ""} onChange={e => setCurrentTest({...currentTest, marks: e.target.value})} className="border p-3 rounded-lg w-full" required />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Questions</h3>
                <button type="button" onClick={addQuestion} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium hover:bg-green-200 transition">
                  + Add Question
                </button>
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
              <tr key={test._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="p-4 font-medium text-gray-800">{test.title}</td>
                <td className="p-4 text-gray-600">{test.timeLimit} mins</td>
                <td className="p-4 text-gray-600">{test.questions?.length || 0}</td>
                <td className="p-4 flex justify-end gap-3">
                  <button onClick={() => { setCurrentTest(test); setIsEditing(true); }} className="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded-lg transition"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(test._id)} className="text-red-600 hover:text-red-800 p-2 bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {tests.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">No tests found. Create one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
