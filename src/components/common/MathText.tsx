import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathTextProps {
  text: string;
  className?: string;
}

const MathText: React.FC<MathTextProps> = ({ text, className = "" }) => {
  if (!text) return null;

  // Split text by LaTeX delimiters: 
  // $$...$$ or \[...\] for block math
  // $...$ or \(...\) for inline math
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[\s\S]+?\$|\\\([\s\S]+?\\\))/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Block Math
        if ((part.startsWith('$$') && part.endsWith('$$')) || 
            (part.startsWith('\\[') && part.endsWith('\\]'))) {
          const rawMath = part.startsWith('$$') ? part.slice(2, -2) : part.slice(2, -2);
          // Strip any HTML tags that might have leaked into the math part
          const math = rawMath.replace(/<[^>]*>/g, '');
          return <BlockMath key={index} math={math} />;
        }
        // Inline Math
        if ((part.startsWith('$') && part.endsWith('$')) || 
            (part.startsWith('\\(') && part.endsWith('\\)'))) {
          const rawMath = part.startsWith('$') ? part.slice(1, -1) : part.slice(2, -2);
          // Strip any HTML tags that might have leaked into the math part
          const math = rawMath.replace(/<[^>]*>/g, '');
          return <InlineMath key={index} math={math} />;
        }
        return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
      })}
    </span>
  );
};

export default MathText;
