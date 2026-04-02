// Test comment
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../services/supabaseClient";
import { Edit, Trash2, Plus, FileText, Loader2, AlertCircle, HelpCircle, FileJson } from "lucide-react";
import ConfirmationModal from "../../components/ConfirmationModal";
import mammoth from "mammoth";
import JoditEditor from "jodit-react";
import MathText from "../../components/common/MathText";
import JSZip from "jszip";
import html2canvas from 'html2canvas';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Helper to convert Word's OMML (Office Math Markup Language) to LaTeX
// Helper to extract text from m:t nodes or standard nodes
function getMathText(node: Element): string {
  if (node.localName === "t") return node.textContent || "";
  const t = Array.from(node.getElementsByTagNameNS("*", "t"))[0];
  return t ? t.textContent || "" : node.textContent || "";
}

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

    // Use localName or nodeName (without prefix) for compatibility
    const tagName = name || child.nodeName.split(':').pop() || "";

    switch (tagName) {
      case "f": // Fraction
        const num = Array.from(child.children).find(c => c.localName === "num" || c.nodeName.endsWith(":num"));
        const den = Array.from(child.children).find(c => c.localName === "den" || c.nodeName.endsWith(":den"));
        if (num && den) result += `\\frac{${ommlToLatex(num)}}{${ommlToLatex(den)}}`;
        break;
      case "sSup": // Superscript
        const supBase = Array.from(child.children).find(c => c.localName === "e" || c.nodeName.endsWith(":e"));
        const supExp = Array.from(child.children).find(c => c.localName === "sup" || c.nodeName.endsWith(":sup"));
        if (supBase && supExp) result += `${ommlToLatex(supBase)}^{${ommlToLatex(supExp)}}`;
        break;
      case "sSub": // Subscript
        const subBase = Array.from(child.children).find(c => c.localName === "e" || c.nodeName.endsWith(":e"));
        const subVal = Array.from(child.children).find(c => c.localName === "sub" || c.nodeName.endsWith(":sub"));
        if (subBase && subVal) result += `${ommlToLatex(subBase)}_{${ommlToLatex(subVal)}}`;
        break;
      case "sSubSup": // Sub-Superscript
        const ssBase = Array.from(child.children).find(c => c.localName === "e" || c.nodeName.endsWith(":e"));
        const ssSub = Array.from(child.children).find(c => c.localName === "sub" || c.nodeName.endsWith(":sub"));
        const ssSup = Array.from(child.children).find(c => c.localName === "sup" || c.nodeName.endsWith(":sup"));
        if (ssBase && ssSub && ssSup) result += `${ommlToLatex(ssBase)}_{${ommlToLatex(ssSub)}}^{${ommlToLatex(ssSup)}}`;
        break;
      case "r": // Run
      case "t": // Text
        if (tagName === "t") result += child.textContent || "";
        else {
          const t = Array.from(child.children).find(c => c.localName === "t" || c.nodeName.endsWith(":t"));
          if (t) result += t.textContent || "";
          else result += ommlToLatex(child);
        }
        break;
      case "d": // Delimiter
        const delimE = Array.from(child.children).find(c => c.localName === "e" || c.nodeName.endsWith(":e"));
        const begChr = Array.from(child.children).find(c => c.localName === "begChr" || c.nodeName.endsWith(":begChr"))?.getAttribute("m:val") || "(";
        const endChr = Array.from(child.children).find(c => c.localName === "endChr" || c.nodeName.endsWith(":endChr"))?.getAttribute("m:val") || ")";

        let leftSide = begChr;
        let rightSide = endChr;

        // Map common Word delimiters to LaTeX
        if (begChr === "[") leftSide = "\\left[";
        else if (begChr === "(") leftSide = "\\left(";
        if (endChr === "]") rightSide = "\\right]";
        else if (endChr === ")") rightSide = "\\right)";

        if (delimE) result += `${leftSide}${ommlToLatex(delimE)}${rightSide}`;
        break;
      case "rad": // Radical
        const radE = Array.from(child.children).find(c => c.localName === "e" || c.nodeName.endsWith(":e"));
        const deg = Array.from(child.children).find(c => c.localName === "deg" || c.nodeName.endsWith(":deg"));
        if (deg && deg.textContent?.trim()) result += `\\sqrt[${ommlToLatex(deg)}]{${ommlToLatex(radE!)}}`;
        else if (radE) result += `\\sqrt{${ommlToLatex(radE)}}`;
        break;
      case "nary": // N-ary (Sum, Integral)
        const chrNode = Array.from(child.children).find(c => c.localName === "chr" || c.nodeName.endsWith(":chr"));
        const chr = chrNode?.getAttribute("m:val") || "\\sum";
        const narySub = Array.from(child.children).find(c => c.localName === "sub" || c.nodeName.endsWith(":sub"));
        const narySup = Array.from(child.children).find(c => c.localName === "sup" || c.nodeName.endsWith(":sup"));
        const naryE = Array.from(child.children).find(c => c.localName === "e" || c.nodeName.endsWith(":e"));
        let naryRes = chr;
        if (narySub) naryRes += `_{${ommlToLatex(narySub)}}`;
        if (narySup) naryRes += `^{${ommlToLatex(narySup)}}`;
        if (naryE) naryRes += ` ${ommlToLatex(naryE)}`;
        result += naryRes;
        break;
      case "m": // Matrix
        const rows = Array.from(child.children).filter(c => c.localName === "mr" || c.nodeName.endsWith(":mr"));
        result += "\\begin{bmatrix} ";
        rows.forEach((row, rIdx) => {
          const cells = Array.from(row.children).filter(c => c.localName === "e" || c.nodeName.endsWith(":e"));
          cells.forEach((cell, cIdx) => {
            result += ommlToLatex(cell);
            if (cIdx < cells.length - 1) result += " & ";
          });
          if (rIdx < rows.length - 1) result += " \\\\ ";
        });
        result += " \\end{bmatrix}";
        break;
      case "acc": // Accent
        const accE = Array.from(child.children).find(c => c.localName === "e" || c.nodeName.endsWith(":e"));
        const accPr = Array.from(child.children).find(c => c.localName === "accPr" || c.nodeName.endsWith(":accPr"));
        const accChr = accPr?.getElementsByTagNameNS("*", "chr")[0]?.getAttribute("m:val") || "^";

        let accLatex = "\\hat";
        if (accChr === "âƒ—" || accChr === "â†’") accLatex = "\\vec";
        else if (accChr === "Â¯") accLatex = "\\bar";
        else if (accChr === "Ìƒ") accLatex = "\\tilde";
        else if (accChr === "Ì‡") accLatex = "\\dot";

        if (accE) result += `${accLatex}{${ommlToLatex(accE)}}`;
        break;
      case "limLow": // Limit
        const limBase = Array.from(child.children).find(c => c.localName === "e" || c.nodeName.endsWith(":e"));
        const limVal = Array.from(child.children).find(c => c.localName === "lim" || c.nodeName.endsWith(":lim"));
        if (limBase && limVal) result += `\\lim_{${ommlToLatex(limVal)}} ${ommlToLatex(limBase)}`;
        break;
      case "groupChr": // Grouping (e.g. overbrace)
        const grpE = Array.from(child.children).find(c => c.localName === "e" || c.nodeName.endsWith(":e"));
        const grpPr = Array.from(child.children).find(c => c.localName === "groupChrPr" || c.nodeName.endsWith(":groupChrPr"));
        const grpPos = grpPr?.getElementsByTagNameNS("*", "pos")[0]?.getAttribute("m:val") || "top";

        let grpLatex = "\\overbrace";
        if (grpPos === "bot") grpLatex = "\\underbrace";

        if (grpE) result += `${grpLatex}{${ommlToLatex(grpE)}}`;
        break;
      case "mr": // Matrix Row
      case "e": // Element
      case "num":
      case "den":
      case "oMath":
      case "oMathPara":
        result += ommlToLatex(child);
        break;
      default:
        // Try to extract text if it exists but no children
        if (child.textContent && !child.children.length) {
          result += child.textContent;
        } else {
          result += ommlToLatex(child);
        }
    }
  }
  return result;
}

