import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../../services/supabaseClient";
import { Edit, Trash2, Plus, X, Link as LinkIcon, ArrowUp, ArrowDown, Bold, GripVertical, Search, Copy, ArrowLeft, BookOpen, Calendar, Users } from "lucide-react";
import JoditEditor from "jodit-react";
import ConfirmationModal from "../../components/ConfirmationModal";
import ImageUpload from "../../components/common/ImageUpload";
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

type SectionType = 'text' | 'table' | 'text_table' | 'faq' | 'icon_list';

interface TableData {
  headers: string[];
  rows: string[][];
  boldCells?: boolean[][];
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQData {
  items: FAQItem[];
}

interface IconListItem {
  text: string;
  iconName?: string;
  iconColor?: string;
}

interface Section {
  id: string;
  title: string;
  type: SectionType;
  content: string;
  description?: string;
  tableData?: TableData;
  faqData?: FAQData;
  items?: IconListItem[];
  iconName?: string;
  iconColor?: string;
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
          <option value="Download">Download</option>
          <option value="Link">Link</option>
          <option value="AlertCircle">Alert</option>
          <option value="Info">Info</option>
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

export default function ManageJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentJob, setCurrentJob] = useState<any>({});
  const [sections, setSections] = useState<Section[]>([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDescription, setPromoDescription] = useState('');
  const [promoButtonText, setPromoButtonText] = useState('');
  const [promoLink, setPromoLink] = useState('');
  const [promoBgColor, setPromoBgColor] = useState('from-red-900 to-black');
  const [importantDates, setImportantDates] = useState<{ label: string; date: string; icon?: string; status?: string }[]>([]);
  const [officialLinks, setOfficialLinks] = useState<{ label: string; url: string; color?: string }[]>([]);
  const [notificationLinks, setNotificationLinks] = useState<{ label: string; url: string; color?: string }[]>([]);
  const [categories, setCategories] = useState<string[]>(['Railway', 'Bank', 'Defence', 'State', 'Central Govt', 'SSC', 'UPSC']);
  const [newCategory, setNewCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSubpage, setIsSubpage] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  const [badges, setBadges] = useState<{text: string, color: string}[]>([]);
  const [newBadge, setNewBadge] = useState('');
  const [selectedBadgeColor, setSelectedBadgeColor] = useState('emerald');

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
      {
        name: 'premiumCheck',
        iconURL: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
        tooltip: 'Insert Bold Checklist',
        exec: (editor: any) => {
          editor.s.insertHTML('<ul class="premium-list"><li>New Item</li></ul>');
        }
      },
      {
        name: 'premiumStar',
        iconURL: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png',
        tooltip: 'Insert Star List',
        exec: (editor: any) => {
          editor.s.insertHTML('<ul class="premium-list premium-list-star"><li>New Item</li></ul>');
        }
      },
      '|',
      'font', 'fontsize', 'paragraph', '|',
      'align', 'indent', 'outdent', '|',
      'table', 'link', 'image', 'video', '|',
      'hr', '|', 'undo', 'redo'
    ],
    uploader: {
      insertImageAsBase64URI: true
    },
    style: {
      color: '#374151',
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px'
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

  const fetchJobs = async () => {
    const { data, error } = await supabase.from("jobs").select("*");
    if (data) {
      setJobs(data);
      // Extract unique departments/categories from existing jobs
      const dbCategories = data
        .map(job => job.department)
        .filter((cat): cat is string => !!cat);
      
      setCategories(prev => {
        const combined = Array.from(new Set([...prev, ...dbCategories]));
        return combined.sort();
      });
    }
    if (error) console.error("Error fetching jobs:", error);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Job",
      message: "Are you sure you want to delete this job? This action cannot be undone.",
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("jobs").delete().eq("id", id);
          if (error) throw error;
          fetchJobs();
        } catch (error: any) {
          console.error("Error deleting job:", error);
          alert(`Failed to delete job: ${error.message || "Unknown error"}`);
        }
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Serialize sections, important dates to JSON string for description
    const serializedDescription = JSON.stringify({
      sections,
      important_dates: importantDates,
      official_links: officialLinks,
      notification_links: notificationLinks,
      logo_url: logoUrl,
      promo_title: promoTitle,
      promo_description: promoDescription,
      promo_button_text: promoButtonText,
      promo_link: promoLink,
      promo_bg_color: promoBgColor,
      banner_image: bannerImage,
      badges: badges
    });
    const jobToSave = { 
      ...currentJob, 
      description: serializedDescription,
      is_subpage: isSubpage,
      parent_id: isSubpage ? parentId : null
    };

    let error;
    if (jobToSave.id) {
      const res = await supabase.from("jobs").update(jobToSave).eq("id", jobToSave.id);
      error = res.error;
    } else {
      const res = await supabase.from("jobs").insert(jobToSave);
      error = res.error;
    }
    
    if (error) {
      console.error("Error saving job:", error);
      alert("Failed to save job: " + error.message);
      return;
    }
    
    setIsEditing(false);
    setCurrentJob({});
    setSections([]);
    setLogoUrl('');
    setPromoTitle('');
    setPromoDescription('');
    setPromoButtonText('');
    setPromoLink('');
    setPromoBgColor('from-red-900 to-black');
    setBannerImage('');
    setImportantDates([]);
    setOfficialLinks([]);
    setNotificationLinks([]);
    setIsSubpage(false);
    setParentId(null);
    setBadges([]);
    setNewBadge('');
    fetchJobs();
  };

