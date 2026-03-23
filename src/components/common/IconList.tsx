import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconListItem {
  text: string;
  iconName?: string;
  iconColor?: string;
}

interface IconListProps {
  items: IconListItem[];
  defaultIconName?: string;
  defaultIconColor?: string;
  iconName?: string;
  iconColor?: string;
}

export default function IconList({ 
  items, 
  defaultIconName = 'CheckCircle2', 
  defaultIconColor = 'text-[#15b86c]',
  iconName,
  iconColor
}: IconListProps) {
  const finalDefaultIconName = iconName || defaultIconName;
  const finalDefaultIconColor = iconColor || defaultIconColor;
  
  return (
    <ul className="space-y-2 mt-2">
      {items.map((item, index) => {
        const IconName = item.iconName || finalDefaultIconName;
        const Icon = (LucideIcons as any)[IconName] || LucideIcons.CheckCircle2;
        const currentIconColor = item.iconColor || finalDefaultIconColor;
        
        // Extract color name for background (e.g., text-blue-500 -> bg-blue-500)
        const bgColorClass = currentIconColor.replace('text-', 'bg-');
        
        return (
          <li key={index} className="flex items-start gap-2 group">
            <div className={`flex-shrink-0 w-7 h-7 rounded-full ${bgColorClass} flex items-center justify-center shadow-md mt-0.5 transition-transform group-hover:scale-110`}>
              <Icon size={14} strokeWidth={3} className="text-white" />
            </div>
            <div 
              className="text-gray-700 leading-relaxed pt-0.5 flex-1
                         [&_a]:text-blue-600 [&_a]:font-bold hover:[&_a]:text-blue-700 [&_a]:transition-colors"
              dangerouslySetInnerHTML={{ __html: item.text }}
            />
          </li>
        );
      })}
    </ul>
  );
}
