import { Action, Permission, Resource } from '../models/index.js';
import auditService from '../services/auditService.js';
import logger from '../config/logger.js';

const permissionInclude = [
  { model: Resource, as: 'resourceObj' },
  { model: Action, as: 'actionObj' }
];

class PermissionController {
  async getAll(req, res) {
    try {
      const permissions = await Permission.findAll({
        include: permissionInclude,
        order: [
          ['name', 'ASC'],
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

  async getResources(req, res) {
    try {
      const resources = await Resource.findAll({ order: [['slug', 'ASC']] });
      res.json(resources);
    } catch (error) {
      logger.error('Error fetching resources:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des ressources.' });
    }
  }

  async getActions(req, res) {
    try {
      const actions = await Action.findAll({ order: [['slug', 'ASC']] });
      res.json(actions);
    } catch (error) {
      logger.error('Error fetching actions:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des actions.' });
    }
  }

  async create(req, res) {
    try {
      const { name, guardName, description, resourceId, actionId, action, subject, conditions } = req.body;

      if (!resourceId || !actionId) {
        return res.status(400).json({ error: 'Ressource et Action sont requises.' });
      }

      const permission = await Permission.create({
        name,
        guardName,
        description,
        resourceId,
        actionId,
        action,
        subject,
        conditions
      });

      await auditService.logAction(req, 'PERMISSION_CREATE', 'Permission', permission.permissionId, null, {
        name: permission.name,
        resourceId,
        actionId
      });

      const fullPermission = await Permission.findByPk(permission.permissionId, {
        include: permissionInclude
      });

      res.status(201).json(fullPermission);
    } catch (error) {
      logger.error('Error creating permission:', error);
      res.status(500).json({ error: 'Erreur lors de la création de la permission.' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, guardName, description, resourceId, actionId, action, subject, conditions } = req.body;

      const permission = await Permission.findByPk(id);
      if (!permission) {
        return res.status(404).json({ error: 'Permission introuvable.' });
      }

      const oldData = { ...permission.toJSON() };
      await permission.update({
        name,
        guardName,
        description,
        resourceId,
        actionId,
        action,
        subject,
        conditions
      });

      const diff = auditService.getDiff(oldData, {
        name,
        guardName,
        description,
        resourceId,
        actionId,
        action,
        subject,
        conditions
      });

      if (diff) {
        await auditService.logAction(req, 'PERMISSION_UPDATE', 'Permission', id, diff.old, diff.new);
      }

      const fullPermission = await Permission.findByPk(id, {
        include: permissionInclude
      });

      res.json(fullPermission);
    } catch (error) {
      logger.error('Error updating permission:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de la permission.' });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const permission = await Permission.findByPk(id);
      if (!permission) {
        return res.status(404).json({ error: 'Permission introuvable.' });
      }

      await auditService.logAction(req, 'PERMISSION_DELETE', 'Permission', id, { name: permission.name, code: permission.code });
      await permission.destroy();
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting permission:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de la permission.' });
    }
  }

  async deleteResource(req, res) {
    try {
      const { id } = req.params;
      const linkedCount = await Permission.count({ where: { resourceId: id } });

      if (linkedCount > 0) {
        return res.status(400).json({
          error: 'Suppression impossible : Cette ressource est utilisée par des permissions actives.'
        });
      }

      const resource = await Resource.findByPk(id);
      if (!resource) {
        return res.status(404).json({ error: 'Ressource introuvable.' });
      }

      await resource.destroy();
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting resource:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de la ressource.' });
    }
  }

  async deleteAction(req, res) {
    try {
      const { id } = req.params;
      const linkedCount = await Permission.count({ where: { actionId: id } });

      if (linkedCount > 0) {
        return res.status(400).json({
          error: 'Suppression impossible : Cette action est utilisée par des permissions actives.'
        });
      }

      const action = await Action.findByPk(id);
      if (!action) {
        return res.status(404).json({ error: 'Action introuvable.' });
      }

      await action.destroy();
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting action:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de l\'action.' });
    }
  }
}

export default new PermissionController();