// Memoized Question Editor Item to isolate state and prevent massive re-renders while typing
const QuestionItem = React.memo(({
  question,
  index,
  displayIdx,
  sections,
  updateQuestion,
  updateOption,
  removeQuestion,
  uploadImageToSupabase
}: any) => {
  const [localQuestion, setLocalQuestion] = React.useState(question);

  // Sync with parent when the parent's data changes (e.g. from an import or external edit)
  React.useEffect(() => {
    setLocalQuestion(question);
  }, [question]);

  const handleUpdate = (field: string, value: any) => {
    setLocalQuestion((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: string, value: any) => {
    updateQuestion(index, field, value);
  };

  const handleOptionUpdate = (optIdx: number, value: string) => {
    const newOptions = [...localQuestion.options];
    newOptions[optIdx] = value;
    handleUpdate('options', newOptions);
  };

  const handleOptionBlur = (optIdx: number, value: string) => {
    updateOption(index, optIdx, value);
  };

  const editorConfig = (placeholder: string) => ({
    readonly: false,
    placeholder,
    height: 300,
    toolbarAdaptive: false,
    buttons: ['bold', 'italic', 'underline', 'strikethrough', '|', 'ul', 'ol', '|', 'font', 'fontsize', 'brush', 'paragraph', '|', 'table', 'link', 'image', '|', 'align', 'undo', 'redo', '|', 'hr', 'eraser', 'fullsize'],
    uploader: {
      insertImageAsBase64URI: false,
      process: async (files: any) => {
        const file = files[0];
        try {
          const url = await uploadImageToSupabase(file);
          return { files: [url] };
        } catch (error) {
          console.error("Upload error:", error);
          return { files: [] };
        }
      }
    },
    imageDefaultTab: "upload",
    imageTabs: ["upload"]
  });

  return (
    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative group hover:shadow-xl hover:shadow-gray-100 transition-all duration-500">
      <button
        type="button"
        onClick={() => removeQuestion(index)}
        className="absolute top-6 right-6 text-gray-200 hover:text-red-500 transition-colors bg-gray-50 p-2 rounded-xl hover:bg-red-50"
        title="Remove Question"
      >
        <Trash2 size={18} />
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-8 bg-gray-900 text-white rounded-xl flex items-center justify-center text-xs font-black">
            {displayIdx}
          </span>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Question Text</label>
        </div>
        <div className="rounded-2xl overflow-hidden border border-gray-100 mb-4 transition-all focus-within:border-blue-200 focus-within:ring-4 focus-within:ring-blue-50/50">
          <JoditEditor
            value={localQuestion.questionText || ""}
            config={editorConfig("Enter question text...")}
            onBlur={newContent => handleBlur('questionText', newContent)}
            onChange={newContent => {
              if (newContent !== localQuestion.questionText) {
                handleUpdate('questionText', newContent);
              }
            }}
          />
        </div>

        {/* Real-time Math Preview for Question */}
        <div className="mt-4 p-6 bg-blue-50/30 rounded-[1.5rem] border border-blue-100/50">
          <div className="text-[7px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Live Math/Rich Preview
          </div>
          <div className="prose prose-sm max-w-none text-gray-800">
            <MathText text={localQuestion.questionText} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-2">Marks for this question</label>
          <input
            type="number"
            placeholder="Marks"
            value={localQuestion.marks || 1}
            onChange={e => handleUpdate('marks', parseInt(e.target.value))}
            onBlur={e => handleBlur('marks', parseInt(e.target.value))}
            className="border-2 border-gray-100 p-4 rounded-2xl w-full text-sm font-black focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
          />
        </div>
        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-2">Move to Section</label>
          <select
            value={localQuestion.section || "General Section"}
            onChange={e => {
              handleUpdate('section', e.target.value);
              handleBlur('section', e.target.value);
            }}
            className="border-2 border-gray-100 p-4 rounded-2xl w-full text-sm font-black focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
          >
            {sections.map((sec: string) => <option key={sec} value={sec}>{sec}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 mb-8">
        {localQuestion.options.map((option: string, optIndex: number) => (
          <div key={optIndex} className="space-y-4">
            <div className="flex items-center justify-between pl-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Option {String.fromCharCode(65 + optIndex)}</label>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${index}`}
                  id={`q-${index}-opt-${optIndex}`}
                  checked={localQuestion.correctAnswer === localQuestion.options[optIndex]}
                  onChange={() => {
                    handleUpdate('correctAnswer', localQuestion.options[optIndex]);
                    handleBlur('correctAnswer', localQuestion.options[optIndex]);
                  }}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor={`q-${index}-opt-${optIndex}`} className="text-[9px] font-black text-gray-500 uppercase tracking-widest cursor-pointer">Correct</label>
              </div>
            </div>
            <div className="border border-gray-100 rounded-2xl overflow-hidden focus-within:border-blue-200 transition-all">
              <JoditEditor
                value={option || ""}
                config={editorConfig(`Option ${String.fromCharCode(65 + optIndex)}...`)}
                onBlur={newContent => handleOptionBlur(optIndex, newContent)}
                onChange={newContent => {
                  if (newContent !== option) {
                    handleOptionUpdate(optIndex, newContent);
                  }
                }}
              />
            </div>

            {/* Option Math Preview */}
            <div className={`mt-2 p-3 rounded-xl border transition-all flex items-center gap-3 ${
              localQuestion.correctAnswer === localQuestion.options[optIndex]
                ? 'bg-green-50/50 border-green-200'
                : 'bg-gray-50 border-gray-100'
            }`}>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-black shrink-0 ${
                localQuestion.correctAnswer === localQuestion.options[optIndex]
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-400'
              }`}>
                {String.fromCharCode(65 + optIndex)}
              </div>
              <div className="prose prose-xs max-w-none text-gray-600 flex-grow">
                <MathText text={option} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fallback for Correct Answer Selection if radio isn't enough */}
      <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
        <label className="block text-[10px] font-black text-green-600 mb-3 uppercase tracking-widest">Correct Answer</label>
        <select
          value={localQuestion.correctAnswer}
          onChange={e => {
            handleUpdate('correctAnswer', e.target.value);
            handleBlur('correctAnswer', e.target.value);
          }}
          className="border-2 border-white p-4 rounded-xl w-full bg-white font-black text-sm focus:border-green-500 outline-none transition-all shadow-sm"
          required
        >
          <option value="">Select Correct Answer</option>
          {localQuestion.options.map((opt: string, optIndex: number) => (
            <option key={optIndex} value={opt}>
              Option {String.fromCharCode(65 + optIndex)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});

export default function ManageTests() {
  const [tests, setTests] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTest, setCurrentTest] = useState<any>({ questions: [], sections: ["General Section"] });
  const [isUploading, setIsUploading] = useState(false);
  const [activeImportSection, setActiveImportSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("General Section");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [showMathGuide, setShowMathGuide] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

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
    onConfirm: () => { },
  });

  const fetchTests = async () => {
    const { data, error } = await supabase.from("tests").select("*");
    if (data) setTests(data);
    if (error) console.error("Error fetching tests:", error);
  };

  const fetchExams = async () => {
    const { data, error } = await supabase.from("exams").select("id, title, category");
    if (data) {
      setExams(data);
      const uniqueCats = Array.from(new Set(data.map((e: any) => e.category).filter(Boolean)));
      setCategories(uniqueCats as string[]);
    }
    if (error) console.error("Error fetching exams:", error);
  };

  const uploadImageToSupabase = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, file);

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  const convertMathToImage = async (latex: string) => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.padding = '10px';
    container.style.background = 'white';
    container.style.fontSize = '20px';

    try {
      container.innerHTML = katex.renderToString(latex.replace(/^\$|\$$/g, ''), {
        throwOnError: false,
        displayMode: true
      });
    } catch (e) {
      console.error("KaTeX rendering failed", e);
      return null;
    }

    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      backgroundColor: null,
      scale: 3
    });

    document.body.removeChild(container);

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png', 1.0);
    });
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
      const fileName = file.name.toLowerCase();
      console.log("Importing file:", fileName);
      const isJsonLike = fileName.endsWith(".json") || fileName.endsWith(".ts") || fileName.endsWith(".js") || fileName.endsWith(".tsx") || fileName.endsWith(".txt");

      if (isJsonLike) {
        const rawText = await file.text();
        console.log("Raw text length:", rawText.length);
        let jsonData;

        try {
          jsonData = JSON.parse(rawText);
          console.log("JSON parsed successfully");
        } catch (e) {
          console.log("JSON.parse failed, trying smart extraction...");

          let success = false;
          const markers = [
            { start: '[', end: ']' },
            { start: '{', end: '}' }
          ];

          for (const marker of markers) {
            let searchIdx = 0;
            while (!success && searchIdx < rawText.length) {
              const startIdx = rawText.indexOf(marker.start, searchIdx);
              if (startIdx === -1) break;

              // Find matching bracket
              let stack = 0;
              let endIdx = -1;
              for (let i = startIdx; i < rawText.length; i++) {
                if (rawText[i] === marker.start) stack++;
                else if (rawText[i] === marker.end) {
                  stack--;
                  if (stack === 0) {
                    endIdx = i;
                    break;
                  }
                }
              }

              if (endIdx !== -1) {
                const part = rawText.substring(startIdx, endIdx + 1);
                try {
                  // Use a safer evaluation if possible, but new Function is okay for this context
                  const evaluated = new Function("return " + part)();
                  if (evaluated && (Array.isArray(evaluated) || typeof evaluated === 'object')) {
                    // Basic validation: if it's an array, it should have items
                    // If it's an object, it should have keys
                    const isArray = Array.isArray(evaluated);
                    const hasContent = isArray ? evaluated.length > 0 : Object.keys(evaluated).length > 0;

                    if (hasContent) {
                      jsonData = evaluated;
                      success = true;
                      console.log(`Smart extraction successful using ${marker.start}. Found data of size:`, isArray ? evaluated.length : "object");
                      break;
                    }
                  }
                } catch (jsError) {
                  // Continue searching
                }
              }
              searchIdx = startIdx + 1;
            }
            if (success) break;
          }

          if (!success) {
            throw new Error("Could not parse file. Ensure it contains a valid JSON array or a JavaScript/TypeScript array like 'export const questions = [...]'.");
          }
        }

        const getVal = (obj: any, keys: string[]) => {
          const lowerKeys = keys.map(k => k.toLowerCase());
          const foundKey = Object.keys(obj).find(k => lowerKeys.includes(k.toLowerCase()));
          return foundKey ? obj[foundKey] : undefined;
        };

        let questionsToProcess = [];
        if (Array.isArray(jsonData)) {
          questionsToProcess = jsonData;
        } else if (jsonData && typeof jsonData === 'object') {
          const nestedQs = getVal(jsonData, ["questions", "data", "list"]);
          if (Array.isArray(nestedQs)) {
            questionsToProcess = nestedQs;
          } else {
            questionsToProcess = [jsonData];
          }
        }

        console.log("Questions to process:", questionsToProcess.length);

        const currentSections = currentTest.sections || ["General Section"];
        const defaultSection = activeImportSection || (currentSections.length > 0
          ? currentSections[0]
          : "General Section");

        const finalQuestions = questionsToProcess.map((q: any) => {
          const options = getVal(q, ["options", "choices", "answers"]) || ["", "", "", ""];
          let correctAnswer = "";
          const ansRaw = getVal(q, ["answer", "correctAnswer", "ans", "correct", "correct_answer"]);
          if (typeof ansRaw === 'number') {
            correctAnswer = options[ansRaw - 1] || options[0];
          } else {
            correctAnswer = ansRaw || options[0];
          }

          const qSection = getVal(q, ["section", "category", "subject"]) || defaultSection;

          return {
            questionText: getVal(q, ["question", "questionText", "text", "description", "title", "q"]) || "",
            options: Array.isArray(options) ? options : ["", "", "", ""],
            correctAnswer: correctAnswer,
            section: qSection,
            marks: getVal(q, ["marks", "positiveMarks", "weightage"]) || 1
          };
        });

        // Use FUNCTIONAL STATE UPDATE for 100% reliability
        setCurrentTest((prev: any) => {
          const newSectionsSet = new Set<string>(prev.sections || ["General Section"]);
          finalQuestions.forEach(fq => newSectionsSet.add(fq.section));
          return {
            ...prev,
            sections: Array.from(newSectionsSet),
            questions: [...(prev.questions || []), ...finalQuestions]
          };
        });

        const newTab = activeImportSection || finalQuestions[0]?.section || defaultSection;
        setActiveTab(newTab);
        setCurrentPage(1);
        setIsUploading(false);
        return;
      }

      let arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const docXml = await zip.file("word/document.xml")?.async("string");

      let mathMap: Record<string, string> = {};
      let modifiedDocXml = docXml;

      if (docXml) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(docXml, "application/xml");

        // Find ALL math containers (oMath and oMathPara)
        // We look for both because Word uses Para for display-mode and oMath for inline
        const mathNodes = Array.from(xmlDoc.querySelectorAll("*|oMath, *|oMathPara"));

        // Use a set to keep track of processed nodes to avoid double-processing (oMath inside oMathPara)
        const processedNodes = new Set<Node>();

        for (let i = 0; i < mathNodes.length; i++) {
          const node = mathNodes[i];
          if (processedNodes.has(node)) continue;

          // If it's a Para, mark its children as processed
          if (node.localName === "oMathPara" || node.nodeName.endsWith(":oMathPara")) {
            Array.from(node.querySelectorAll("*|oMath")).forEach(child => processedNodes.add(child));
          }

          const latexContent = ommlToLatex(node as Element).trim();
          if (!latexContent) continue;

          const latex = `$${latexContent}$`;
          const placeholder = `[[MATH_BLOCK_${i}]]`;

          let finalContent = latex;

          // Matrix detection (look for matrix, bmatrix, matrix, align, etc.)
          if (latex.includes("matrix") || latex.includes("\\\\") || latex.includes("&") || latex.length > 50) {
            try {
              const blob = await convertMathToImage(latex);
              if (blob) {
                const url = await uploadImageToSupabase(new File([blob], `math_${i}.png`, { type: 'image/png' }));
                finalContent = `<img src="${url}" class="matrix-img" style="vertical-align: middle; max-width: 90%; margin: 8px 0; display: inline-block;" />`;
              }
            } catch (e) {
              console.error("Math conversion to image failed", e);
            }
          }

          mathMap[placeholder] = finalContent;

          // CRITICAL: Replace with proper Word XML tags (w:r -> w:t)
          // Mammoth only likes text that is inside w:t nodes
          const wNamespace = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
          const rNode = xmlDoc.createElementNS(wNamespace, "w:r");
          const tNode = xmlDoc.createElementNS(wNamespace, "w:t");
          tNode.textContent = placeholder;
          rNode.appendChild(tNode);

          node.parentNode?.replaceChild(rNode, node);
        }

        modifiedDocXml = new XMLSerializer().serializeToString(xmlDoc);
        zip.file("word/document.xml", modifiedDocXml);
        arrayBuffer = await zip.generateAsync({ type: "arraybuffer" });
      }

      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          convertImage: (mammoth.images as any).inline(async (element: any) => {
            const imageBuffer = await element.read("base64");
            const byteArray = new Uint8Array(imageBuffer);
            const blob = new Blob([byteArray], { type: element.contentType });
            const file = new File([blob], 'image.' + element.contentType.split('/')[1]);
            return {
              src: await uploadImageToSupabase(file)
            };
          })
        }
      );

      let html = result.value;

      // RESTORE MATH from placeholders
      // We do this multiple times to catch if Mammoth wrapped placeholders in tags
      Object.entries(mathMap).forEach(([placeholder, content]) => {
        html = html.split(placeholder).join(content);
      });

      if (!html.trim()) {
        throw new Error("The selected file is empty or could not be read.");
      }

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      const questions: any[] = [];
      let currentQ: any = null;

      const pushCurrentQ = () => {
        if (currentQ && currentQ.options.length > 0) {
          while (currentQ.options.length < 4) currentQ.options.push("Option " + (currentQ.options.length + 1));
          questions.push(currentQ);
        }
      };

      // TABLE-BASED PARSING
      const tables = Array.from(tempDiv.querySelectorAll('table'));
      if (tables.length > 0) {
        tables.forEach((table) => {
          if (table.parentElement?.closest('table')) return;

          const rows = Array.from(table.rows);
          rows.forEach((tr) => {
            const cells = Array.from(tr.cells);
            if (cells.length >= 2) {
              const label = cells[0].textContent?.trim().toLowerCase() || "";
              let contentHtml = cells[1].innerHTML.trim();

              if (label.includes("question") || label.includes("q.") || label.includes("qno")) {
                pushCurrentQ();
                currentQ = {
                  questionText: contentHtml,
                  options: [],
                  correctAnswerIndex: 0,
                  marks: 1
                };
              } else if (currentQ && (label.includes("option") || label.includes("choice"))) {
                currentQ.options.push(contentHtml || "Option " + (currentQ.options.length + 1));
              } else if (currentQ && (label.includes("answer") || label.includes("correct"))) {
                const ansText = cells[1].textContent?.trim() || "";
                const ansVal = parseInt(ansText.replace(/[^0-9]/g, ''));
                if (!isNaN(ansVal)) {
                  currentQ.correctAnswerIndex = Math.max(0, ansVal - 1);
                }
              } else if (currentQ && (label.includes("positive marks") || label.includes("marks") || label.includes("weightage"))) {
                const marksText = cells[1].textContent?.trim() || "";
                const marksVal = parseInt(marksText.replace(/[^0-9]/g, ''));
                if (!isNaN(marksVal)) {
                  currentQ.marks = marksVal;
                }
              }
            }
          });
        });
      }

      pushCurrentQ();

      // FALLBACK PARSING
      if (questions.length === 0) {
        const elements = Array.from(tempDiv.children);
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          const text = el.textContent?.trim().toLowerCase() || "";

          if (text.includes("question") || text.includes("q.") || text.includes("qno")) {
            pushCurrentQ();
            const nextEl = elements[i + 1];
            currentQ = {
              questionText: nextEl ? nextEl.innerHTML : "",
              options: [],
              correctAnswerIndex: 0,
              marks: 1
            };
            i++;
            continue;
          }

          if (!currentQ) continue;

          if (text.includes("option") || text.includes("choice")) {
            const nextEl = elements[i + 1];
            currentQ.options.push(nextEl ? nextEl.innerHTML : "");
            i++;
            continue;
          }

          if (text.includes("answer") || text.includes("correct")) {
            const nextEl = elements[i + 1];
            const ansVal = parseInt(nextEl ? nextEl.textContent?.replace(/[^0-9]/g, '') || "" : "");
            if (!isNaN(ansVal)) {
              currentQ.correctAnswerIndex = ansVal - 1;
            }
            i++;
            continue;
          }
        }
        pushCurrentQ();
      }

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
        setCurrentTest((prev: any) => ({
          ...prev,
          questions: [...(prev.questions || []), ...finalQuestions]
        }));
        setActiveTab(defaultSection);
        setCurrentPage(1);
      } else {
        throw new Error("No questions found. Ensure labels like 'Question', 'Option', and 'Answer' are present.");
      }
    } catch (error: any) {
      console.error("Import Error:", error);
      setError(`Failed to import: ${error.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
      setActiveImportSection(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (jsonInputRef.current) jsonInputRef.current.value = "";
    }
  };


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Prepare data for Supabase
      const testData: any = {
        title: currentTest.title,
        timeLimit: parseInt(currentTest.timeLimit),
        category: currentTest.category || "Uncategorized",
        is_free: currentTest.is_free || false,
        is_live: currentTest.is_live || false,
        test_type: currentTest.test_type || "Full Length Mock",
        total_marks: parseInt(currentTest.total_marks) || 100,
        languages: currentTest.languages || "English, Telugu",
        start_date: currentTest.start_date || new Date().toISOString(),
        end_date: currentTest.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        sections: currentTest.sections || ["General Section"],
        instructions: currentTest.instructions || "",
        questions: currentTest.questions.map((q: any, index: number) => ({
          ...q,
          id: q.id || `q-${Date.now()}-${index}`
        }))
      };

      // Only add instructions if it's not empty, but the DB error suggests the column is missing
      // For now, I'll comment it out or remove it to allow saving to work
      // testData.instructions = currentTest.instructions || "";

      let result;
      if (currentTest.id) {
        result = await supabase.from("tests").update(testData).eq("id", currentTest.id);
      } else {
        result = await supabase.from("tests").insert([testData]);
      }

      if (result.error) throw result.error;

      setIsEditing(false);
      setCurrentTest({ 
        questions: [], 
        sections: ["General Section"], 
        category: "Uncategorized",
        is_free: false,
        is_live: false,
        test_type: "Full Length Mock",
        total_marks: 100,
        languages: "English, Telugu",
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      fetchTests();
    } catch (err: any) {
      console.error("Error saving test:", err);
      setError(`Failed to save test: ${err.message || "Unknown error"}`);
    }
  };

  const addQuestion = (sectionName: string) => {
    setCurrentTest((prev: any) => ({
      ...prev,
      questions: [...(prev.questions || []), {
        questionText: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        section: sectionName,
        marks: 1
      }]
    }));
  };

  const removeQuestion = (index: number) => {
    setCurrentTest((prev: any) => ({
      ...prev,
      questions: prev.questions.filter((_: any, i: number) => i !== index)
    }));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    setCurrentTest((prev: any) => {
      const newQuestions = [...prev.questions];
      if (newQuestions[index]) {
        newQuestions[index] = { ...newQuestions[index], [field]: value };
      }
      return { ...prev, questions: newQuestions };
    });
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    setCurrentTest((prev: any) => {
      const newQuestions = [...prev.questions];
      if (newQuestions[qIndex]) {
        const newOptions = [...newQuestions[qIndex].options];
        newOptions[optIndex] = value;
        newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
      }
      return { ...prev, questions: newQuestions };
    });
  };

  const addSection = () => {
    setCurrentTest((prev: any) => {
      const newSectionName = "New Section " + ((prev.sections?.length || 0) + 1);
      const newSections = [...(prev.sections || []), newSectionName];
      setActiveTab(newSectionName);
      setCurrentPage(1);
      return { ...prev, sections: newSections };
    });
  };

  const updateSection = (index: number, value: string) => {
    setCurrentTest((prev: any) => {
      const oldName = prev.sections[index];
      const newSections = [...prev.sections];
      newSections[index] = value;

      if (activeTab === oldName) {
        setActiveTab(value);
        setCurrentPage(1);
      }

      const newQuestions = prev.questions.map((q: any) => {
        if ((q.section || "General Section") === oldName) {
          return { ...q, section: value };
        }
        return q;
      });

      return { ...prev, sections: newSections, questions: newQuestions };
    });
  };

  const removeSection = (index: number) => {
    setCurrentTest((prev: any) => {
      const sectionToRemove = prev.sections[index];
      const newSections = prev.sections.filter((_: any, i: number) => i !== index);

      if (activeTab === sectionToRemove) {
        const newTab = newSections[0] || "General Section";
        setActiveTab(newTab);
        setCurrentPage(1);
      }

      const newQuestions = prev.questions.map((q: any) => {
        if (q.section === sectionToRemove) {
          return { ...q, section: newSections[0] || "General Section" };
        }
        return q;
      });

      return { ...prev, sections: newSections, questions: newQuestions };
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Tests</h1>
        <button onClick={() => { setIsEditing(true); setCurrentTest({ questions: [], sections: ["General Section"], category: "Uncategorized", is_free: false, is_live: false, test_type: "Full Length Mock", total_marks: 100, languages: "English, Telugu", start_date: new Date().toISOString().split('T')[0], end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }); setActiveTab("General Section"); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
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
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Test Title"
                  defaultValue={currentTest.title || ""}
                  onBlur={e => setCurrentTest((prev: any) => ({ ...prev, title: e.target.value }))}
                  className="border-2 border-gray-100 p-4 rounded-2xl w-full text-sm font-black focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-4">
                <input
                  type="number"
                  placeholder="Time Limit (mins)"
                  defaultValue={currentTest.timeLimit || ""}
                  onBlur={e => setCurrentTest((prev: any) => ({ ...prev, timeLimit: e.target.value }))}
                  className="border-2 border-gray-100 p-4 rounded-2xl w-full text-sm font-black focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Target Exam Category</label>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Exam Category (e.g., TS ECET)"
                  value={currentTest.category || ""}
                  onChange={e => {
                    setCurrentTest((prev: any) => ({ ...prev, category: e.target.value }));
                    setShowCategorySuggestions(true);
                  }}
                  onFocus={() => setShowCategorySuggestions(true)}
                  className="border-2 border-gray-100 p-4 rounded-2xl w-full text-sm font-black focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                  required
                />
              </div>
              
              {showCategorySuggestions && categories.length > 0 && (
                <div className="absolute z-[60] mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-2 grid grid-cols-2 gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCurrentTest((prev: any) => ({ ...prev, category: cat }));
                          setShowCategorySuggestions(false);
                        }}
                        className="text-left px-4 py-3 rounded-xl hover:bg-blue-50 text-xs font-bold text-gray-700 transition"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="bg-gray-50 p-2 text-center border-t border-gray-100">
                    <button 
                      type="button" 
                      onClick={() => setShowCategorySuggestions(false)}
                      className="text-[9px] font-black text-gray-400 uppercase hover:text-gray-600"
                    >
                      Close Suggestions
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest pl-1">Test Type</label>
                <select
                  value={currentTest.test_type || "Full Length Mock"}
                  onChange={e => setCurrentTest((prev: any) => ({ ...prev, test_type: e.target.value }))}
                  className="border-2 border-white p-4 rounded-2xl w-full text-sm font-black focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm"
                  required
                >
                  <option value="Full Length Mock">Full Length Mock</option>
                  <option value="Chapter Test">Chapter Test</option>
                  <option value="Subject Test">Subject Test</option>
                  <option value="CA Booster">CA Booster</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={currentTest.is_free || false}
                    onChange={e => setCurrentTest((prev: any) => ({ ...prev, is_free: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-xs font-black text-gray-700 uppercase tracking-widest">Free Test</span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={currentTest.is_live || false}
                    onChange={e => setCurrentTest((prev: any) => ({ ...prev, is_live: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  <span className="ml-3 text-xs font-black text-gray-700 uppercase tracking-widest">Live Test</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 mt-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Total Marks</label>
                <input
                  type="number"
                  value={currentTest.total_marks || 100}
                  onChange={e => setCurrentTest((prev: any) => ({ ...prev, total_marks: e.target.value }))}
                  className="border-2 border-white p-4 rounded-2xl w-full text-sm font-black focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm"
                  placeholder="e.g. 100"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Languages</label>
                <input
                  type="text"
                  value={currentTest.languages || "English, Telugu"}
                  onChange={e => setCurrentTest((prev: any) => ({ ...prev, languages: e.target.value }))}
                  className="border-2 border-white p-4 rounded-2xl w-full text-sm font-black focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm"
                  placeholder="e.g. English, Telugu"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Available From</label>
                <input
                  type="date"
                  value={currentTest.start_date || ""}
                  onChange={e => setCurrentTest((prev: any) => ({ ...prev, start_date: e.target.value }))}
                  className="border-2 border-white p-4 rounded-2xl w-full text-sm font-black focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Available To</label>
                <input
                  type="date"
                  value={currentTest.end_date || ""}
                  onChange={e => setCurrentTest((prev: any) => ({ ...prev, end_date: e.target.value }))}
                  className="border-2 border-white p-4 rounded-2xl w-full text-sm font-black focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm"
                />
              </div>
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
                  key={`instructions-${currentTest.id || 'new'}-${Date.now()}`}
                  value={currentTest.instructions || ""}
                  config={{
                    readonly: false,
                    placeholder: "Enter specific instructions for this exam (Optional)",
                    height: 300,
                    toolbarAdaptive: false,
                    buttons: ['bold', 'italic', 'underline', 'strikethrough', '|', 'ul', 'ol', '|', 'font', 'fontsize', 'brush', 'paragraph', '|', 'table', 'link', 'image', '|', 'align', 'undo', 'redo', '|', 'hr', 'eraser', 'fullsize'],
                    uploader: {
                      insertImageAsBase64URI: false,
                      process: async (files: any) => {
                        const file = files[0];
                        try {
                          const url = await uploadImageToSupabase(file);
                          return { files: [url] };
                        } catch (error) {
                          console.error("Upload error:", error);
                          return { files: [] };
                        }
                      }
                    },
                    imageDefaultTab: "upload",
                    imageTabs: ["upload"]
                  }}
                  onBlur={newContent => setCurrentTest({ ...currentTest, instructions: newContent })}
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
                  <input
                    type="file"
                    ref={jsonInputRef}
                    onChange={handleFileUpload}
                    accept=".json,.ts,.js,.tsx,.txt"
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
                      onClick={() => {
                        setActiveTab(sectionName);
                        setCurrentPage(1);
                      }}
                      className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === sectionName
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

                  const itemsPerPage = 10;
                  const totalPages = Math.ceil(sectionQuestions.length / itemsPerPage);
                  const paginatedQuestions = sectionQuestions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                  return (
                    <div key={sIdx} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex justify-between items-center bg-gray-900 p-4 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <h4 className="text-sm font-black text-white uppercase tracking-widest">{sectionName}</h4>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
                            {sectionQuestions.length} Questions
                          </span>
                        </div>
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
                            Import Word
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveImportSection(sectionName);
                              jsonInputRef.current?.click();
                            }}
                            disabled={isUploading}
                            className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-500/30 transition flex items-center gap-2 backdrop-blur-sm border border-purple-500/30"
                          >
                            {isUploading && activeImportSection === sectionName ? <Loader2 className="animate-spin" size={14} /> : <FileJson size={14} />}
                            Import JSON/TS
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
                          {paginatedQuestions.map((q: any, sqIdx: number) => {
                            const qIndex = q.originalIndex;
                            const displayIdx = (currentPage - 1) * itemsPerPage + sqIdx + 1;
                            return (
                              <QuestionItem
                                key={qIndex}
                                question={q}
                                index={qIndex}
                                displayIdx={displayIdx}
                                sections={currentTest.sections || ["General Section"]}
                                updateQuestion={updateQuestion}
                                updateOption={updateOption}
                                removeQuestion={removeQuestion}
                                uploadImageToSupabase={uploadImageToSupabase}
                              />
                            );
                          })}

                          {/* Pagination Controls */}
                          {totalPages > 1 && (
                            <div className="flex flex-col md:flex-row items-center justify-between bg-gray-900 p-8 rounded-[2.5rem] mt-12 gap-8 shadow-2xl shadow-gray-200">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Navigation</span>
                                <p className="text-white text-xs font-black uppercase tracking-widest">
                                  Page <span className="text-blue-400">{currentPage}</span> of <span className="text-blue-400">{totalPages}</span>
                                </p>
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentPage(prev => Math.max(1, prev - 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  disabled={currentPage === 1}
                                  className="bg-white/10 text-white disabled:opacity-20 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10"
                                >
                                  Previous
                                </button>

                                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                                  {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    // Only show current, first, last, and pages around current
                                    if (
                                      pageNum === 1 ||
                                      pageNum === totalPages ||
                                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                    ) {
                                      return (
                                        <button
                                          key={i}
                                          type="button"
                                          onClick={() => {
                                            setCurrentPage(pageNum);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                          }}
                                          className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all flex items-center justify-center ${currentPage === pageNum
                                              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                              : "text-gray-400 hover:text-white"
                                            }`}
                                        >
                                          {pageNum}
                                        </button>
                                      );
                                    } else if (
                                      pageNum === currentPage - 2 ||
                                      pageNum === currentPage + 2
                                    ) {
                                      return <span key={i} className="text-white/20" style={{ margin: '0 4px' }}>.</span>;
                                    }
                                    return null;
                                  })}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  disabled={currentPage === totalPages}
                                  className="bg-white/10 text-white disabled:opacity-20 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10"
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          )}
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
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Time Limit</th>
              <th className="p-4 font-semibold">Questions</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tests.map(test => (
              <tr key={test.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="p-4 font-medium text-gray-800">{test.title}</td>
                <td className="p-4">
                  <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-600 px-3 py-1 rounded-full whitespace-nowrap">
                    {test.category || "Uncategorized"}
                  </span>
                </td>
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
                  In Word, you can convert existing equations to LaTeX! <br />
                  1. Select your equation. <br />
                  2. Go to <b>Equation</b> tab {">"} <b>LaTeX</b>. <br />
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

              <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100">
                <h4 className="text-purple-900 font-black text-xs uppercase tracking-widest mb-3">New: JSON/TS Question Import</h4>
                <p className="text-[10px] text-purple-800 leading-relaxed mb-4">
                  For 100% accuracy, use a <b>.json</b> or <b>.ts</b> file. You can even import TypeScript code files!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-900 p-4 rounded-2xl">
                    <p className="text-[8px] font-black text-purple-300 uppercase mb-2">Standard JSON</p>
                    <pre className="text-white text-[8px] font-mono overflow-hidden">
                      {`[{
  "question": "...",
  "options": ["A", "B"],
  "answer": 1
}]`}
                    </pre>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-2xl">
                    <p className="text-[8px] font-black text-purple-300 uppercase mb-2">TypeScript File (.ts)</p>
                    <pre className="text-white text-[8px] font-mono overflow-hidden">
                      {`export const data = [
  {
    question: "...",
    options: ["A", "B"],
    answer: 1
  }
];`}
                    </pre>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <p className="text-[8px] text-purple-600 font-bold uppercase">â€¢ Importer automatically finds the [...] array in your TS file</p>
                  <p className="text-[8px] text-purple-600 font-bold uppercase">â€¢ Make sure to use double quotes for text if possible</p>
                </div>
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
