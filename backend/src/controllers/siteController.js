import { Site, Company, AuditLog } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';
import authMiddleware from '../middlewares/auth.middleware.js';

class SiteController {
    async getAll(req, res) {
        try {
            const where = {};
            // Scope check: If managed, only return allowed sites
            if (req.user.role === 'MANAGER') {
                // Return all sites of the manager's company
                if (req.user.site?.companyId) { // Ensure user.site is loaded
                    // Need to find sites where companyId = user's companyId
                    where.companyId = req.user.site.companyId;
                } else if (req.user.siteId) {
                    // Fallback if no company link, restrict to own site
                    where.siteId = req.user.siteId;
                }
            } else if (['SUPERVISOR', 'AGENT_QUAI'].includes(req.user.role)) {
                where.siteId = req.user.siteId;
            }

            const { page, limit, search } = req.query;

            if (search) {
                where[Op.or] = [
                    { name: { [Op.iLike]: `%${search}%` } },
                    { code: { [Op.iLike]: `%${search}%` } }
                ];
            }

            const queryOptions = {
                where,
                include: [{ model: Company, as: 'company', attributes: ['name'] }],
                order: [['name', 'ASC']]
            };

            if (page && limit) {
                queryOptions.limit = parseInt(limit);
                queryOptions.offset = (parseInt(page) - 1) * parseInt(limit);
                const { count, rows } = await Site.findAndCountAll(queryOptions);
                return res.json({
                    total: count,
                    pages: Math.ceil(count / parseInt(limit)),
                    currentPage: parseInt(page),
                    data: rows
                });
            }

            const sites = await Site.findAll(queryOptions);
            res.json(sites);
        } catch (error) {
            logger.error('Erreur getAll Sites:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des sites.' });
        }
    }

    async getOne(req, res) {
        try {
            const site = await Site.findByPk(req.params.id, {
                include: [{ model: Company, as: 'company', attributes: ['name'] }]
            });
            if (!site) return res.status(404).json({ error: 'Site non trouvé.' });
            
            // Security check
            if (req.user.role !== 'ADMINISTRATOR' && req.user.siteId !== site.siteId) {
                // Check if manager of the same company
                if (req.user.role === 'MANAGER' && req.user.site?.companyId === site.companyId) {
                    // OK
                } else {
                    return res.status(403).json({ error: 'Accès interdit.' });
                }
            }

            res.json(site);
        } catch (error) {
            logger.error('Erreur getOne Site:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération du site.' });
        }
    }

    async create(req, res) {
        try {
            // Only Admin can create sites
            if (req.user.role !== 'ADMINISTRATOR') return res.status(403).json({ error: 'Accès interdit.' });

            const site = await Site.create(req.body);

            // Audit
            await AuditLog.create({
                userId: req.user.userId,
                action: 'CREATE_SITE',
                details: { siteId: site.siteId, name: site.name, code: site.code },
                ipAddress: req.ip
            });

            res.status(201).json(site);
        } catch (error) {
            logger.error('Erreur create Site:', error);
            res.status(500).json({ error: 'Erreur lors de la création du site.' });
        }
    }

    async update(req, res) {
        try {
            // Admin or Manager of that site/company
            if (!authMiddleware.checkScope(req.user, req.params.id)) {
                // If checking by Site ID fails, check if Manager owns the Company of this Site?
                // checkScope logic for Manager (targetSiteId) returns user.siteId === targetSiteId
                // BUT Manager should manage ALL sites of their company ideally.
                // For now, let's rely on checkScope which enforces: Manager -> Own Site.
                // If we want Manager -> Any Site of Company, we need to fetch Site first to get its companyId.
                const targetSite = await Site.findByPk(req.params.id);
                if (targetSite && req.user.role === 'MANAGER' && req.user.site?.companyId === targetSite.companyId) {
                    // Allowed
                } else if (!authMiddleware.checkScope(req.user, req.params.id)) {
                    return res.status(403).json({ error: 'Accès interdit.' });
                }
            }

            const site = await Site.findByPk(req.params.id);
            if (!site) return res.status(404).json({ error: 'Site non trouvé.' });

            await site.update(req.body);

            // Audit
            await AuditLog.create({
                userId: req.user.userId,
                action: 'UPDATE_SITE',
                details: { siteId: site.siteId, ...req.body },
                ipAddress: req.ip
            });

            res.json(site);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async delete(req, res) {
        try {
            if (req.user.role !== 'ADMINISTRATOR') return res.status(403).json({ error: 'Accès interdit.' });

            const site = await Site.findByPk(req.params.id);
            if (!site) return res.status(404).json({ error: 'Site non trouvé.' });

            await site.destroy();

            // Audit
            await AuditLog.create({
                userId: req.user.userId,
                action: 'DELETE_SITE',
                details: { siteId: req.params.id, name: site.name },
                ipAddress: req.ip
            });

            res.json({ message: 'Site supprimé.' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async bulkDelete(req, res) {
        const { sequelize } = await import('../models/index.js');
        const transaction = await sequelize.transaction();
        try {
            if (req.user.role !== 'ADMINISTRATOR') {
                return res.status(403).json({ error: 'Accès interdit.' });
            }

            const { ids } = req.body;
            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ error: 'Une liste d\'IDs est requise.' });
            }

            await Site.destroy({ where: { siteId: ids }, transaction });

            await AuditLog.create({
                userId: req.user.userId,
                action: 'BULK_DELETE_SITE',
                details: { count: ids.length, ids },
                ipAddress: req.ip
            }, { transaction });

            await transaction.commit();
            res.json({ message: `${ids.length} sites supprimés.` });
        } catch (error) {
            if (transaction) await transaction.rollback();
            logger.error('Erreur bulk delete site:', error);
            res.status(500).json({ error: 'Erreur lors de la suppression groupée.' });
        }
    }
}

export default new SiteController();
