import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../../services/supabaseClient";
import { Edit, Trash2, Plus, FileText, Loader2, AlertCircle, HelpCircle } from "lucide-react";
import ConfirmationModal from "../../components/ConfirmationModal";
import mammoth from "mammoth";
import JoditEditor from "jodit-react";
import MathText from "../../components/common/MathText";
import JSZip from "jszip";

// Helper to convert Word's OMML (Office Math Markup Language) to LaTeX
function ommlToLatex(node: Element): string {
  let result = "";
  const children = Array.from(node.childNodes);

  for (const childNode of children) {
    if (childNode.nodeType !== Node.ELEMENT_NODE) {
      if (childNode.nodeType === Node.TEXT_NODE) {
        result += childNode.textContent || "";
      }
      continue;
    }

    const child = childNode as Element;
    const name = child.localName;

    switch (name) {
      case "f": // Fraction
        const num = Array.from(child.children).find(c => c.localName === "num");
        const den = Array.from(child.children).find(c => c.localName === "den");
        if (num && den) {
          result += `\\frac{${ommlToLatex(num)}}{${ommlToLatex(den)}}`;
        }
        break;
      case "sSup": // Superscript
        const supBase = Array.from(child.children).find(c => c.localName === "e");
        const supExp = Array.from(child.children).find(c => c.localName === "sup");
        if (supBase && supExp) {
          result += `${ommlToLatex(supBase)}^{${ommlToLatex(supExp)}}`;
        }
        break;
      case "sSub": // Subscript
        const subBase = Array.from(child.children).find(c => c.localName === "e");
        const subVal = Array.from(child.children).find(c => c.localName === "sub");
        if (subBase && subVal) {
          result += `${ommlToLatex(subBase)}_{${ommlToLatex(subVal)}}`;
        }
        break;
      case "sSubSup": // Sub-Superscript
        const ssBase = Array.from(child.children).find(c => c.localName === "e");
        const ssSub = Array.from(child.children).find(c => c.localName === "sub");
        const ssSup = Array.from(child.children).find(c => c.localName === "sup");
        if (ssBase && ssSub && ssSup) {
          result += `${ommlToLatex(ssBase)}_{${ommlToLatex(ssSub)}}^{${ommlToLatex(ssSup)}}`;
        }
        break;
      case "r": // Run
      case "t": // Text
        const t = child.localName === "t" ? child : Array.from(child.children).find(c => c.localName === "t");
        if (t) result += t.textContent || "";
        else result += ommlToLatex(child);
        break;
      case "d": // Delimiter (parentheses)
        const delimE = Array.from(child.children).find(c => c.localName === "e");
        if (delimE) result += `(${ommlToLatex(delimE)})`;
        break;
      case "rad": // Radical
        const radE = Array.from(child.children).find(c => c.localName === "e");
        const deg = Array.from(child.children).find(c => c.localName === "deg");
        if (deg && deg.textContent?.trim()) {
          result += `\\sqrt[${ommlToLatex(deg)}]{${ommlToLatex(radE!)}}`;
        } else if (radE) {
          result += `\\sqrt{${ommlToLatex(radE)}}`;
        }
        break;
      case "nary": // N-ary (Sum, Integral)
        const naryE = Array.from(child.children).find(c => c.localName === "e");
        const sub = Array.from(child.children).find(c => c.localName === "sub");
        const sup = Array.from(child.children).find(c => c.localName === "sup");
        const chr = Array.from(child.children).find(c => c.localName === "chr")?.getAttribute("m:val") || "\\sum";
        let naryRes = chr;
        if (sub) naryRes += `_{${ommlToLatex(sub)}}`;
        if (sup) naryRes += `^{${ommlToLatex(sup)}}`;
        if (naryE) naryRes += ` ${ommlToLatex(naryE)}`;
        result += naryRes;
        break;
      case "m": // Matrix
        const rows = Array.from(child.children).filter(c => c.localName === "mr");
        result += "\\begin{matrix}";
        rows.forEach((row, rIdx) => {
          const cells = Array.from(row.children).filter(c => c.localName === "e");
          cells.forEach((cell, cIdx) => {
            result += ommlToLatex(cell);
            if (cIdx < cells.length - 1) result += " & ";
          });
          if (rIdx < rows.length - 1) result += " \\\\ ";
        });
        result += "\\end{matrix}";
        break;
      case "limLow": // Lower limit
        const limLowBase = Array.from(child.children).find(c => c.localName === "e");
        const limLowLim = Array.from(child.children).find(c => c.localName === "lim");
        if (limLowBase && limLowLim) {
          result += `\\lim_{${ommlToLatex(limLowLim)}} ${ommlToLatex(limLowBase)}`;
        }
        break;
      case "limUpp": // Upper limit
        const limUppBase = Array.from(child.children).find(c => c.localName === "e");
        const limUppLim = Array.from(child.children).find(c => c.localName === "lim");
        if (limUppBase && limUppLim) {
          result += `\\lim^{${ommlToLatex(limUppLim)}} ${ommlToLatex(limUppBase)}`;
        }
        break;
      case "bar": // Bar
        const barE = Array.from(child.children).find(c => c.localName === "e");
        if (barE) result += `\\overline{${ommlToLatex(barE)}}`;
        break;
      case "box": // Box
      case "borderBox": // Border Box
        const boxE = Array.from(child.children).find(c => c.localName === "e");
        if (boxE) result += `\\boxed{${ommlToLatex(boxE)}}`;
        break;
      case "acc": // Accent
        const accE = Array.from(child.children).find(c => c.localName === "e");
        const accChr = Array.from(child.children).find(c => c.localName === "chr")?.getAttribute("m:val") || "\\hat";
        if (accE) result += `${accChr}{${ommlToLatex(accE)}}`;
        break;
      case "func": // Function (sin, cos, etc.)
        const fName = Array.from(child.children).find(c => c.localName === "fName");
        const funcE = Array.from(child.children).find(c => c.localName === "e");
        if (fName && funcE) {
          result += `${ommlToLatex(fName)} ${ommlToLatex(funcE)}`;
        }
        break;
      case "eqArr": // Equation Array
        const eqArrE = Array.from(child.children).filter(c => c.localName === "e");
        result += "\\begin{matrix}";
        eqArrE.forEach((e, idx) => {
          result += ommlToLatex(e);
          if (idx < eqArrE.length - 1) result += " \\\\ ";
        });
        result += "\\end{matrix}";
        break;
      case "oMath":
      case "oMathPara":
      case "e":
      case "num":
      case "den":
        result += ommlToLatex(child);
        break;
      default:
        // For other nodes, just try to extract text or recurse
        if (child.textContent && !child.children.length) {
          result += child.textContent;
        } else {
          result += ommlToLatex(child);
        }
    }
  }
  return result;
}

