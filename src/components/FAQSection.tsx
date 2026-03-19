import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqData: {
    items: FAQItem[];
  };
}

export default function FAQSection({ faqData }: FAQSectionProps) {
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setExpandedItems(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="space-y-4">
      {faqData?.items.map((item, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <button
            onClick={() => toggleItem(index)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <h4 className="font-bold text-gray-900">{item.question}</h4>
            <motion.div
              animate={{ rotate: expandedItems.includes(index) ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="text-gray-500" size={20} />
            </motion.div>
          </button>
          <AnimatePresence>
            {expandedItems.includes(index) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-4 pt-0 text-gray-700 border-t border-gray-100">
                  {item.answer}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
