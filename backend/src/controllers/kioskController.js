import { Kiosk, Site, KioskActivity, Queue, AuditLog, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

export const getAllKiosks = async (req, res) => {
    try {
        const { siteId } = req.query;
        const where = {};
        if (siteId) where.siteId = siteId;

        const kiosks = await Kiosk.findAll({
            where,
            include: [
                { model: Site, as: 'site', attributes: ['name', 'siteId'] },
                { model: Queue, as: 'queues', through: { attributes: ['isDefault'] } }
            ],
            order: [['name', 'ASC']]
        });
        res.json(kiosks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createKiosk = async (req, res) => {
    try {
        const { name, siteId, status, ipAddress, queueIds, config, capabilities, type } = req.body;
        
        const kiosk = await Kiosk.create({
            name,
            siteId,
            status: status || 'OFFLINE',
            ipAddress,
            kioskType: type || 'ENTRANCE',
            config,
            capabilities
        });

        if (queueIds && queueIds.length > 0) {
            await kiosk.setQueues(queueIds);
        }

        const fullKiosk = await Kiosk.findByPk(kiosk.kioskId, {
            include: [
                { model: Site, as: 'site', attributes: ['name', 'siteId'] },
                { model: Queue, as: 'queues', through: { attributes: ['isDefault'] } }
            ]
        });

        res.status(201).json(fullKiosk);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateKiosk = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, siteId, status, ipAddress, queueIds, config, capabilities, type } = req.body;

        const kiosk = await Kiosk.findByPk(id);
        if (!kiosk) return res.status(404).json({ error: 'Borne non trouvée' });

        await kiosk.update({
            name,
            siteId,
            status,
            ipAddress,
            kioskType: type,
            config,
            capabilities
        });

        if (queueIds) {
            await kiosk.setQueues(queueIds);
        }

        // Emit socket event if status changed
        const io = req.app.get('io');
        if (io && status) {
            io.emit('kiosk-update', { id: kiosk.kioskId, status: kiosk.status });
        }

        const updatedKiosk = await Kiosk.findByPk(id, {
            include: [
                { model: Site, as: 'site', attributes: ['name', 'siteId'] },
                { model: Queue, as: 'queues', through: { attributes: ['isDefault'] } }
            ]
        });

        res.json(updatedKiosk);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteKiosk = async (req, res) => {
    try {
        const { id } = req.params;
        const kiosk = await Kiosk.findByPk(id);
        if (!kiosk) return res.status(404).json({ error: 'Borne non trouvée' });

        await kiosk.destroy();
        res.json({ message: 'Borne supprimée' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getKioskHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const history = await KioskActivity.findAll({
            where: { kioskId: id },
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Récupération de la configuration publique d'une borne (sans auth admin)
 */
export const getPublicKioskConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const kiosk = await Kiosk.findByPk(id, {
            attributes: ['kioskId', 'name', 'status', 'config', 'capabilities', 'siteId'],
            include: [{ model: Site, as: 'site', attributes: ['name'] }]
        });

        if (!kiosk) return res.status(404).json({ error: 'Borne non trouvée' });
        
        res.json(kiosk);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


/**
 * Suppression groupée de bornes
 */
export const bulkDeleteKiosks = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Une liste d\'IDs est requise.' });
        }

        await Kiosk.destroy({
            where: { kioskId: { [Op.in]: ids } },
            transaction
        });

        await AuditLog.create({
            userId: req.user.userId,
            action: 'BULK_DELETE_KIOSKS',
            details: { count: ids.length, ids },
            ipAddress: req.ip
        }, { transaction });

        await transaction.commit();
        res.json({ message: `${ids.length} bornes supprimées.` });
    } catch (error) {
        if (transaction) await transaction.rollback();
        logger.error('Erreur bulk delete kiosks:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression groupée.' });
    }
};

/**
 * Mise à jour groupée du statut des bornes
 */
export const bulkUpdateKiosksStatus = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { ids, status } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Une liste d\'IDs est requise.' });
        }

        await Kiosk.update(
            { status },
            { where: { kioskId: { [Op.in]: ids } }, transaction }
        );

        await AuditLog.create({
            userId: req.user.userId,
            action: 'BULK_UPDATE_KIOSK_STATUS',
            details: { count: ids.length, ids, status },
            ipAddress: req.ip
        }, { transaction });

        // Notification temps réel
        const io = req.app.get('io');
        if (io) {
            ids.forEach(id => {
                io.emit('kiosk-update', { id, status });
            });
        }

        await transaction.commit();
        res.json({ message: `${ids.length} bornes mises à jour.` });
    } catch (error) {
        if (transaction) await transaction.rollback();
        logger.error('Erreur bulk update kiosk status:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour groupée.' });
    }
};