export default function ManageTests() {
  const [tests, setTests] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTest, setCurrentTest] = useState<any>({ questions: [], sections: ["General Section"], exam_id: "" });
  const [isUploading, setIsUploading] = useState(false);
  const [activeImportSection, setActiveImportSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("General Section");
  const [error, setError] = useState<string | null>(null);
  const [showMathGuide, setShowMathGuide] = useState(false);
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

  const fetchExams = async () => {
    const { data, error } = await supabase.from("exams").select("id, title");
    if (data) setExams(data);
    if (error) console.error("Error fetching exams:", error);
  };

  useEffect(() => {
    fetchTests();
    fetchExams();
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
      
      // --- SMART MATH RECOVERY ---
      // We use JSZip to read the raw XML and extract math that mammoth misses
      let recoveredTableData: any[][] = [];
      try {
        const zip = await JSZip.loadAsync(arrayBuffer);
        const docXml = await zip.file("word/document.xml")?.async("string");
        if (docXml) {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(docXml, "application/xml");
          const xmlTables = xmlDoc.getElementsByTagName("w:tbl");
          
          Array.from(xmlTables).forEach(table => {
            const tableRows: any[] = [];
            const rows = table.getElementsByTagName("w:tr");
            Array.from(rows).forEach(row => {
              const cells = row.getElementsByTagName("w:tc");
              const cellData = Array.from(cells).map(cell => {
                // Check for math nodes
                const mathNodes = cell.getElementsByTagName("m:oMath");
                if (mathNodes.length > 0) {
                  // If cell has math, we reconstruct the content with LaTeX
                  let fullContent = "";
                  // We iterate through all children to keep order of text and math
                  const walk = (node: Node) => {
                    if (node.nodeName === "m:oMath" || node.nodeName === "m:oMathPara") {
                      fullContent += `$${ommlToLatex(node as Element)}$`;
                    } else if (node.nodeName === "w:t" || node.nodeName === "m:t") {
                      fullContent += node.textContent || "";
                    } else if (node.nodeName === "w:br") {
                      fullContent += "\n";
                    } else if (node.nodeName === "w:tab") {
                      fullContent += "\t";
                    } else {
                      node.childNodes.forEach(walk);
                    }
                  };
                  walk(cell);
                  return fullContent.trim();
                }
                return null; // No math found in this cell
              });
              tableRows.push(cellData);
            });
            recoveredTableData.push(tableRows);
          });
        }
      } catch (err) {
        console.warn("Math recovery failed, falling back to standard import:", err);
      }

      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        { 
          convertImage: (mammoth.images as any).inline((element: any) => {
            return element.read("base64").then((imageBuffer: any) => {
              return {
                src: `data:${element.contentType};base64,${imageBuffer.toString("base64")}`
              };
            });
          })
        }
      );
      const html = result.value;

      if (!html.trim()) {
        throw new Error("The selected file is empty or could not be read.");
      }

      // Create a temporary element to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Get all paragraphs/rows
      const elements = Array.from(tempDiv.querySelectorAll('p, tr, li, div'));
      const rows = elements.map(el => ({
        text: el.textContent?.trim() || "",
        html: el.innerHTML.trim()
      })).filter(r => r.text || r.html);

      const questions: any[] = [];
      let currentQ: any = null;

      // Helper to process a question
      const pushCurrentQ = () => {
        if (currentQ && currentQ.options.length > 0) {
          while (currentQ.options.length < 4) currentQ.options.push("Option " + (currentQ.options.length + 1));
          questions.push(currentQ);
        }
      };

      // 1. Try Table-based parsing (Common for structured Word files like the user's)
      const tables = tempDiv.querySelectorAll('table');
      if (tables.length > 0) {
        tables.forEach((table, tIdx) => {
          const rows = Array.from(table.querySelectorAll('tr'));
          const recoveredTable = recoveredTableData[tIdx] || [];

          rows.forEach((tr, rIdx) => {
            const cells = Array.from(tr.querySelectorAll('td'));
            const recoveredRow = recoveredTable[rIdx] || [];

            if (cells.length >= 2) {
              const label = cells[0].textContent?.trim().toLowerCase() || "";
              let contentHtml = cells[1].innerHTML.trim();
              let contentText = cells[1].textContent?.trim() || "";
              
              // Apply recovered math if available
              if (recoveredRow[1]) {
                const hasRecoveredMath = recoveredRow[1].includes("$");
                // If we recovered math, we should use it if it contains LaTeX delimiters
                // or if the standard content seems broken.
                if (hasRecoveredMath || !contentText || contentText.includes("[Formula Error]")) {
                  contentHtml = `<p>${recoveredRow[1]}</p>`;
                  contentText = recoveredRow[1];
                }
              }

              if (label.includes("question")) {
                pushCurrentQ();
                currentQ = {
                  questionText: contentHtml,
                  options: [],
                  correctAnswerIndex: 0,
                  marks: 1
                };
              } else if (currentQ && label.includes("option")) {
                // If we recovered math for this option, use it
                const hasRecoveredMath = recoveredRow[1] && recoveredRow[1].includes("$");
                if (hasRecoveredMath || (recoveredRow[1] && (!contentText || contentText.includes("[Formula Error]")))) {
                  currentQ.options.push(`<p>${recoveredRow[1]}</p>`);
                } else {
                  const hasImg = cells[1].querySelector('img') !== null;
                  // If both text and images are missing, it's likely an unsupported Word Equation
                  if (!contentText && !hasImg) {
                    currentQ.options.push("<p style='color: #ef4444; font-size: 10px;'><i>[Formula Error: Use LaTeX format - See Math Guide]</i></p>");
                  } else {
                    currentQ.options.push(contentHtml || contentText || "Option " + (currentQ.options.length + 1));
                  }
                }
              } else if (currentQ && label.includes("answer")) {
                const ansVal = parseInt(contentText.replace(/[^0-9]/g, ''));
                if (!isNaN(ansVal)) {
                  currentQ.correctAnswerIndex = Math.max(0, ansVal - 1);
                }
              } else if (currentQ && (label.includes("positive marks") || label.includes("marks"))) {
                const marksVal = parseInt(contentText.replace(/[^0-9]/g, ''));
                if (!isNaN(marksVal)) {
                  currentQ.marks = marksVal;
                }
              }
            }
          });
        });
      }
      
      // Push the last question if any
      pushCurrentQ();

      // 2. Fallback to Paragraph-based parsing if no questions found in tables
      if (questions.length === 0) {
        const elements = Array.from(tempDiv.querySelectorAll('p, tr, li, div'));
        const rows = elements.map(el => ({
          text: el.textContent?.trim() || "",
          html: el.innerHTML.trim()
        })).filter(r => r.text || r.html);

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const nextRow = rows[i + 1];
          const cleanText = row.text.toLowerCase();

          if (cleanText === "question") {
            pushCurrentQ();
            currentQ = {
              questionText: nextRow ? nextRow.html : "",
              options: [],
              correctAnswerIndex: 0,
              marks: 1
            };
            i++; 
            continue;
          }

          if (!currentQ) continue;

          if (cleanText === "option") {
            currentQ.options.push(nextRow ? nextRow.html : "");
            i++;
            continue;
          }

          if (cleanText === "answer") {
            const ansVal = parseInt(nextRow ? nextRow.text.replace(/[^0-9]/g, '') : "");
            if (!isNaN(ansVal)) {
              currentQ.correctAnswerIndex = ansVal - 1;
            }
            i++;
            continue;
          }
        }
      }
      
      pushCurrentQ();

      // Final pass: Map indices to actual option text
      const defaultSection = activeImportSection || (currentTest.sections && currentTest.sections.length > 0 
        ? currentTest.sections[0] 
        : "General Section");

      const finalQuestions = questions.map(q => ({
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.options[q.correctAnswerIndex] || q.options[0],
        section: defaultSection,
        marks: q.marks || 1
      }));

      if (finalQuestions.length > 0) {
        setCurrentTest({
          ...currentTest,
          questions: [...(currentTest.questions || []), ...finalQuestions]
        });
        // Auto-switch to the tab where questions were imported
        setActiveTab(defaultSection);
      } else {
        throw new Error("Could not find any questions. Please ensure your Word file has labels like 'Question', 'Option', and 'Answer' in separate rows.");
      }
    } catch (error: any) {
      console.error("Error parsing Word file:", error);
      setError(`Failed to parse Word file: ${error.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
      setActiveImportSection(null);
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
        instructions: currentTest.instructions || "",
        exam_id: currentTest.exam_id,
        questions: currentTest.questions.map((q: any, index: number) => ({
          ...q,
          id: q.id || `q-${Date.now()}-${index}`
        }))
      };

      let result;
      if (currentTest.id) {
        result = await supabase.from("tests").update({
          ...testData,
          sections: currentTest.sections || ["General Section"]
        }).eq("id", currentTest.id);
      } else {
        result = await supabase.from("tests").insert([{
          ...testData,
          sections: currentTest.sections || ["General Section"]
        }]);
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

  const addQuestion = (sectionName: string) => {
    setCurrentTest({
      ...currentTest,
      questions: [...(currentTest.questions || []), { 
        questionText: "", 
        options: ["", "", "", ""], 
        correctAnswer: "",
        section: sectionName,
        marks: 1
      }]
    });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = currentTest.questions.filter((_: any, i: number) => i !== index);
    setCurrentTest({ ...currentTest, questions: newQuestions });
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

  const addSection = () => {
    const newSectionName = "New Section " + ((currentTest.sections?.length || 0) + 1);
    const newSections = [...(currentTest.sections || []), newSectionName];
    setCurrentTest({ ...currentTest, sections: newSections });
    setActiveTab(newSectionName);
  };

  const updateSection = (index: number, value: string) => {
    const oldName = currentTest.sections[index];
    const newSections = [...currentTest.sections];
    newSections[index] = value;

    // Update activeTab if it was the renamed section
    if (activeTab === oldName) {
      setActiveTab(value);
    }

    // Update all questions that were in the old section to the new section name
    const newQuestions = currentTest.questions.map((q: any) => {
      if ((q.section || "General Section") === oldName) {
        return { ...q, section: value };
      }
      return q;
    });

    setCurrentTest({ ...currentTest, sections: newSections, questions: newQuestions });
  };

  const removeSection = (index: number) => {
    const sectionToRemove = currentTest.sections[index];
    const newSections = currentTest.sections.filter((_: any, i: number) => i !== index);
    
    // Update activeTab if it was the removed section
    if (activeTab === sectionToRemove) {
      setActiveTab(newSections[0] || "General Section");
    }

    // Update questions that were in this section to the first available section
    const newQuestions = currentTest.questions.map((q: any) => {
      if (q.section === sectionToRemove) {
        return { ...q, section: newSections[0] || "General Section" };
      }
      return q;
    });

    setCurrentTest({ ...currentTest, sections: newSections, questions: newQuestions });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Tests</h1>
        <button onClick={() => { setIsEditing(true); setCurrentTest({ questions: [], sections: ["General Section"] }); setActiveTab("General Section"); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
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
              <select value={currentTest.exam_id || ""} onChange={e => setCurrentTest({...currentTest, exam_id: e.target.value})} className="border p-3 rounded-lg w-full" required>
                <option value="">Select Exam</option>
                {exams.map(exam => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
              </select>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 uppercase tracking-widest text-sm">Exam Sections</h3>
                <button 
                  type="button" 
                  onClick={addSection}
                  className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1 uppercase tracking-widest"
                >
                  <Plus size={14} /> Add Section
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(currentTest.sections || []).map((section: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      type="text" 
                      value={section} 
                      onChange={e => updateSection(idx, e.target.value)}
                      className="border p-2 rounded-lg w-full text-sm font-medium"
                      placeholder="Section Name"
                      required
                    />
                    {currentTest.sections.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeSection(idx)}
                        className="text-red-500 hover:text-red-600 p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2 uppercase font-bold">Define sections first, then assign questions to them below.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest">Exam Instructions</label>
              <div className="border rounded-lg overflow-hidden">
                <JoditEditor
                  value={currentTest.instructions || ""}
                  config={{
                    readonly: false,
                    placeholder: "Enter specific instructions for this exam (Optional)",
                    buttons: [
                      'bold', 'italic', 'underline', 'strikethrough', '|',
                      'ul', 'ol', '|',
                      'font', 'fontsize', 'brush', 'paragraph', '|',
                      'table', 'link', '|',
                      'align', 'undo', 'redo', '|',
                      'hr', 'eraser', 'fullsize'
                    ],
                    height: 300,
                  }}
                  onBlur={newContent => setCurrentTest({...currentTest, instructions: newContent})}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">If left empty, default instructions will be shown.</p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Questions</h3>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setShowMathGuide(true)}
                    className="hidden md:flex bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 items-center gap-2 hover:bg-blue-100 transition-colors"
                  >
                    <AlertCircle size={14} className="text-blue-500" />
                    <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest">
                      Math Formula Guide
                    </p>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".docx" 
                    className="hidden" 
                  />
                </div>
              </div>

              <div className="space-y-8">
                {/* Tabs Navigation */}
                <div className="flex flex-wrap gap-2 border-b-2 border-gray-100 pb-4">
                  {(currentTest.sections || ["General Section"]).map((sectionName: string, sIdx: number) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setActiveTab(sectionName)}
                      className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                        activeTab === sectionName
                          ? "bg-gray-900 text-white shadow-lg shadow-gray-200 scale-105"
                          : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      {sectionName}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={addSection}
                    className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all flex items-center gap-2"
                  >
                    <Plus size={14} /> New Section
                  </button>
                </div>

                {/* Active Tab Content */}
                {(currentTest.sections || ["General Section"]).map((sectionName: string, sIdx: number) => {
                  if (activeTab !== sectionName) return null;

                  const sectionQuestions = currentTest.questions?.map((q: any, i: number) => ({ ...q, originalIndex: i }))
                    .filter((q: any) => (q.section || "General Section") === sectionName) || [];

                  return (
                    <div key={sIdx} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex justify-between items-center bg-gray-900 p-4 rounded-2xl">
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">{sectionName}</h4>
                        <div className="flex gap-2">
                          <button 
                            type="button" 
                            onClick={() => {
                              setActiveImportSection(sectionName);
                              fileInputRef.current?.click();
                            }}
                            disabled={isUploading}
                            className="bg-white/10 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition flex items-center gap-2 disabled:opacity-50 backdrop-blur-sm"
                          >
                            {isUploading && activeImportSection === sectionName ? <Loader2 className="animate-spin" size={14} /> : <FileText size={14} />}
                            Import to {sectionName}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setShowMathGuide(true)}
                            className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500/30 transition flex items-center gap-2 backdrop-blur-sm border border-blue-500/30"
                          >
                            <HelpCircle size={14} /> Math Guide
                          </button>
                          <button 
                            type="button" 
                            onClick={() => addQuestion(sectionName)}
                            className="bg-green-500 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-600 transition flex items-center gap-2 shadow-lg shadow-green-500/20"
                          >
                            <Plus size={14} /> Add Question
                          </button>
                        </div>
                      </div>

                      {sectionQuestions.length === 0 ? (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                            <FileText className="text-gray-300" size={32} />
                          </div>
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No questions in this section yet.</p>
                          <p className="text-[10px] text-gray-300 uppercase font-bold mt-1">Start by adding a question or importing from Word.</p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {sectionQuestions.map((q: any, sqIdx: number) => {
                            const qIndex = q.originalIndex;
                            return (
                              <div key={sqIdx} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative group hover:shadow-xl hover:shadow-gray-100 transition-all duration-500">
                                <button 
                                  type="button"
                                  onClick={() => removeQuestion(qIndex)}
                                  className="absolute top-6 right-6 text-gray-200 hover:text-red-500 transition-colors bg-gray-50 p-2 rounded-xl hover:bg-red-50"
                                  title="Remove Question"
                                >
                                  <Trash2 size={18} />
                                </button>

                                <div className="mb-8">
                                  <div className="flex items-center gap-3 mb-4">
                                    <span className="w-8 h-8 bg-gray-900 text-white rounded-xl flex items-center justify-center text-xs font-black">
                                      {sqIdx + 1}
                                    </span>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Question Text</label>
                                  </div>
                                  <div className="border-2 border-gray-50 rounded-2xl bg-white overflow-hidden focus-within:border-gray-900 transition-colors">
                                    <JoditEditor
                                      value={q.questionText}
                                      config={{
                                        readonly: false,
                                        placeholder: `Enter Question Text`,
                                        buttons: ['bold', 'italic', 'underline', 'strikethrough', '|', 'ul', 'ol', '|', 'font', 'fontsize', 'brush', '|', 'table', 'link', '|', 'align', 'undo', 'redo', '|', 'eraser'],
                                        height: 200,
                                        toolbarAdaptive: false,
                                        useSearch: false,
                                        spellcheck: false
                                      }}
                                      onBlur={newContent => updateQuestion(qIndex, 'questionText', newContent)}
                                      onChange={newContent => {
                                        if (newContent !== q.questionText) {
                                          updateQuestion(qIndex, 'questionText', newContent);
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Live Math/Rich Preview</p>
                                    <div className="prose prose-sm max-w-none text-gray-700">
                                      <MathText text={q.questionText} />
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                  <div className="bg-gray-50 p-6 rounded-2xl">
                                    <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">Marks for this Question</label>
                                    <input 
                                      type="number" 
                                      placeholder="1" 
                                      value={q.marks || ""} 
                                      onChange={e => updateQuestion(qIndex, 'marks', parseInt(e.target.value) || 0)} 
                                      className="border-2 border-white p-4 rounded-xl w-full bg-white font-black text-sm focus:border-gray-900 outline-none transition-all shadow-sm" 
                                    />
                                  </div>
                                  <div className="bg-gray-50 p-6 rounded-2xl">
                                    <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">Move to Section</label>
                                    <select 
                                      value={q.section || ""} 
                                      onChange={e => updateQuestion(qIndex, 'section', e.target.value)} 
                                      className="border-2 border-white p-4 rounded-xl w-full bg-white font-black text-sm focus:border-gray-900 outline-none transition-all shadow-sm appearance-none" 
                                      required
                                    >
                                      {(currentTest.sections || ["General Section"]).map((s: string, i: number) => (
                                        <option key={i} value={s}>{s}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                  {q.options.map((opt: string, optIndex: number) => (
                                    <div key={optIndex} className="relative">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-widest">
                                          Option {String.fromCharCode(65 + optIndex)}
                                        </span>
                                      </div>
                                      <div className="border-2 border-gray-50 rounded-2xl bg-white overflow-hidden focus-within:border-gray-900 transition-colors">
                                        <JoditEditor
                                          value={opt}
                                          config={{
                                            readonly: false,
                                            placeholder: `Option ${optIndex + 1}`,
                                            buttons: ['bold', 'italic', 'underline', '|', 'font', 'fontsize', 'brush', '|', 'eraser'],
                                            height: 120,
                                            toolbarAdaptive: false,
                                            showCharsCounter: false,
                                            showWordsCounter: false,
                                            showXPathInStatusbar: false,
                                            useSearch: false,
                                            spellcheck: false
                                          }}
                                          onBlur={newContent => updateOption(qIndex, optIndex, newContent)}
                                          onChange={newContent => {
                                            // Only update if content actually changed to avoid unnecessary re-renders
                                            if (newContent !== opt) {
                                              updateOption(qIndex, optIndex, newContent);
                                            }
                                          }}
                                        />
                                      </div>
                                      <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Option Preview</p>
                                        <div className="prose prose-xs max-w-none text-gray-600">
                                          <MathText text={q.options[optIndex]} />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                                  <label className="block text-[10px] font-black text-green-600 mb-3 uppercase tracking-widest">Correct Answer</label>
                                  <select 
                                    value={q.correctAnswer} 
                                    onChange={e => updateQuestion(qIndex, 'correctAnswer', e.target.value)} 
                                    className="border-2 border-white p-4 rounded-xl w-full bg-white font-black text-sm focus:border-green-500 outline-none transition-all shadow-sm" 
                                    required
                                  >
                                    <option value="">Select Correct Answer</option>
                                    {q.options.map((opt: string, optIndex: number) => (
                                      <option key={optIndex} value={opt}>
                                        Option {String.fromCharCode(65 + optIndex)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
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
                  <button 
                    onClick={() => { 
                      setCurrentTest({
                        ...test,
                        sections: test.sections || ["General Section"]
                      }); 
                      setActiveTab(test.sections?.[0] || "General Section");
                      setIsEditing(true); 
                    }} 
                    className="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded-lg transition"
                  >
                    <Edit size={18} />
                  </button>
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

      {/* Math Guide Modal */}
      {showMathGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-gray-900 p-8 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Math Formula Guide</h2>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">How to import formulas from Word</p>
                </div>
                <button onClick={() => setShowMathGuide(false)} className="text-gray-400 hover:text-white transition-colors">
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                <h4 className="text-red-900 font-black text-xs uppercase tracking-widest mb-3">Important Notice</h4>
                <p className="text-xs text-red-800 leading-relaxed">
                  Microsoft Word's <b>Equation Editor</b> (visual formulas) cannot be imported directly as text. They will appear empty or as low-quality images. 
                  <b> To fix this, you MUST use LaTeX format.</b>
                </p>
              </div>

              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                <h4 className="text-blue-900 font-black text-xs uppercase tracking-widest mb-3">The Solution (LaTeX)</h4>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Type your formulas using dollar signs. This ensures they look perfect on all devices.
                </p>
              </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-2">In Word Document</p>
                    <code className="text-xs font-mono text-blue-600 block bg-white p-2 rounded-lg">{"$\\frac{4}{R_e}$"}</code>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-2">Result in App</p>
                    <div className="bg-white p-2 rounded-lg">
                      <MathText text="$\frac{4}{R_e}$" />
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 mt-4">
                  <p className="text-[10px] font-black text-orange-600 uppercase mb-2">Pro Tip: Word to LaTeX</p>
                  <p className="text-[10px] text-orange-800">
                    In Word, you can convert existing equations to LaTeX! <br/>
                    1. Select your equation. <br/>
                    2. Go to <b>Equation</b> tab {">"} <b>LaTeX</b>. <br/>
                    3. Click <b>Convert</b> {">"} <b>Current - Professional</b>.
                  </p>
                </div>

              <div className="bg-gray-900 p-6 rounded-3xl text-white">
                <h4 className="text-white font-black text-xs uppercase tracking-widest mb-3">How to convert in Word</h4>
                <ol className="space-y-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 list-decimal pl-4">
                  <li>Select your existing formula in Word.</li>
                  <li>Go to the <span className="text-blue-400">Equation</span> tab in the top ribbon.</li>
                  <li>Click the <span className="text-blue-400">LaTeX</span> button (left side).</li>
                  <li>Click <span className="text-blue-400">Convert</span> {">"} <span className="text-blue-400">All - Professional</span>.</li>
                  <li>Word will turn your visual formula into LaTeX text like <span className="text-white">{"$\\frac{4}{R_e}$"}</span>.</li>
                </ol>
              </div>

              <div className="bg-gray-900 p-6 rounded-3xl text-white">
                <h4 className="text-white font-black text-xs uppercase tracking-widest mb-3">Quick Delimiters</h4>
                <ul className="space-y-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Inline Math: <span className="text-white">$ formula $</span></li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Block Math: <span className="text-white">$$ formula $$</span></li>
                </ul>
              </div>

              <button 
                onClick={() => setShowMathGuide(false)}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition shadow-xl shadow-gray-200"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

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
