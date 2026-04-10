import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '../../atoms/ui/button';
import { cn } from '../../../lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full';
    maxWidth?: string;
    isDirty?: boolean;
}

const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    'full': 'max-w-[95vw]',
};

export function Modal({ isOpen, onClose, title, children, size = 'md', maxWidth, isDirty = false }: ModalProps) {
    const [showConfirmClose, setShowConfirmClose] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClose = () => {
        if (isDirty) {
            setShowConfirmClose(true);
        } else {
            onClose();
        }
    };

    const confirmClose = () => {
        setShowConfirmClose(false);
        onClose();
    };

    const cancelClose = () => {
        setShowConfirmClose(false);
    };

    const modalContent = (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto pointer-events-auto">
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={handleClose}
            />
            <div className={cn(
                "relative bg-white rounded-[2rem] shadow-2xl border border-white/20 w-full animate-in zoom-in-95 fade-in duration-300",
                sizeMap[size],
                maxWidth
            )}>
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{title}</h3>
                        <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-xl hover:bg-slate-50">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <div className="p-6">
                    {children}
                </div>
            </div>
            
            {showConfirmClose && (
                <ConfirmModal
                    isOpen={showConfirmClose}
                    onClose={cancelClose}
                    onConfirm={confirmClose}
                    title="Avertissement"
                    message="Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?"
                    confirmText="Oui, fermer"
                    cancelText="Non, rester"
                    variant="warning"
                />
            )}
        </div>
    );

    return createPortal(modalContent, document.body);
}

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    variant = 'primary'
}: ConfirmModalProps) {
    const variantStyles = {
        danger: 'bg-danger hover:bg-danger/90 text-white',
        warning: 'bg-warning hover:bg-warning/90 text-black',
        primary: 'bg-primary hover:bg-primary/90 text-white',
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <p className="text-text-muted mb-6">{message}</p>
            <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                    {cancelText}
                </Button>
                <Button
                    className={cn("flex-1", variantStyles[variant])}
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                >
                    {confirmText}
                </Button>
            </div>
        </Modal>
    );
}
