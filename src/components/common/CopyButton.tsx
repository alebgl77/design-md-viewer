import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { copyToClipboard } from '../../utils/clipboard';

interface CopyButtonProps {
  text: string;
  label?: string;
  showIconOnly?: boolean;
  className?: string;
  title?: string;
  variant?: 'ghost' | 'secondary' | 'subtle' | 'pill';
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label,
  showIconOnly = false,
  className,
  title = 'Copy to clipboard',
  variant = 'ghost',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const variantStyles = {
    ghost: 'text-[#94a3b8] hover:text-[#cbd5e1] hover:bg-[#111a14] active:scale-95',
    secondary: 'bg-[#111a14] hover:bg-[#16231b] text-[#cbd5e1] border border-[#1b2b21] hover:border-[#10b981]/40 active:scale-95',
    subtle: 'text-[#94a3b8] hover:text-[#34d399] hover:bg-[#10b981]/10 active:scale-95',
    pill: 'bg-[#0c6e4e] hover:bg-[#10b981] text-white rounded-full font-semibold px-3 py-1 shadow-sm active:scale-95',
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={title}
      aria-label={title}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#10b981]/50',
        showIconOnly ? 'p-1.5 rounded-lg' : 'px-2.5 py-1 text-xs font-semibold rounded-lg',
        variantStyles[variant],
        className
      )}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-[#34d399]" />
          {!showIconOnly && <span className="text-[#34d399] font-medium">Copied!</span>}
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 opacity-75" />
          {!showIconOnly && <span>{label || 'Copy'}</span>}
        </>
      )}
    </button>
  );
};
