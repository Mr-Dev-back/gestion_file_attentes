import AuditLog from '../models/AuditLog.js';
import logger from '../config/logger.js';

/**
 * Service de centralisation des logs d'audit.
 * Permet d'enregistrer chaque action critique avec traçabilité complète.
 */
class AuditService {
    /**
     * Enregistre une action d'audit
     * @param {Object} req - Objet requête Express (pour extraire user, ip, user-agent)
     * @param {String} action - Code de l'action (ex: 'USER_UPDATE')
     * @param {String} resourceType - Type de ressource concernée (ex: 'Ticket')
     * @param {String|Number} resourceId - Identifiant de la ressource
     * @param {Object} oldValues - (Optionnel) État précédent
     * @param {Object} newValues - (Optionnel) Nouvel état
     */
    async logAction(req, action, resourceType, resourceId, oldValues = null, newValues = null) {
        try {
            // Extraction sécurisée des informations de l'utilisateur
            const userId = req.user?.userId || null;
            const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'] || 'Unknown';

            // Création asynchrone du log
            await AuditLog.create({
                userId,
                action,
                resourceType,
                resourceId: resourceId?.toString(),
                oldValues,
                newValues,
                ipAddress,
                userAgent: userAgent.substring(0, 255), // Sécurité longueur
                occurredAt: new Date()
            });

            logger.info(`[AUDIT] Action ${action} enregistrée pour l'utilisateur ${userId || 'Système'}`);
        } catch (error) {
            // On ne bloque pas le flux principal en cas d'échec de l'audit
            logger.error(`[AUDIT ERROR] Impossible d'enregistrer le log pour ${action}:`, error);
        }
    }

    /**
     * Helper pour calculer le diff entre deux objets (pour loguer uniquement les changements)
     */
    getDiff(oldObj, newObj) {
        if (!oldObj) return { old: null, new: newObj };
        
        const diff = { old: {}, new: {} };
        let hasChanges = false;

        Object.keys(newObj).forEach(key => {
            // On ignore les champs système ou sensibles
            if (['password', 'updatedAt', 'createdAt'].includes(key)) return;

            if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
                diff.old[key] = oldObj[key];
                diff.new[key] = newObj[key];
                hasChanges = true;
            }
        });

        return hasChanges ? diff : null;
    }
}

export default new AuditService();