  const handleEdit = (job: any) => {
    setCurrentJob(job);
    
    // Parse description into sections
    try {
      if (job.description && (job.description.startsWith('[') || job.description.startsWith('{'))) {
        const parsed = JSON.parse(job.description);
        if (Array.isArray(parsed)) {
          setSections(parsed);
          setImportantDates([]);
        } else {
          setSections(parsed.sections || []);
          setImportantDates(parsed.important_dates || []);
          setLogoUrl(parsed.logo_url || '');
          setPromoTitle(parsed.promo_title || parsed.banner_text || '');
          setPromoDescription(parsed.promo_description || '');
          setPromoButtonText(parsed.promo_button_text || '');
          setPromoLink(parsed.promo_link || '');
          setPromoBgColor(parsed.promo_bg_color || 'from-red-900 to-black');
          setBannerImage(parsed.banner_image || '');
          setBadges(parsed.badges || []);

          // Handle migration for official links
          if (parsed.official_links) {
            setOfficialLinks(parsed.official_links.map((l: any) => ({ ...l, color: l.color || 'blue' })));
          } else if (job.applyLink) {
            setOfficialLinks([{ label: 'Apply Online', url: job.applyLink, color: 'blue' }]);
          } else {
            setOfficialLinks([]);
          }

          // Handle migration for notification links
          if (parsed.notification_links) {
            setNotificationLinks(parsed.notification_links.map((l: any) => ({ ...l, color: l.color || 'red' })));
          } else if (job.pdfLink) {
            setNotificationLinks([{ label: 'Notification PDF', url: job.pdfLink, color: 'red' }]);
          } else {
            setNotificationLinks([]);
          }
        }
      } else if (job.description) {
        setSections([{ id: Date.now().toString(), title: 'Details', type: 'text', content: job.description }]);
        setImportantDates([]);
        setOfficialLinks(job.applyLink ? [{ label: 'Apply Online', url: job.applyLink, color: 'blue' }] : []);
        setNotificationLinks(job.pdfLink ? [{ label: 'Notification PDF', url: job.pdfLink, color: 'red' }] : []);
      } else {
        setSections([]);
        setImportantDates([]);
        setOfficialLinks([]);
        setNotificationLinks([]);
      }
    } catch (e) {
      setSections([{ id: Date.now().toString(), title: 'Details', type: 'text', content: job.description || '' }]);
      setImportantDates([]);
      setOfficialLinks(job.applyLink ? [{ label: 'Apply Online', url: job.applyLink, color: 'blue' }] : []);
      setNotificationLinks(job.pdfLink ? [{ label: 'Notification PDF', url: job.pdfLink, color: 'red' }] : []);
    }
    
    setIsSubpage(job.is_subpage || false);
    setParentId(job.parent_id || null);
    setIsEditing(true);
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (job.department && job.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupedJobs = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    filteredJobs.forEach(job => {
      const cat = job.department || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(job);
    });
    return groups;
  }, [filteredJobs]);

