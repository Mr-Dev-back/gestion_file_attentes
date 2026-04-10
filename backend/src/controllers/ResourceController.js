import { Resource, Action, Permission, sequelize } from '../models/index.js';
import logger from '../config/logger.js';

class ResourceController {
    /**
     * Get all resources with linked permission count
     */
    async getAll(req, res) {
        try {
            const resources = await Resource.findAll({
                include: [{
                    model: Permission,
                    as: 'permissions',
                    attributes: ['permissionId']
                }],
                order: [['name', 'ASC']]
            });

            // Format to include count
            const result = resources.map(resource => ({
                resourceId: resource.resourceId,
                name: resource.name,
                slug: resource.slug,
                description: resource.description,
                permissionCount: resource.permissions?.length || 0,
                createdAt: resource.createdAt
            }));

            res.json(result);
        } catch (error) {
            logger.error('Error fetching resources:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des ressources.' });
        }
    }

    /**
     * Create resource with auto-generation of permissions
     */
    async create(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const { name, slug, description } = req.body;

            if (!name || !slug) {
                return res.status(400).json({ error: 'Le nom et le slug sont requis.' });
            }

            // 1. Create the Resource
            const resource = await Resource.create({
                name,
                slug: slug.toUpperCase().replace(/\s+/g, '_'),
                description
            }, { transaction });

            // 2. Fetch all existing Actions
            const actions = await Action.findAll({ transaction });

            // 3. Prepare Permissions to create
            // The Permission model hook beforeSave will handle the 'code' generation if we don't provide it,
            // but providing it here ensures completeness within the transaction.
            const permissionsToCreate = actions.map(action => ({
                resourceId: resource.resourceId,
                actionId: action.actionId,
                description: `Permission auto-générée pour ${resource.name} : ${action.name}`
            }));

            if (permissionsToCreate.length > 0) {
                await Permission.bulkCreate(permissionsToCreate, { 
                    transaction,
                    individualHooks: true // Required for the beforeSave hook to run on each
                });
            }

            await transaction.commit();
            
            // Reload to return the full object with count (0 initially but cleaner)
            res.status(201).json({
                ...resource.toJSON(),
                permissionCount: permissionsToCreate.length
            });
        } catch (error) {
            await transaction.rollback();
            logger.error('Error creating resource:', error);
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ error: 'Ce slug de ressource existe déjà.' });
            }
            res.status(500).json({ error: 'Erreur lors de la création de la ressource.' });
        }
    }

    /**
     * Update resource metadata (Slug is immuable)
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            const resource = await Resource.findByPk(id);
            if (!resource) {
                return res.status(404).json({ error: 'Ressource introuvable.' });
            }

            await resource.update({ name, description });

            res.json(resource);
        } catch (error) {
            logger.error('Error updating resource:', error);
            res.status(500).json({ error: 'Erreur lors de la mise à jour de la ressource.' });
        }
    }

    /**
     * Delete resource with security check
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            
            const resource = await Resource.findByPk(id, {
                include: [{
                    model: Permission,
                    as: 'permissions',
                    include: ['roles'] // Check if permissions are attached to roles
                }]
            });

            if (!resource) {
                return res.status(404).json({ error: 'Ressource introuvable.' });
            }

            // Check if any of its permissions are used in roles
            const isUsed = resource.permissions.some(p => p.roles && p.roles.length > 0);
            
            if (isUsed) {
                return res.status(400).json({ 
                    error: "Suppression impossible : Cette ressource est liée à des permissions actuellement assignées à des rôles." 
                });
            }

            // If not used in roles, we can destroy the resource and its permissions CASCADE
            // (Assuming Permission table has onDelete: CASCADE for resourceId, let's verify or do it manually)
            // Manual cleanup of permissions to be safe if CASCADE isn't set in DB
            await Permission.destroy({ where: { resourceId: id } });
            await resource.destroy();

            res.status(204).send();
        } catch (error) {
            logger.error('Error deleting resource:', error);
            res.status(500).json({ error: 'Erreur lors de la suppression de la ressource.' });
        }
    }

    /**
     * Suppression groupée de ressources
     */
    async bulkDelete(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const { ids } = req.body;

            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ error: 'Une liste d\'IDs est requise.' });
            }

            // 1. Vérifier si des ressources sont liées à des rôles
            const resources = await Resource.findAll({
                where: { resourceId: { [Op.in]: ids } },
                include: [{
                    model: Permission,
                    as: 'permissions',
                    include: ['roles']
                }],
                transaction
            });

            for (const resource of resources) {
                const isUsed = resource.permissions?.some(p => p.roles && p.roles.length > 0);
                if (isUsed) {
                    await transaction.rollback();
                    return res.status(400).json({ 
                        error: `Action annulée : La ressource '${resource.name}' est liée à des rôles actifs.` 
                    });
                }
            }

            // 2. Suppression atomique
            // Nettoyage manuel des permissions pour être sûr si CASCADE n'est pas actif
            await Permission.destroy({ 
                where: { resourceId: { [Op.in]: ids } },
                transaction 
            });

            await Resource.destroy({ 
                where: { resourceId: { [Op.in]: ids } },
                transaction 
            });

            // 3. Audit
            const { AuditLog } = await import('../models/index.js'); // Dynamic import to avoid circular dep if any
            await AuditLog.create({
                userId: req.user.userId,
                action: 'BULK_DELETE_RESOURCES',
                details: { count: ids.length, resourceIds: ids },
                ipAddress: req.ip
            }, { transaction });

            await transaction.commit();
            res.status(200).json({ message: `${ids.length} ressources supprimées.` });
        } catch (error) {
            if (transaction) await transaction.rollback();
            logger.error('Erreur bulk delete resources:', error);
            res.status(500).json({ error: 'Erreur lors de la suppression groupée des ressources.' });
        }
    }
}

export default new ResourceController();
