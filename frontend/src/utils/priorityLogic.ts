import type { Ticket } from '../types/ticket';

/**
 * Trie une liste de tickets en plaçant les priorités les plus hautes en premier.
 * Ordre : Critique (2) > Urgent (1) > Normal (0).
 * À priorité égale, le plus ancien (arrivé en premier) est placé en haut (FIFO).
 */
export const getSortedQueue = (tickets: Ticket[]): Ticket[] => {
  return [...tickets].sort((a, b) => {
    if ((b.priority || 0) !== (a.priority || 0)) {
      return (b.priority || 0) - (a.priority || 0);
    }
    return new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime();
  });
};

/**
 * Retourne les classes CSS de mise en avant pour les tickets prioritaires.
 * Harmonisé avec la palette Indigo/Amber/Red du design system.
 */
export const getPriorityGlowClass = (priority: number): string => {
  if (priority >= 2) return 'ring-2 ring-red-400/60 shadow-lg shadow-red-500/10';
  if (priority === 1) return 'ring-2 ring-amber-400/60 shadow-lg shadow-amber-500/10';
  return '';
};

/**
 * Retourne la couleur du badge de priorité.
 */
export const getPriorityBadge = (priority: number): { label: string; className: string } => {
  if (priority >= 2) return { label: 'CRITIQUE', className: 'bg-red-500 text-white' };
  if (priority === 1) return { label: 'URGENT', className: 'bg-amber-500 text-white' };
  return { label: 'NORMAL', className: 'bg-slate-100 text-slate-500' };
};
