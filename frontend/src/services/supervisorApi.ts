import { api } from './api';
import type { Ticket } from '../types/ticket';

/**
 * Met à jour la priorité d'un ticket.
 * @param ticketId ID du ticket
 * @param priority Niveau de priorité (0: Normal, 1: Urgent, 2: Critique)
 * @param reason Justification du changement
 */
export const updateVehiclePriority = async (ticketId: string, priority: number | string, reason?: string) => {
    const response = await api.patch(`/tickets/${ticketId}/priority`, {
        priority,
        reason
    });
    return response.data;
};

/**
 * Transfert manuel d'un ticket vers un autre quai ou catégorie.
 * @param ticketId ID du ticket
 * @param data Données de transfert (targetQuaiId, targetCategoryId)
 */
export const manualZoneTransfer = async (ticketId: string, data: { targetQuaiId?: string, targetCategoryId?: string }) => {
    const response = await api.patch(`/tickets/${ticketId}/transfer`, data);
    return response.data;
};

/**
 * Force le passage d'un ticket à une étape spécifique.
 */
export const forceStepJump = async (ticketId: string, stepId: string) => {
    const response = await api.patch(`/tickets/${ticketId}/jump`, { stepId });
    return response.data;
};

/**
 * Récupère les 50 derniers véhicules ayant quitté le site.
 */
export const getRecentOutVehicles = async (siteId: string) => {
    const response = await api.get<Ticket[]>(`/tickets`, {
        params: {
            siteId,
            status: 'COMPLETE',
            limit: 50,
            sort: 'completedAt',
            order: 'DESC'
        }
    });
    return response.data;
};

/**
 * Récupère les statistiques de session pour le site actuel.
 */
export const getShiftStats = async (siteId: string) => {
    // Note: On utilise l'API analytics existante si possible, ou on crée une route spécifique
    const response = await api.get(`/analytics/site/${siteId}/shift-stats`);
    return response.data;
};

/**
 * Recherche un véhicule par matricule (Tracking)
 */
export const searchVehicleByPlate = async (plateNumber: string) => {
    const response = await api.get(`/tracking/search/${plateNumber}`);
    return response.data;
};
