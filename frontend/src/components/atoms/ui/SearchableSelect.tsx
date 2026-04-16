import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Sélectionner...",
  label,
  disabled = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => {
    return options.filter(opt => 
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const selectedOption = useMemo(() => {
    return options.find(opt => opt.value === value);
  }, [options, value]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && activeIndex >= 0) {
        onChange(filteredOptions[activeIndex].value);
        setIsOpen(false);
        setSearchTerm('');
      } else {
        setIsOpen(!isOpen);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Tab' && isOpen) {
       setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setActiveIndex(-1);
    }
  }, [isOpen]);

  return (
    <div className={cn("relative space-y-1.5", className)} ref={containerRef} onKeyDown={handleKeyDown}>
      {label && (
        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
          {label}
        </label>
      )}
      
      <div 
        className={cn(
          "relative min-h-[44px] flex items-center px-4 bg-white border border-slate-200 rounded-xl cursor-pointer transition-all active:scale-[0.99]",
          isOpen ? "ring-2 ring-primary/20 border-primary" : "hover:border-slate-300",
          disabled && "opacity-50 cursor-not-allowed bg-slate-50"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={cn("text-sm flex-1 truncate", !selectedOption && "text-slate-400 font-medium")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        <div className="flex items-center gap-2">
            {value && !disabled && (
              <button 
                onClick={(e) => { e.stopPropagation(); onChange(''); }}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={14} />
              </button>
            )}
            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", isOpen && "rotate-180")} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-[100] top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col max-h-72"
          >
            <div className="p-3 border-b border-slate-50 flex items-center gap-2 bg-slate-50/50">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-0 placeholder:text-slate-400"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 no-scrollbar" role="listbox">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs font-bold text-slate-400 italic">
                  Aucun résultat trouvé
                </div>
              ) : (
                filteredOptions.map((opt, idx) => (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={opt.value === value}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm",
                      opt.value === value 
                        ? "bg-slate-900 text-white font-bold" 
                        : idx === activeIndex 
                          ? "bg-slate-100 text-slate-900" 
                          : "text-slate-600 hover:bg-slate-50"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <span className="truncate">{opt.label}</span>
                    {opt.value === value && <Check className="w-4 h-4 shrink-0" />}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
