import type { Ticket } from '../types/ticket';

/**
 * Trie une liste de tickets en plaçant les priorités les plus hautes en premier.
 * Ordre : Critique (2) > Urgent (1) > Normal (0).
 * À priorité égale, le plus ancien (arrivé en premier) est placé en haut.
 */
export const getSortedQueue = (tickets: Ticket[]): Ticket[] => {
  return [...tickets].sort((a, b) => {
    // 1. Comparaison par priorité décroissante
    if ((b.priority || 0) !== (a.priority || 0)) {
      return (b.priority || 0) - (a.priority || 0);
    }
    
    // 2. Comparaison par date d'arrivée croissante (FIFO au sein d'une même priorité)
    const dateA = new Date(a.arrivedAt).getTime();
    const dateB = new Date(b.arrivedAt).getTime();
    return dateA - dateB;
  });
};

/**
 * Retourne la classe CSS d'animation pour les tickets prioritaires.
 */
export const getPriorityClass = (priority: number): string => {
  if (priority >= 2) return 'ring-4 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse';
  if (priority === 1) return 'ring-2 ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
  return '';
};
