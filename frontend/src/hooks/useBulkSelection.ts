import { useState, useCallback, useMemo } from 'react';

/**
 * Hook de gestion de sélection multiple pour les tableaux (Bulk Actions)
 * Optimisé avec Set pour la performance et l'unicité.
 * 
 * @param allIds La liste de tous les IDs actuellement affichés/filtrés
 */
export function useBulkSelection(allIds: string[] = []) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Vérifier si tout est sélectionné
    const isAllSelected = useMemo(() => {
        if (allIds.length === 0) return false;
        return allIds.every(id => selectedIds.has(id));
    }, [allIds, selectedIds]);

    // Nombre d'éléments sélectionnés
    const selectedCount = selectedIds.size;

    // Sélectionner / Désélectionner un seul élément
    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    // Tout sélectionner / Tout désélectionner
    const toggleSelectAll = useCallback(() => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(allIds));
        }
    }, [allIds, isAllSelected]);

    // Vider la sélection (après une action réussie par exemple)
    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    // Retourner les IDs sous forme de tableau pour l'API
    const selectedIdsArray = useMemo(() => Array.from(selectedIds), [selectedIds]);

    return {
        selectedIds: selectedIdsArray,
        selectedCount,
        isAllSelected,
        toggleSelect,
        toggleSelectAll,
        clearSelection,
        isSelected: (id: string) => selectedIds.has(id)
    };
}