  const handleAddNew = () => {
    setCurrentJob({});
    setSections([
      { id: Date.now().toString() + '1', title: 'Overview', type: 'text', content: '' },
      { id: Date.now().toString() + '2', title: 'Vacancy Details', type: 'table', content: '', tableData: { headers: ['Category', 'Vacancies'], rows: [['General (UR)', '0'], ['OBC', '0'], ['SC', '0'], ['ST', '0']] } },
      { id: Date.now().toString() + '3', title: 'Eligibility Criteria', type: 'text', content: '<p><strong>Educational Qualification:</strong> ...</p><p><strong>Age Limit:</strong> ...</p>' }
    ]);
    setImportantDates([
      { label: 'Notification Released', date: new Date().toISOString().split('T')[0], icon: 'Bell' },
      { label: 'Application Start', date: '', icon: 'Calendar' }
    ]);
    setOfficialLinks([{ label: 'Apply Online', url: '', color: 'blue' }]);
    setNotificationLinks([{ label: 'Notification PDF', url: '', color: 'red' }]);
    setIsSubpage(false);
    setParentId(null);
    setBadges([]);
    setNewBadge('');
    setIsEditing(true);
  };

  // Important Dates Helpers
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

  // Section Builder Helpers
  const addSection = (type: SectionType) => {
    const newSection: Section = {
      id: Date.now().toString(),
      title: type === 'faq' ? 'Frequently Asked Questions' : (type === 'icon_list' ? 'Icon List' : 'New Section'),
      type,
      content: '',
      ...(type === 'table' || type === 'text_table' ? { tableData: { headers: ['Column 1', 'Column 2'], rows: [['', '']] } } : {}),
      ...(type === 'faq' ? { faqData: { items: [{ question: '', answer: '' }] } } : {}),
      ...(type === 'icon_list' ? { items: [{ text: '' }], iconName: 'Check', iconColor: 'text-blue-500', content: '' } : {})
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {selectedCategory && !isEditing && (
            <button 
              onClick={() => setSelectedCategory(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Back to Categories"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isEditing ? (currentJob.id ? 'Edit Job' : 'Add New Job') : (selectedCategory ? selectedCategory : 'Manage Jobs')}
            </h1>
            <p className="text-gray-500">
              {isEditing ? 'Fill in the details below' : (selectedCategory ? `Manage jobs in ${selectedCategory}` : 'Organize and manage your job notifications')}
            </p>
          </div>
        </div>
        {!isEditing && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) setSelectedCategory(null);
                }}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl w-64 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <button onClick={handleAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-sm">
              <Plus size={20} />
              Add New Job
            </button>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">{currentJob.id ? "Edit Job" : "Add New Job"}</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Job Title</label>
              <input type="text" placeholder="e.g. SSC CGL 2024" value={currentJob.title || ""} onChange={e => setCurrentJob({...currentJob, title: e.target.value})} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <div className="space-y-2">
              <ImageUpload 
                label="Job Logo" 
                currentImage={logoUrl} 
                onUploadSuccess={(url) => setLogoUrl(url)} 
              />
            </div>
            <div className="md:col-span-2 space-y-4 bg-yellow-50 p-6 rounded-xl border border-yellow-200">
              <h3 className="text-lg font-bold text-yellow-800">Promo Banner / Ad Config</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Promo Title</label>
                  <input type="text" placeholder="e.g. Crack RRB ALP" value={promoTitle} onChange={e => setPromoTitle(e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-yellow-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Promo Description</label>
                  <input type="text" placeholder="e.g. With India's Super Teachers" value={promoDescription} onChange={e => setPromoDescription(e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-yellow-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Button Text</label>
                  <input type="text" placeholder="e.g. Join SuperCoaching" value={promoButtonText} onChange={e => setPromoButtonText(e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-yellow-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Button Link</label>
                  <input type="text" placeholder="e.g. /tests" value={promoLink} onChange={e => setPromoLink(e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-yellow-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Background Color</label>
                  <select value={promoBgColor} onChange={e => setPromoBgColor(e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-yellow-500 outline-none bg-white">
                    <option value="from-red-900 to-black">Dark Red (Default)</option>
                    <option value="from-blue-900 to-blue-700">Deep Blue</option>
                    <option value="from-green-900 to-green-700">Forest Green</option>
                    <option value="from-purple-900 to-purple-700">Royal Purple</option>
                    <option value="from-orange-600 to-orange-400">Vibrant Orange</option>
                    <option value="from-gray-900 to-gray-800">Slate Black</option>
                  </select>
                </div>
                <div className="md:col-span-2 mt-2">
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">OR Upload Custom Image (Overrides all text configs above)</label>
                  <ImageUpload 
                    label="Upload Banner Thumbnail" 
                    currentImage={bannerImage} 
                    onUploadSuccess={(url) => setBannerImage(url)} 
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Department / Category</label>
              <div className="flex gap-2">
                <select value={currentJob.department || ""} onChange={e => setCurrentJob({...currentJob, department: e.target.value})} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="">Select Category</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <input type="text" placeholder="New Category" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="border p-3 rounded-lg w-32 focus:ring-2 focus:ring-blue-500 outline-none" />
                <button 
                  type="button" 
                  onClick={() => { 
                    if(newCategory) {
                      if(!categories.includes(newCategory)) {
                        setCategories(prev => [...prev, newCategory].sort());
                      }
                      setCurrentJob({...currentJob, department: newCategory});
                      setNewCategory('');
                    }
                  }} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* NEW: Subpage Configuration */}
            <div className="md:col-span-2 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="isSubpage"
                  checked={isSubpage}
                  onChange={(e) => setIsSubpage(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isSubpage" className="text-sm font-bold text-gray-800 cursor-pointer">
                  This is a Subpage (e.g. Job Syllabus, Answer Key, Admit Card)
                </label>
              </div>
              
              {isSubpage && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-xs font-black uppercase text-gray-400 tracking-widest">Select Parent Job Notification</label>
                  <select 
                    value={parentId || ""} 
                    onChange={(e) => setParentId(e.target.value || null)}
                    className="w-full p-3 border-2 border-white bg-white rounded-xl text-sm font-bold focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm"
                    required={isSubpage}
                  >
                    <option value="">Select Main Job...</option>
                    {jobs.filter(j => !j.is_subpage && j.id !== currentJob.id).map(job => (
                      <option key={job.id} value={job.id}>{job.title}</option>
                    ))}
                  </select>
                  <p className="text-[10px] font-medium text-blue-600/70 italic">
                    * Subpages will be hidden from the main list and can be used as "Important Links" on the parent page.
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Total Posts / Vacancies</label>
              <input type="number" placeholder="e.g. 1500" value={currentJob.posts || ""} onChange={e => setCurrentJob({...currentJob, posts: e.target.value})} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Educational Qualification</label>
              <input type="text" placeholder="e.g. Any Degree / B.Tech" value={currentJob.qualification || ""} onChange={e => setCurrentJob({...currentJob, qualification: e.target.value})} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Age Limit</label>
              <input type="text" placeholder="e.g. 18-30 Years" value={currentJob.ageLimit || ""} onChange={e => setCurrentJob({...currentJob, ageLimit: e.target.value})} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">Notification Badges</label>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                {/* Active Badges */}
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge, index) => (
                    <span 
                      key={index} 
                      className={`${
                        badge.color === 'emerald' ? 'bg-[#15b86c]' :
                        badge.color === 'ruby' ? 'bg-[#d00000]' :
                        badge.color === 'sky' ? 'bg-[#0ea5e9]' :
                        badge.color === 'amber' ? 'bg-[#f59e0b]' :
                        badge.color === 'violet' ? 'bg-[#8b5cf6]' : 'bg-gray-600'
                      } text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 animate-in zoom-in-50 shadow-sm`}
                    >
                      {badge.text}
                      <button type="button" onClick={() => setBadges(badges.filter((_, i) => i !== index))} className="hover:text-white/70 transition-colors">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {badges.length === 0 && <p className="text-xs text-gray-400 italic">No badges added. They will appear on the card.</p>}
                </div>

                {/* Color Selection & Input Area */}
                <div className="space-y-3 pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Select Color:</span>
                    <div className="flex gap-2">
                      {[
                        { id: 'emerald', bg: 'bg-[#15b86c]' },
                        { id: 'ruby', bg: 'bg-[#d00000]' },
                        { id: 'sky', bg: 'bg-[#0ea5e9]' },
                        { id: 'amber', bg: 'bg-[#f59e0b]' },
                        { id: 'violet', bg: 'bg-[#8b5cf6]' }
                      ].map(color => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setSelectedBadgeColor(color.id)}
                          className={`w-6 h-6 rounded-full ${color.bg} transition-all ${selectedBadgeColor === color.id ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-60 hover:opacity-100'}`}
                          title={`Select ${color.id} color`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Custom badge label..." 
                      value={newBadge}
                      onChange={e => setNewBadge(e.target.value)}
                      className="flex-grow p-3 border-2 border-white bg-white rounded-xl text-sm font-bold shadow-sm outline-none focus:border-blue-400 transition-all"
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        if (newBadge.trim() && !badges.some(b => b.text === newBadge.trim())) {
                          setBadges([...badges, { text: newBadge.trim(), color: selectedBadgeColor }]);
                          setNewBadge('');
                        }
                      }}
                      className="bg-gray-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition active:scale-95"
                    >
                      Add Badge
                    </button>
                  </div>
                </div>

                {/* Quick Add Badges */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                  <span className="text-[10px] font-black uppercase text-gray-400 w-full mb-1 tracking-widest">Quick Add Presets:</span>
                  {[
                    { text: 'New', color: 'emerald' },
                    { text: 'Update', color: 'amber' },
                    { text: 'Admit Card', color: 'sky' },
                    { text: 'Result', color: 'emerald' },
                    { text: 'Important', color: 'ruby' },
                    { text: 'Apply Now', color: 'emerald' }
                  ].map(b => (
                    <button
                      key={b.text}
                      type="button"
                      onClick={() => {
                        if (!badges.some(badge => badge.text === b.text)) {
                          setBadges([...badges, b]);
                        }
                      }}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-black text-gray-500 hover:border-blue-400 hover:text-blue-600 transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus size={10} /> {b.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Application Fee</label>
              <input type="text" placeholder="e.g. Gen/OBC: ₹100, SC/ST: Nil" value={currentJob.fee || ""} onChange={e => setCurrentJob({...currentJob, fee: e.target.value})} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" required />
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

            <div className="md:col-span-2 space-y-6 mt-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-lg font-bold text-gray-800">Content Sections</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => addSection('text')} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition flex items-center gap-1"><Plus size={16}/> Text Section</button>
                  <button type="button" onClick={() => addSection('table')} className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-100 transition flex items-center gap-1"><Plus size={16}/> Table Section</button>
                  <button type="button" onClick={() => addSection('text_table')} className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-100 transition flex items-center gap-1"><Plus size={16}/> Text+Table Section</button>
                  <button type="button" onClick={() => addSection('faq')} className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-100 transition flex items-center gap-1"><Plus size={16}/> FAQ Section</button>
                  <button type="button" onClick={() => addSection('icon_list')} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-100 transition flex items-center gap-1"><Plus size={16}/> Icon List Section</button>
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
                  
                  {section.type === 'faq' && (
                    <div className="mb-4 space-y-3">
                      <label className="block text-sm font-medium text-gray-700">FAQs</label>
                      {section.faqData?.items.map((item, fIndex) => (
                        <div key={fIndex} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-2">
                          <input
                            type="text"
                            placeholder="Question"
                            value={item.question}
                            onChange={(e) => {
                              const newItems = [...(section.faqData?.items || [])];
                              newItems[fIndex].question = e.target.value;
                              updateSection(section.id, { faqData: { items: newItems } });
                            }}
                            className="border p-2 rounded-lg w-full"
                          />
                          <textarea
                            placeholder="Answer"
                            value={item.answer}
                            onChange={(e) => {
                              const newItems = [...(section.faqData?.items || [])];
                              newItems[fIndex].answer = e.target.value;
                              updateSection(section.id, { faqData: { items: newItems } });
                            }}
                            className="border p-2 rounded-lg w-full"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = (section.faqData?.items || []).filter((_, i) => i !== fIndex);
                              updateSection(section.id, { faqData: { items: newItems } });
                            }}
                            className="text-red-500 text-sm"
                          >
                            Remove FAQ
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = [...(section.faqData?.items || []), { question: '', answer: '' }];
                          updateSection(section.id, { faqData: { items: newItems } });
                        }}
                        className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
                      >
                        Add FAQ Item
                      </button>
                    </div>
                  )}
                  
                  {section.type === 'icon_list' && (
                    <div className="mb-4 space-y-4">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Intro Text (Optional)</label>
                        <JoditEditor
                          value={section.content || ''}
                          onBlur={(newContent) => updateSection(section.id, { content: newContent })}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-lg border border-gray-200">
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-gray-500 uppercase">Default Icon Settings</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Icon Name"
                              value={section.iconName || 'Check'}
                              onChange={(e) => updateSection(section.id, { iconName: e.target.value })}
                              className="p-2 border rounded text-sm outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              placeholder="Color Class"
                              value={section.iconColor || 'text-blue-500'}
                              onChange={(e) => updateSection(section.id, { iconColor: e.target.value })}
                              className="p-2 border rounded text-sm outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2">
                            {['Check', 'Star', 'Info', 'Bell', 'Calendar', 'FileText', 'User', 'Award', 'Target', 'Zap'].map(icon => (
                              <button
                                key={icon}
                                type="button"
                                onClick={() => updateSection(section.id, { iconName: icon })}
                                className={`px-2 py-1 text-xs rounded border transition ${section.iconName === icon ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-bold text-gray-500 uppercase">Common Colors</label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: 'Blue', class: 'text-blue-500' },
                              { label: 'Green', class: 'text-green-500' },
                              { label: 'Red', class: 'text-red-500' },
                              { label: 'Orange', class: 'text-orange-500' },
                              { label: 'Purple', class: 'text-purple-500' },
                              { label: 'Indigo', class: 'text-indigo-500' }
                            ].map(color => (
                              <button
                                key={color.class}
                                type="button"
                                onClick={() => updateSection(section.id, { iconColor: color.class })}
                                className={`px-2 py-1 text-xs rounded border transition ${section.iconColor === color.class ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                              >
                                {color.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <label className="block text-sm font-medium text-gray-700">List Items</label>
                      <div className="space-y-2">
                        {section.items?.map((item, iIndex) => (
                          <div key={iIndex} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex-1">
                              <input
                                type="text"
                                placeholder="Item text"
                                value={typeof item === 'string' ? item : item.text}
                                onChange={(e) => {
                                  const newItems = [...(section.items || [])];
                                  if (typeof newItems[iIndex] === 'string') {
                                    newItems[iIndex] = { text: e.target.value };
                                  } else {
                                    newItems[iIndex] = { ...newItems[iIndex], text: e.target.value };
                                  }
                                  updateSection(section.id, { items: newItems });
                                }}
                                className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="w-32">
                              <input
                                type="text"
                                placeholder="Icon (optional)"
                                value={typeof item === 'string' ? '' : (item.iconName || '')}
                                onChange={(e) => {
                                  const newItems = [...(section.items || [])];
                                  if (typeof newItems[iIndex] === 'string') {
                                    newItems[iIndex] = { text: newItems[iIndex], iconName: e.target.value };
                                  } else {
                                    newItems[iIndex] = { ...newItems[iIndex], iconName: e.target.value };
                                  }
                                  updateSection(section.id, { items: newItems });
                                }}
                                className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = (section.items || []).filter((_, i) => i !== iIndex);
                                updateSection(section.id, { items: newItems });
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = [...(section.items || []), { text: '' }];
                          updateSection(section.id, { items: newItems });
                        }}
                        className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Item
                      </button>
                    </div>
                  )}

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
                        placeholder="e.g. Apply Online" 
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
            
            <div className="md:col-span-2 flex gap-4 justify-end mt-4">
              <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Save Job</button>
            </div>
          </form>
        </div>
      )}

      {!isEditing && (
        <>
          {/* Category Cards View: Only show if no category is selected and no search is active */}
          {!selectedCategory && !searchQuery ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {(Object.entries(groupedJobs) as [string, any[]][]).map(([category, categoryJobs]) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-center group"
                >
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <BookOpen className="text-blue-600" size={32} />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-1">{category}</h3>
                  <p className="text-sm text-gray-500">{categoryJobs.length}+ Jobs</p>
                </button>
              ))}
              {Object.keys(groupedJobs).length === 0 && (
                <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-500">No jobs found. Add your first job to see categories.</p>
                </div>
              )}
            </div>
          ) : (
            /* Jobs List View: Show when a category is selected or searching */
            <div className="space-y-8">
              {(Object.entries(groupedJobs) as [string, any[]][])
                .filter(([category]) => !selectedCategory || category === selectedCategory)
                .map(([category, categoryJobs]) => (
                  <div key={category} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                        {category}
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{categoryJobs.length}</span>
                      </h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryJobs.map(job => (
                        <div key={job.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center group hover:border-blue-200 transition-all">
                          <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors truncate">{job.title}</h4>
                              {job.is_subpage && (
                                <span className="bg-blue-100 text-blue-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-blue-200">Sub</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Users size={12} /> {job.posts} Posts
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => handleEdit(job)} className="text-blue-600 hover:text-blue-800 p-2 bg-white rounded-lg shadow-sm border border-gray-100 transition" title="Edit"><Edit size={18} /></button>
                            <button onClick={() => handleDelete(job.id)} className="text-red-600 hover:text-red-800 p-2 bg-white rounded-lg shadow-sm border border-gray-100 transition" title="Delete"><Trash2 size={18} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              {filteredJobs.length === 0 && (
                <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center text-gray-500">
                  No jobs found matching your search.
                </div>
              )}
            </div>
          )}
        </>
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
