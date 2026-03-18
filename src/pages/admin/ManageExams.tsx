import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../../services/supabaseClient";
import { Edit, Trash2, Plus, X, PlayCircle, Copy, Link as LinkIcon, ArrowUp, ArrowDown, Bold, GripVertical } from "lucide-react";
import JoditEditor from "jodit-react";
import ConfirmationModal from "../../components/ConfirmationModal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type SectionType = 'text' | 'table' | 'text_table';

interface TableData {
  headers: string[];
  rows: string[][];
  boldCells?: boolean[][];
}

interface Section {
  id: string;
  type: SectionType;
  title: string;
  content: string;
  description?: string;
  tableData?: TableData;
}

interface SortableImportantDateProps {
  date: any;
  idx: number;
  updateImportantDate: (index: number, field: any, value: string) => void;
  removeImportantDate: (index: number) => void;
}

function SortableImportantDate({ 
  date, 
  idx, 
  updateImportantDate, 
  removeImportantDate 
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `date-${idx}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex gap-2 items-end bg-white p-3 rounded-lg border border-blue-200 shadow-sm relative group"
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-blue-600"
      >
        <GripVertical size={20} />
      </div>
      <div className="flex-1 space-y-1">
        <label className="text-xs font-bold text-gray-500 uppercase">Label</label>
        <input 
          type="text" 
          placeholder="e.g. Admit Card" 
          value={date.label} 
          onChange={e => updateImportantDate(idx, 'label', e.target.value)}
          className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
      <div className="flex-1 space-y-1">
        <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
        <input 
          type="date" 
          value={date.date} 
          onChange={e => updateImportantDate(idx, 'date', e.target.value)}
          className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
      <div className="flex-1 space-y-1">
        <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
        <select 
          value={date.status || ''} 
          onChange={e => updateImportantDate(idx, 'status', e.target.value)}
          className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white"
        >
          <option value="">Default</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Expected">Expected</option>
          <option value="Tentative">Tentative</option>
          <option value="Postponed">Postponed</option>
          <option value="Completed">Completed</option>
          <option value="TBA">TBA</option>
        </select>
      </div>
      <div className="flex-1 space-y-1">
        <label className="text-xs font-bold text-gray-500 uppercase">Icon</label>
        <select 
          value={date.icon || 'Clock'} 
          onChange={e => updateImportantDate(idx, 'icon', e.target.value)}
          className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white"
        >
          <option value="Bell">Bell (Notification)</option>
          <option value="Calendar">Calendar (Exam)</option>
          <option value="FileText">File (Admit Card)</option>
          <option value="CheckCircle2">Check (Result)</option>
          <option value="Clock">Clock (General)</option>
        </select>
      </div>
      <button type="button" onClick={() => removeImportantDate(idx)} className="text-red-500 hover:text-red-700 p-2">
        <Trash2 size={18} />
      </button>
    </div>
  );
}

interface SortableTableRowProps {
  row: string[];
  rIndex: number;
  sectionId: string;
  boldRows: boolean[];
  updateTableCell: (sectionId: string, rowIndex: number, colIndex: number, value: string) => void;
  toggleBoldRow: (sectionId: string, rowIndex: number) => void;
  removeRow: (sectionId: string, rowIndex: number) => void;
}

function SortableTableRow({ 
  row, 
  rIndex, 
  sectionId, 
  boldCells, 
  updateTableCell, 
  toggleBoldCell, 
  removeRow 
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `row-${sectionId}-${rIndex}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-gray-100 hover:bg-gray-50 group">
      <td className="p-2 border-r border-gray-200 w-8">
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-blue-600"
        >
          <GripVertical size={16} />
        </div>
      </td>
      {row.map((cell, cIndex) => (
        <td key={cIndex} className="p-2 border-r border-gray-200">
          <div className="flex gap-1">
            <input 
              type="text" 
              value={cell}
              onChange={(e) => updateTableCell(sectionId, rIndex, cIndex, e.target.value)}
              className={`w-full p-1.5 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none ${boldCells?.[rIndex]?.[cIndex] ? 'font-bold' : ''}`}
            />
            <div className="flex flex-col gap-1">
              <button 
                type="button" 
                onClick={() => {
                  const linkText = prompt("Enter link text:", "Click here");
                  const url = prompt("Enter URL:", "https://");
                  if (url && linkText) {
                    const newCell = `${cell} <a href="${url}" target="_blank" class="text-blue-600 underline">${linkText}</a>`;
                    updateTableCell(sectionId, rIndex, cIndex, newCell);
                  }
                }}
                className="text-xs bg-gray-100 p-1 rounded hover:bg-gray-200"
                title="Add Link"
              >
                <LinkIcon size={12} />
              </button>
              <button 
                type="button" 
                onClick={() => toggleBoldCell(sectionId, rIndex, cIndex)}
                className={`p-1 rounded text-xs ${boldCells?.[rIndex]?.[cIndex] ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-blue-600 bg-gray-100'}`}
                title="Toggle Bold"
              >
                <Bold size={12} />
              </button>
            </div>
          </div>
        </td>
      ))}
      <td className="p-2 text-center">
        <button type="button" onClick={() => removeRow(sectionId, rIndex)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
      </td>
    </tr>
  );
}

export default function ManageExams() {
  const [exams, setExams] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentExam, setCurrentExam] = useState<any>({});
  const [sections, setSections] = useState<Section[]>([]);
  const [status, setStatus] = useState('Confirmed');
  const [importantDates, setImportantDates] = useState<{ label: string; date: string; icon?: string; status?: string }[]>([]);
  const [officialLinks, setOfficialLinks] = useState<{ label: string; url: string; color?: string }[]>([]);
  const [notificationLinks, setNotificationLinks] = useState<{ label: string; url: string; color?: string }[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<{ url: string; title: string }[]>([]);
  const [categories, setCategories] = useState<string[]>(['SSC Exams', 'Banking Exams', 'Teaching Exams', 'Civil Services', 'Railway Exams']);
  const [newCategory, setNewCategory] = useState('');

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

  const editor = useRef(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const config = useMemo(() => ({
    readonly: false,
    placeholder: 'Enter content...',
    height: 300,
    buttons: [
      'source', '|', 'bold', 'italic', 'underline', 'strikethrough', '|',
      'brush', 'fill', '|',
      'ul', 'ol', '|',
      'font', 'fontsize', 'paragraph', '|',
      'align', 'indent', 'outdent', '|',
      'table', 'link', 'image', 'video', '|',
      'hr', '|', 'undo', 'redo'
    ],
    uploader: {
      insertImageAsBase64URI: true
    }
  }), []);

  const handleDragEndImportantDates = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id.toString().split('-')[1]);
      const newIndex = parseInt(over.id.toString().split('-')[1]);
      setImportantDates((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  const handleDragEndRows = (sectionId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id.toString().split('-').pop()!);
      const newIndex = parseInt(over.id.toString().split('-').pop()!);
      
      setSections(prevSections => prevSections.map(s => {
        if (s.id === sectionId && s.tableData) {
          const newRows = arrayMove(s.tableData.rows, oldIndex, newIndex);
          const newBoldCells = s.tableData.boldCells ? arrayMove(s.tableData.boldCells, oldIndex, newIndex) : undefined;
          return { ...s, tableData: { ...s.tableData, rows: newRows, boldCells: newBoldCells } };
        }
        return s;
      }));
    }
  };

  const fetchExams = async () => {
    const { data, error } = await supabase.from("exams").select("*");
    if (data) setExams(data);
    if (error) console.error("Error fetching exams:", error);
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Exam",
      message: "Are you sure you want to delete this exam? This action cannot be undone.",
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("exams").delete().eq("id", id);
          if (error) throw error;
          fetchExams();
        } catch (error: any) {
          console.error("Error deleting exam:", error);
          alert(`Failed to delete exam: ${error.message || "Unknown error"}`);
        }
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Serialize sections, status, and important dates to JSON string for description
    const serializedDescription = JSON.stringify({
      sections,
      status,
      important_dates: importantDates,
      official_links: officialLinks,
      notification_links: notificationLinks,
      youtube_videos: youtubeVideos
    });
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
    
    // Try to parse existing description as JSON
    try {
      if (exam.description && (exam.description.startsWith('[') || exam.description.startsWith('{'))) {
        const parsed = JSON.parse(exam.description);
        if (Array.isArray(parsed)) {
          setSections(parsed);
          setStatus('Confirmed');
          setImportantDates([]);
        } else {
          setSections(parsed.sections || []);
          setStatus(parsed.status || 'Confirmed');
          setImportantDates(parsed.important_dates || []);
          
          // Handle migration for official links
          if (parsed.official_links) {
            setOfficialLinks(parsed.official_links.map((l: any) => ({ ...l, color: l.color || 'blue' })));
          } else if (parsed.official_website) {
            setOfficialLinks([{ label: 'Official Website', url: parsed.official_website, color: 'blue' }]);
          } else {
            setOfficialLinks([]);
          }

          // Handle migration for notification links
          if (parsed.notification_links) {
            setNotificationLinks(parsed.notification_links.map((l: any) => ({ ...l, color: l.color || 'red' })));
          } else if (parsed.notification_pdf) {
            setNotificationLinks([{ label: 'Notification PDF', url: parsed.notification_pdf, color: 'red' }]);
          } else {
            setNotificationLinks([]);
          }
          
          // Handle migration from string array to object array
          const rawVideos = parsed.youtube_videos || [];
          const formattedVideos = rawVideos.map((v: any) => {
            if (typeof v === 'string') return { url: v, title: '' };
            return v;
          });
          setYoutubeVideos(formattedVideos);
        }
      } else if (exam.description) {
        // Fallback for legacy HTML descriptions
        setSections([{
          id: Date.now().toString(),
          type: 'text',
          title: 'Legacy Content',
          content: exam.description
        }]);
        setOfficialLinks(exam.link ? [{ label: 'Official Website', url: exam.link, color: 'blue' }] : []);
      } else {
        setSections([]);
        setOfficialLinks([]);
      }
    } catch (e) {
      console.error("Failed to parse description", e);
      setSections([{
        id: Date.now().toString(),
        type: 'text',
        title: 'Legacy Content',
        content: exam.description || ''
      }]);
      setOfficialLinks(exam.link ? [{ label: 'Official Website', url: exam.link, color: 'blue' }] : []);
    }
    
    setIsEditing(true);
  };

  const handleDuplicate = (exam: any) => {
    const { id, ...examToDuplicate } = exam;
    setCurrentExam(examToDuplicate);
    // Parse description to set state
    try {
      if (exam.description && (exam.description.startsWith('[') || exam.description.startsWith('{'))) {
        const parsed = JSON.parse(exam.description);
        if (Array.isArray(parsed)) {
          setSections(parsed);
          setStatus('Confirmed');
          setImportantDates([]);
        } else {
          setSections(parsed.sections || []);
          setStatus(parsed.status || 'Confirmed');
          setImportantDates(parsed.important_dates || []);
          
          // Handle migration for official links
          if (parsed.official_links) {
            setOfficialLinks(parsed.official_links.map((l: any) => ({ ...l, color: l.color || 'blue' })));
          } else if (parsed.official_website) {
            setOfficialLinks([{ label: 'Official Website', url: parsed.official_website, color: 'blue' }]);
          } else {
            setOfficialLinks([]);
          }

          // Handle migration for notification links
          if (parsed.notification_links) {
            setNotificationLinks(parsed.notification_links.map((l: any) => ({ ...l, color: l.color || 'red' })));
          } else if (parsed.notification_pdf) {
            setNotificationLinks([{ label: 'Notification PDF', url: parsed.notification_pdf, color: 'red' }]);
          } else {
            setNotificationLinks([]);
          }
          
          const rawVideos = parsed.youtube_videos || [];
          const formattedVideos = rawVideos.map((v: any) => {
            if (typeof v === 'string') return { url: v, title: '' };
            return v;
          });
          setYoutubeVideos(formattedVideos);
        }
      } else if (exam.description) {
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

  const filteredExams = exams.filter(exam => 
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (exam.category && exam.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddNew = () => {
    setCurrentExam({});
    setSections([
      { id: Date.now().toString() + '1', type: 'text', title: 'Overview', content: '' },
      { id: Date.now().toString() + '2', type: 'text', title: 'Important Dates', content: '' },
      { id: Date.now().toString() + '3', type: 'table', title: 'Exam Pattern', content: '', tableData: { headers: ['Subject', 'Questions', 'Marks', 'Duration'], rows: [['', '', '', '']] } }
    ]);
    setStatus('Confirmed');
    setImportantDates([
      { label: 'Notification Released', date: new Date().toISOString().split('T')[0], icon: 'Bell' },
      { label: 'Exam Date', date: '', icon: 'Calendar' }
    ]);
    setOfficialLinks([{ label: 'Official Website', url: '', color: 'blue' }]);
    setNotificationLinks([{ label: 'Notification PDF', url: '', color: 'red' }]);
    setYoutubeVideos([]);
    setIsEditing(true);
  };

  const addImportantDate = () => {
    setImportantDates([...importantDates, { label: '', date: '', icon: 'Clock', status: '' }]);
  };

  const moveImportantDate = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === importantDates.length - 1)) return;
    const newDates = [...importantDates];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newDates[index], newDates[targetIndex]] = [newDates[targetIndex], newDates[index]];
    setImportantDates(newDates);
  };

  const removeImportantDate = (index: number) => {
    setImportantDates(importantDates.filter((_, i) => i !== index));
  };

  const updateImportantDate = (index: number, field: 'label' | 'date' | 'icon' | 'status', value: string) => {
    const newDates = [...importantDates];
    (newDates[index] as any)[field] = value;
    setImportantDates(newDates);
  };

  const addYoutubeVideo = () => {
    setYoutubeVideos([...youtubeVideos, { url: '', title: '' }]);
  };

  const updateYoutubeVideo = (index: number, field: 'url' | 'title', value: string) => {
    const newVideos = [...youtubeVideos];
    newVideos[index][field] = value;
    setYoutubeVideos(newVideos);
  };

  const removeYoutubeVideo = (index: number) => {
    setYoutubeVideos(youtubeVideos.filter((_, i) => i !== index));
  };

  const addSection = (type: SectionType) => {
    const newSection: Section = {
      id: Date.now().toString(),
      type,
      title: 'New Section',
      content: '',
      ...(type === 'table' || type === 'text_table' ? { tableData: { headers: ['Column 1', 'Column 2'], rows: [['', '']] } } : {})
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
    setSections(prevSections => prevSections.map(s => {
      if (s.id === sectionId && s.tableData) {
        const newRows = s.tableData.rows.map((row, rIdx) => 
          rIdx === rowIndex ? row.map((cell, cIdx) => cIdx === colIndex ? value : cell) : row
        );
        return { ...s, tableData: { ...s.tableData, rows: newRows } };
      }
      return s;
    }));
  };

  const addRow = (sectionId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId && s.tableData) {
        const newRow = new Array(s.tableData.headers.length).fill('');
        const newBoldCellsRow = new Array(s.tableData.headers.length).fill(false);
        const newBoldCells = s.tableData.boldCells ? [...s.tableData.boldCells, newBoldCellsRow] : 
          [...s.tableData.rows.map(() => new Array(s.tableData.headers.length).fill(false)), newBoldCellsRow];
        return { ...s, tableData: { ...s.tableData, rows: [...s.tableData.rows, newRow], boldCells: newBoldCells } };
      }
      return s;
    }));
  };

  const toggleBoldCell = (sectionId: string, rowIndex: number, colIndex: number) => {
    setSections(sections.map(s => {
      if (s.id === sectionId && s.tableData) {
        const newBoldCells = s.tableData.boldCells ? [...s.tableData.boldCells.map(row => [...row])] : 
          s.tableData.rows.map(row => new Array(row.length).fill(false));
        
        if (!newBoldCells[rowIndex]) {
          newBoldCells[rowIndex] = new Array(s.tableData.headers.length).fill(false);
        }
        
        newBoldCells[rowIndex][colIndex] = !newBoldCells[rowIndex][colIndex];
        return { ...s, tableData: { ...s.tableData, boldCells: newBoldCells } };
      }
      return s;
    }));
  };

  const removeRow = (sectionId: string, rowIndex: number) => {
    setSections(sections.map(s => {
      if (s.id === sectionId && s.tableData) {
        const newRows = s.tableData.rows.filter((_, i) => i !== rowIndex);
        const newBoldCells = s.tableData.boldCells?.filter((_, i) => i !== rowIndex);
        return { ...s, tableData: { ...s.tableData, rows: newRows, boldCells: newBoldCells } };
      }
      return s;
    }));
  };

  const addColumn = (sectionId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId && s.tableData) {
        const newHeaders = [...s.tableData.headers, `Column ${s.tableData.headers.length + 1}`];
        const newRows = s.tableData.rows.map(row => [...row, '']);
        const newBoldCells = s.tableData.boldCells?.map(row => [...row, false]);
        return { ...s, tableData: { ...s.tableData, headers: newHeaders, rows: newRows, boldCells: newBoldCells } };
      }
      return s;
    }));
  };

  const removeColumn = (sectionId: string, colIndex: number) => {
    setSections(sections.map(s => {
      if (s.id === sectionId && s.tableData) {
        const newHeaders = s.tableData.headers.filter((_, i) => i !== colIndex);
        const newRows = s.tableData.rows.map(row => row.filter((_, i) => i !== colIndex));
        const newBoldCells = s.tableData.boldCells?.map(row => row.filter((_, i) => i !== colIndex));
        return { ...s, tableData: { ...s.tableData, headers: newHeaders, rows: newRows, boldCells: newBoldCells } };
      }
      return s;
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Exams</h1>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Search exams..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button onClick={handleAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
            <Plus size={20} /> Add New Exam
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">{currentExam.id ? "Edit Exam" : "Add New Exam"}</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Exam Title</label>
              <input placeholder="e.g. ECET 2026" value={currentExam.title || ""} onChange={e => setCurrentExam({...currentExam, title: e.target.value})} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <div className="flex gap-2">
                <select value={currentExam.category || ""} onChange={e => setCurrentExam({...currentExam, category: e.target.value})} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="">Select Category</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <input type="text" placeholder="New Category" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="border p-3 rounded-lg w-32 focus:ring-2 focus:ring-blue-500 outline-none" />
                <button type="button" onClick={() => { if(newCategory && !categories.includes(newCategory)) { setCategories([...categories, newCategory]); setNewCategory(''); } }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+</button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Exam Date</label>
              <input type="date" placeholder="Date" value={currentExam.date ? new Date(currentExam.date).toISOString().split('T')[0] : ""} onChange={e => setCurrentExam({...currentExam, date: e.target.value})} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Exam Status</label>
              <select 
                value={status} 
                onChange={e => setStatus(e.target.value)}
                className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="Confirmed">Confirmed</option>
                <option value="Expected">Expected</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-4 bg-blue-50 p-6 rounded-xl border border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-blue-800">Custom Important Dates</h3>
                <button type="button" onClick={addImportantDate} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1">
                  <Plus size={16}/> Add Date
                </button>
              </div>
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEndImportantDates}
              >
                <SortableContext 
                  items={importantDates.map((_, i) => `date-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {importantDates.map((date, idx) => (
                      <SortableImportantDate 
                        key={`date-${idx}`}
                        date={date}
                        idx={idx}
                        updateImportantDate={updateImportantDate}
                        removeImportantDate={removeImportantDate}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
            
            <div className="md:col-span-2 space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Official Links</h3>
                <button type="button" onClick={() => setOfficialLinks([...officialLinks, { label: '', url: '', color: 'blue' }])} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1">
                  <Plus size={16}/> Add Link
                </button>
              </div>
              <div className="space-y-3">
                {officialLinks.map((link, idx) => (
                  <div key={idx} className="flex gap-3 items-end bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Label</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Official Website" 
                        value={link.label} 
                        onChange={e => {
                          const newLinks = [...officialLinks];
                          newLinks[idx].label = e.target.value;
                          setOfficialLinks(newLinks);
                        }}
                        className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="flex-[2] space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">URL</label>
                      <input 
                        type="text" 
                        placeholder="https://..." 
                        value={link.url} 
                        onChange={e => {
                          const newLinks = [...officialLinks];
                          newLinks[idx].url = e.target.value;
                          setOfficialLinks(newLinks);
                        }}
                        className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Color</label>
                      <select 
                        value={link.color || 'blue'} 
                        onChange={e => {
                          const newLinks = [...officialLinks];
                          newLinks[idx].color = e.target.value;
                          setOfficialLinks(newLinks);
                        }}
                        className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="blue">Blue</option>
                        <option value="red">Red</option>
                        <option value="green">Green</option>
                        <option value="orange">Orange</option>
                        <option value="purple">Purple</option>
                        <option value="gray">Gray</option>
                      </select>
                    </div>
                    <button type="button" onClick={() => setOfficialLinks(officialLinks.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 p-2">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Notification PDF Links</h3>
                <button type="button" onClick={() => setNotificationLinks([...notificationLinks, { label: '', url: '', color: 'red' }])} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1">
                  <Plus size={16}/> Add Link
                </button>
              </div>
              <div className="space-y-3">
                {notificationLinks.map((link, idx) => (
                  <div key={idx} className="flex gap-3 items-end bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Label</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Notification PDF" 
                        value={link.label} 
                        onChange={e => {
                          const newLinks = [...notificationLinks];
                          newLinks[idx].label = e.target.value;
                          setNotificationLinks(newLinks);
                        }}
                        className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="flex-[2] space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">URL</label>
                      <input 
                        type="text" 
                        placeholder="https://..." 
                        value={link.url} 
                        onChange={e => {
                          const newLinks = [...notificationLinks];
                          newLinks[idx].url = e.target.value;
                          setNotificationLinks(newLinks);
                        }}
                        className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Color</label>
                      <select 
                        value={link.color || 'red'} 
                        onChange={e => {
                          const newLinks = [...notificationLinks];
                          newLinks[idx].color = e.target.value;
                          setNotificationLinks(newLinks);
                        }}
                        className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="blue">Blue</option>
                        <option value="red">Red</option>
                        <option value="green">Green</option>
                        <option value="orange">Orange</option>
                        <option value="purple">Purple</option>
                        <option value="gray">Gray</option>
                      </select>
                    </div>
                    <button type="button" onClick={() => setNotificationLinks(notificationLinks.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 p-2">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-4 bg-red-50 p-6 rounded-xl border border-red-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                  <PlayCircle size={20} /> YouTube Videos
                </h3>
                <button type="button" onClick={addYoutubeVideo} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 transition flex items-center gap-1">
                  <Plus size={16}/> Add Video
                </button>
              </div>
              <div className="space-y-4">
                {youtubeVideos.map((video, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-lg border border-red-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-red-600 uppercase">Video #{idx + 1}</span>
                      <button type="button" onClick={() => removeYoutubeVideo(idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Video Title</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Best Preparation Strategy" 
                          value={video.title} 
                          onChange={e => updateYoutubeVideo(idx, 'title', e.target.value)}
                          className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-red-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">YouTube URL</label>
                        <input 
                          type="text" 
                          placeholder="https://www.youtube.com/watch?v=..." 
                          value={video.url} 
                          onChange={e => updateYoutubeVideo(idx, 'url', e.target.value)}
                          className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-red-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {youtubeVideos.length === 0 && (
                  <p className="text-sm text-red-400 italic">No videos added yet.</p>
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-6 mt-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-lg font-bold text-gray-800">Content Sections</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => addSection('text')} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition flex items-center gap-1"><Plus size={16}/> Text Section</button>
                  <button type="button" onClick={() => addSection('table')} className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-100 transition flex items-center gap-1"><Plus size={16}/> Table Section</button>
                  <button type="button" onClick={() => addSection('text_table')} className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-100 transition flex items-center gap-1"><Plus size={16}/> Text+Table Section</button>
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

                  {section.type === 'text' || section.type === 'text_table' ? (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                      <JoditEditor
                        value={section.content}
                        config={config}
                        onBlur={newContent => updateSection(section.id, { content: newContent })}
                      />
                    </div>
                  ) : null}
                  
                  {section.type === 'table' || section.type === 'text_table' ? (
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={section.description || ''}
                          onChange={(e) => updateSection(section.id, { description: e.target.value })}
                          className="border p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Table Data</label>
                      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                        <DndContext 
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => handleDragEndRows(section.id, event)}
                        >
                          <table className="w-full text-left bg-white">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="p-2 border-b border-r border-gray-200 w-8"></th>
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
                            <SortableContext 
                              items={section.tableData?.rows.map((_, i) => `row-${section.id}-${i}`) || []}
                              strategy={verticalListSortingStrategy}
                            >
                              <tbody>
                                {section.tableData?.rows.map((row, rIndex) => (
                                  <SortableTableRow 
                                    key={`row-${section.id}-${rIndex}`}
                                    row={row}
                                    rIndex={rIndex}
                                    sectionId={section.id}
                                    boldCells={section.tableData?.boldCells || []}
                                    updateTableCell={updateTableCell}
                                    toggleBoldCell={toggleBoldCell}
                                    removeRow={removeRow}
                                  />
                                ))}
                              </tbody>
                            </SortableContext>
                          </table>
                        </DndContext>
                      </div>
                      <button type="button" onClick={() => addRow(section.id)} className="mt-3 text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
                        <Plus size={16} /> Add Row
                      </button>
                    </div>
                  ) : null}
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
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExams.map(exam => (
              <tr key={exam.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="p-4 font-medium text-gray-800">{exam.title}</td>
                <td className="p-4 text-gray-600">{exam.category || 'N/A'}</td>
                <td className="p-4 text-gray-600">{new Date(exam.date).toLocaleDateString()}</td>
                <td className="p-4 flex justify-end gap-3">
                  <button onClick={() => handleEdit(exam)} className="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded-lg transition"><Edit size={18} /></button>
                  <button onClick={() => handleDuplicate(exam)} className="text-green-600 hover:text-green-800 p-2 bg-green-50 rounded-lg transition"><Copy size={18} /></button>
                  <button onClick={() => handleDelete(exam.id)} className="text-red-600 hover:text-red-800 p-2 bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {filteredExams.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">No exams found.</td></tr>
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
