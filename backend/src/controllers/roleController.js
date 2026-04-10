import { Role, Permission } from '../models/index.js';
import logger from '../config/logger.js';

class RoleController {
    /**
     * Get all roles with their permissions
     */
    async getAll(req, res) {
        try {
            const roles = await Role.findAll({
                include: [{
                    model: Permission,
                    as: 'permissions',
                    through: { attributes: [] }
                }],
                order: [['name', 'ASC']]
            });
            res.json(roles);
        } catch (error) {
            logger.error('Error fetching roles:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des rôles.' });
        }
    }

    /**
     * Create a new role
     */
    async create(req, res) {
        try {
            const { name, description, scope, permissionIds } = req.body;

            const existing = await Role.findOne({ where: { name } });
            if (existing) {
                return res.status(400).json({ error: 'Un rôle avec ce nom existe déjà.' });
            }

            const role = await Role.create({ name, description, scope });

            if (permissionIds && Array.isArray(permissionIds)) {
                await role.setPermissions(permissionIds);
            }

            const updatedRole = await Role.findByPk(role.roleId, {
                include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }]
            });

            res.status(201).json(updatedRole);
        } catch (error) {
            logger.error('Error creating role:', error);
            res.status(500).json({ error: 'Erreur lors de la création du rôle.' });
        }
    }

    /**
     * Update an existing role
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, description, scope, permissionIds } = req.body;

            const role = await Role.findByPk(id);
            if (!role) {
                return res.status(404).json({ error: 'Rôle introuvable.' });
            }

            // Prevent renaming system critical roles if necessary? 
            // For now, allow full edit.
            await role.update({ name, description, scope });

            if (permissionIds && Array.isArray(permissionIds)) {
                await role.setPermissions(permissionIds);
            }

            const updatedRole = await Role.findByPk(id, {
                include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }]
            });

            res.json(updatedRole);
        } catch (error) {
            logger.error('Error updating role:', error);
            res.status(500).json({ error: 'Erreur lors de la mise à jour du rôle.' });
        }
    }

    /**
     * Delete a role
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            const role = await Role.findByPk(id);
            if (!role) {
                return res.status(404).json({ error: 'Rôle introuvable.' });
            }

            // check if users use this role? 
            // Sequelize might handle this via foreign key constraints.
            await role.destroy();
            res.status(204).send();
        } catch (error) {
            logger.error('Error deleting role:', error);
            if (error.name === 'SequelizeForeignKeyConstraintError') {
                return res.status(400).json({ error: 'Ce rôle ne peut pas être supprimé car il est utilisé par des utilisateurs.' });
            }
            res.status(500).json({ error: 'Erreur lors de la suppression du rôle.' });
        }
    }

    /**
     * Specifically update permissions for a role
     */
    async updatePermissions(req, res) {
        try {
            const { id } = req.params;
            const { permissionIds } = req.body;

            const role = await Role.findByPk(id);
            if (!role) return res.status(404).json({ error: 'Rôle introuvable.' });

            await role.setPermissions(permissionIds || []);
            res.json({ message: 'Permissions mises à jour avec succès.' });
        } catch (error) {
            logger.error('Error updating role permissions:', error);
            res.status(500).json({ error: 'Erreur lors de la mise à jour des permissions du rôle.' });
        }
    }
}

export default new RoleController();
