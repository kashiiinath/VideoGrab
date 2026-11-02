'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-sm',
  showCloseButton = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[999] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        className={`w-full ${maxWidth} rounded-t-3xl sm:rounded-3xl border p-5 sm:p-6 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 pb-8 sm:pb-6`}
        style={{
          backgroundColor: 'var(--vg-card)',
          borderColor: 'var(--vg-border)',
        }}
      >
        {/* Header if title or close button */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between pb-1 flex-shrink-0">
            {title ? (
              <h3 className="font-extrabold text-[16px] text-[var(--vg-text-primary)]">
                {title}
              </h3>
            ) : <div />}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)] hover:bg-neutral-500/10 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Modal content with nice scrollbar */}
        <div className="overflow-y-auto scrollbar-hide flex-1 space-y-3">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

