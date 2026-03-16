import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../../services/supabaseClient";
import { Edit, Trash2, Plus, X } from "lucide-react";
import JoditEditor from "jodit-react";

type SectionType = 'text' | 'table';

interface TableData {
  headers: string[];
  rows: string[][];
}

interface Section {
  id: string;
  type: SectionType;
  title: string;
  content: string;
  tableData?: TableData;
}

export default function ManageExams() {
  const [exams, setExams] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentExam, setCurrentExam] = useState<any>({});
  const [sections, setSections] = useState<Section[]>([]);

  const editor = useRef(null);
  const config = useMemo(() => ({
    readonly: false,
    placeholder: 'Enter content...',
    height: 300,
    uploader: {
      insertImageAsBase64URI: true
    }
  }), []);

  const fetchExams = async () => {
    const { data, error } = await supabase.from("exams").select("*");
    if (data) setExams(data);
    if (error) console.error("Error fetching exams:", error);
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this exam?")) {
      await supabase.from("exams").delete().eq("id", id);
      fetchExams();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Serialize sections to JSON string for description
    const serializedDescription = JSON.stringify(sections);
    const examToSave = { ...currentExam, description: serializedDescription };

    let error;
    if (examToSave.id) {
      const res = await supabase.from("exams").update(examToSave).eq("id", examToSave.id);
      error = res.error;
    } else {
      const res = await supabase.from("exams").insert(examToSave);
      error = res.error;
    }
    if (error) {
      console.error("Error saving exam:", error);
      alert("Failed to save exam: " + error.message);
      return;
    }
    setIsEditing(false);
    setCurrentExam({});
    setSections([]);
    fetchExams();
  };

  const handleEdit = (exam: any) => {
    setCurrentExam(exam);
    
    // Try to parse existing description as JSON sections
    try {
      if (exam.description && exam.description.startsWith('[')) {
        setSections(JSON.parse(exam.description));
      } else if (exam.description) {
        // Fallback for legacy HTML descriptions
        setSections([{
          id: Date.now().toString(),
          type: 'text',
          title: 'Legacy Content',
          content: exam.description
        }]);
      } else {
        setSections([]);
      }
    } catch (e) {
      console.error("Failed to parse description", e);
      setSections([{
        id: Date.now().toString(),
        type: 'text',
        title: 'Legacy Content',
        content: exam.description || ''
      }]);
    }
    
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setCurrentExam({});
    setSections([
      { id: Date.now().toString() + '1', type: 'text', title: 'Overview', content: '' },
      { id: Date.now().toString() + '2', type: 'text', title: 'Important Dates', content: '' },
      { id: Date.now().toString() + '3', type: 'table', title: 'Exam Pattern', content: '', tableData: { headers: ['Subject', 'Questions', 'Marks', 'Duration'], rows: [['', '', '', '']] } }
    ]);
    setIsEditing(true);
  };

  const addSection = (type: SectionType) => {
    const newSection: Section = {
      id: Date.now().toString(),
      type,
      title: 'New Section',
      content: '',
      ...(type === 'table' ? { tableData: { headers: ['Column 1', 'Column 2'], rows: [['', '']] } } : {})
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const updateTableHeader = (sectionId: string, colIndex: number, value: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId && s.tableData) {
        const newHeaders = [...s.tableData.headers];
        newHeaders[colIndex] = value;
        return { ...s, tableData: { ...s.tableData, headers: newHeaders } };
      }
      return s;
    }));
  };

  const updateTableCell = (sectionId: string, rowIndex: number, colIndex: number, value: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId && s.tableData) {
        const newRows = [...s.tableData.rows];
        newRows[rowIndex][colIndex] = value;
        return { ...s, tableData: { ...s.tableData, rows: newRows } };
      }
      return s;
    }));
  };

  const addRow = (sectionId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId && s.tableData) {
        const newRow = new Array(s.tableData.headers.length).fill('');
        return { ...s, tableData: { ...s.tableData, rows: [...s.tableData.rows, newRow] } };
      }
      return s;
    }));
  };

  const removeRow = (sectionId: string, rowIndex: number) => {
    setSections(sections.map(s => {
      if (s.id === sectionId && s.tableData) {
        const newRows = s.tableData.rows.filter((_, i) => i !== rowIndex);
        return { ...s, tableData: { ...s.tableData, rows: newRows } };
      }
      return s;
    }));
  };

  const addColumn = (sectionId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId && s.tableData) {
        const newHeaders = [...s.tableData.headers, `Column ${s.tableData.headers.length + 1}`];
        const newRows = s.tableData.rows.map(row => [...row, '']);
        return { ...s, tableData: { ...s.tableData, headers: newHeaders, rows: newRows } };
      }
      return s;
    }));
  };

  const removeColumn = (sectionId: string, colIndex: number) => {
    setSections(sections.map(s => {
      if (s.id === sectionId && s.tableData) {
        const newHeaders = s.tableData.headers.filter((_, i) => i !== colIndex);
        const newRows = s.tableData.rows.map(row => row.filter((_, i) => i !== colIndex));
        return { ...s, tableData: { ...s.tableData, headers: newHeaders, rows: newRows } };
      }
      return s;
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Exams</h1>
        <button onClick={handleAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
          <Plus size={20} /> Add New Exam
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">{currentExam.id ? "Edit Exam" : "Add New Exam"}</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Exam Title / Category</label>
              <input list="exam-categories" placeholder="e.g. SSC CGL Tier 1" value={currentExam.title || ""} onChange={e => setCurrentExam({...currentExam, title: e.target.value})} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" required />
              <datalist id="exam-categories">
                <option value="SSC Exams" />
                <option value="Banking Exams" />
                <option value="Teaching Exams" />
                <option value="Civil Services" />
                <option value="Railway Exams" />
              </datalist>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Exam Date</label>
              <input type="date" placeholder="Date" value={currentExam.date ? new Date(currentExam.date).toISOString().split('T')[0] : ""} onChange={e => setCurrentExam({...currentExam, date: e.target.value})} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            
            <div className="md:col-span-2 space-y-6 mt-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-lg font-bold text-gray-800">Content Sections</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => addSection('text')} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition flex items-center gap-1"><Plus size={16}/> Text Section</button>
                  <button type="button" onClick={() => addSection('table')} className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-100 transition flex items-center gap-1"><Plus size={16}/> Table Section</button>
                </div>
              </div>

              {sections.map((section, index) => (
                <div key={section.id} className="border border-gray-200 rounded-xl p-5 bg-gray-50 relative shadow-sm">
                  <button type="button" onClick={() => removeSection(section.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 bg-white rounded-full p-1 shadow-sm">
                    <Trash2 size={16} />
                  </button>
                  
                  <div className="mb-4 pr-8">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                    <input 
                      type="text" 
                      value={section.title} 
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      className="border p-2 rounded-lg w-full md:w-1/2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {section.type === 'text' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                      <JoditEditor
                        value={section.content}
                        config={config}
                        onBlur={newContent => updateSection(section.id, { content: newContent })}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Table Data</label>
                      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                        <table className="w-full text-left bg-white">
                          <thead className="bg-gray-100">
                            <tr>
                              {section.tableData?.headers.map((header, hIndex) => (
                                <th key={hIndex} className="p-2 border-b border-r border-gray-200">
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="text" 
                                      value={header}
                                      onChange={(e) => updateTableHeader(section.id, hIndex, e.target.value)}
                                      className="w-full p-1.5 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                    <button type="button" onClick={() => removeColumn(section.id, hIndex)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                                  </div>
                                </th>
                              ))}
                              <th className="p-2 border-b w-10 text-center bg-gray-50">
                                <button type="button" onClick={() => addColumn(section.id)} className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded"><Plus size={16}/></button>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {section.tableData?.rows.map((row, rIndex) => (
                              <tr key={rIndex} className="border-b border-gray-100 hover:bg-gray-50">
                                {row.map((cell, cIndex) => (
                                  <td key={cIndex} className="p-2 border-r border-gray-200">
                                    <input 
                                      type="text" 
                                      value={cell}
                                      onChange={(e) => updateTableCell(section.id, rIndex, cIndex, e.target.value)}
                                      className="w-full p-1.5 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                  </td>
                                ))}
                                <td className="p-2 text-center">
                                  <button type="button" onClick={() => removeRow(section.id, rIndex)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <button type="button" onClick={() => addRow(section.id)} className="mt-3 text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
                        <Plus size={16} /> Add Row
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Official Link</label>
              <input type="text" placeholder="https://..." value={currentExam.link || ""} onChange={e => setCurrentExam({...currentExam, link: e.target.value})} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            
            <div className="md:col-span-2 flex gap-4 justify-end mt-4">
              <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Save Exam</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
              <th className="p-4 font-semibold">Title</th>
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.map(exam => (
              <tr key={exam.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="p-4 font-medium text-gray-800">{exam.title}</td>
                <td className="p-4 text-gray-600">{new Date(exam.date).toLocaleDateString()}</td>
                <td className="p-4 flex justify-end gap-3">
                  <button onClick={() => handleEdit(exam)} className="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded-lg transition"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(exam.id)} className="text-red-600 hover:text-red-800 p-2 bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {exams.length === 0 && (
              <tr><td colSpan={3} className="p-8 text-center text-gray-500">No exams found. Add one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
