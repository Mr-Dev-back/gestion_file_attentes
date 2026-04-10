import { Permission, Resource, Action } from '../models/index.js';
import logger from '../config/logger.js';

class PermissionController {
    /**
     * Get all permissions with their normalized objects
     */
    async getAll(req, res) {
        try {
            const permissions = await Permission.findAll({
                include: [
                    { model: Resource, as: 'resourceObj' },
                    { model: Action, as: 'actionObj' }
                ],
                order: [
                    [{ model: Resource, as: 'resourceObj' }, 'slug', 'ASC'],
                    [{ model: Action, as: 'actionObj' }, 'slug', 'ASC']
                ]
            });
            res.json(permissions);
        } catch (error) {
            logger.error('Error fetching permissions:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des permissions.' });
        }
    }

    /**
     * Get all available resources
     */
    async getResources(req, res) {
        try {
            const resources = await Resource.findAll({ order: [['slug', 'ASC']] });
            res.json(resources);
        } catch (error) {
            logger.error('Error fetching resources:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des ressources.' });
        }
    }

    /**
     * Get all available actions
     */
    async getActions(req, res) {
        try {
            const actions = await Action.findAll({ order: [['slug', 'ASC']] });
            res.json(actions);
        } catch (error) {
            logger.error('Error fetching actions:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des actions.' });
        }
    }

    /**
     * Create individual permission
     */
    async create(req, res) {
        try {
            const { description, resourceId, actionId } = req.body;
            
            if (!resourceId || !actionId) {
                return res.status(400).json({ error: 'Ressource et Action sont requises.' });
            }

            const permission = await Permission.create({
                description,
                resourceId,
                actionId
            });

            // Reload to get associations
            const fullPermission = await Permission.findByPk(permission.permissionId, {
                include: [
                    { model: Resource, as: 'resourceObj' },
                    { model: Action, as: 'actionObj' }
                ]
            });

            res.status(201).json(fullPermission);
        } catch (error) {
            logger.error('Error creating permission:', error);
            res.status(500).json({ error: 'Erreur lors de la création de la permission.' });
        }
    }

    /**
     * Update permission
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const { description, resourceId, actionId } = req.body;

            const permission = await Permission.findByPk(id);
            if (!permission) {
                return res.status(404).json({ error: 'Permission introuvable.' });
            }

            await permission.update({ description, resourceId, actionId });
            
            const fullPermission = await Permission.findByPk(id, {
                include: [
                    { model: Resource, as: 'resourceObj' },
                    { model: Action, as: 'actionObj' }
                ]
            });

            res.json(fullPermission);
        } catch (error) {
            logger.error('Error updating permission:', error);
            res.status(500).json({ error: 'Erreur lors de la mise à jour de la permission.' });
        }
    }

    /**
     * Delete permission
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            const permission = await Permission.findByPk(id);
            if (!permission) {
                return res.status(404).json({ error: 'Permission introuvable.' });
            }

            await permission.destroy();
            res.status(204).send();
        } catch (error) {
            logger.error('Error deleting permission:', error);
            res.status(500).json({ error: 'Erreur lors de la suppression de la permission.' });
        }
    }

    /**
     * Delete resource with protection
     */
    async deleteResource(req, res) {
        try {
            const { id } = req.params;
            const linkedCount = await Permission.count({ where: { resourceId: id } });
            
            if (linkedCount > 0) {
                return res.status(400).json({ 
                    error: "Suppression impossible : Cette ressource est utilisée par des permissions actives." 
                });
            }

            const resource = await Resource.findByPk(id);
            if (!resource) return res.status(404).json({ error: 'Ressource introuvable.' });
            
            await resource.destroy();
            res.status(204).send();
        } catch (error) {
            logger.error('Error deleting resource:', error);
            res.status(500).json({ error: 'Erreur lors de la suppression de la ressource.' });
        }
    }

    /**
     * Delete action with protection
     */
    async deleteAction(req, res) {
        try {
            const { id } = req.params;
            const linkedCount = await Permission.count({ where: { actionId: id } });
            
            if (linkedCount > 0) {
                return res.status(400).json({ 
                    error: "Suppression impossible : Cette action est utilisée par des permissions actives." 
                });
            }

            const action = await Action.findByPk(id);
            if (!action) return res.status(404).json({ error: 'Action introuvable.' });
            
            await action.destroy();
            res.status(204).send();
        } catch (error) {
            logger.error('Error deleting action:', error);
            res.status(500).json({ error: 'Erreur lors de la suppression de l\'action.' });
        }
    }
}

export default new PermissionController();
