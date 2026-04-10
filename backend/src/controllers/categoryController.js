import { Category, Queue, AuditLog, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            include: [
                { model: Queue, as: 'queues', through: { attributes: [] } }
            ],
            order: [['name', 'ASC']]
        });
        res.json(categories);
    } catch (error) {
        logger.error('Erreur récupération catégories:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { name, prefix, color, estimatedDuration, description, isActive, queueIds } = req.body;

        if (!name || !prefix) {
            return res.status(400).json({ error: 'Nom et préfixe requis' });
        }

        const category = await Category.create({
            name,
            prefix,
            color,
            estimatedDuration: estimatedDuration || 30,
            description,
            isActive: isActive !== undefined ? isActive : true
        });

        if (queueIds && queueIds.length > 0) {
            await category.setQueues(queueIds);
        }

        const fullCategory = await Category.findByPk(category.categoryId, {
            include: [{ model: Queue, as: 'queues', through: { attributes: [] } }]
        });

        res.status(201).json(fullCategory);
    } catch (error) {
        logger.error('Erreur création catégorie:', error);
        res.status(500).json({ error: 'Erreur lors de la création de la catégorie' });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, prefix, color, estimatedDuration, description, isActive, queueIds } = req.body;

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ error: 'Catégorie non trouvée' });
        }

        await category.update({
            name,
            prefix,
            color,
            estimatedDuration,
            description,
            isActive: isActive !== undefined ? isActive : category.isActive
        });

        if (queueIds) {
            await category.setQueues(queueIds);
        }

        const updatedCategory = await Category.findByPk(id, {
            include: [{ model: Queue, as: 'queues', through: { attributes: [] } }]
        });

        res.json(updatedCategory);
    } catch (error) {
        logger.error('Erreur mise à jour catégorie:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de la catégorie' });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Category.destroy({ where: { categoryId: id } });

        if (!deleted) {
            return res.status(404).json({ error: 'Catégorie non trouvée' });
        }

        res.json({ message: 'Catégorie supprimée avec succès' });
    } catch (error) {
        logger.error('Erreur suppression catégorie:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de la catégorie' });
    }
};

/**
 * Mise à jour groupée du statut des catégories
 */
export const bulkUpdateCategoryStatus = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { ids, isActive } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Une liste d\'IDs est requise.' });
        }

        await Category.update(
            { isActive },
            { where: { categoryId: { [Op.in]: ids } }, transaction }
        );

        await AuditLog.create({
            userId: req.user.userId,
            action: 'BULK_UPDATE_CATEGORY_STATUS',
            details: { count: ids.length, ids, isActive },
            ipAddress: req.ip
        }, { transaction });

        await transaction.commit();
        res.json({ message: `${ids.length} catégories mises à jour.` });
    } catch (error) {
        if (transaction) await transaction.rollback();
        logger.error('Erreur bulk update category status:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour groupée.' });
    }
};

/**
 * Suppression groupée de catégories
 */
export const bulkDeleteCategories = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Une liste d\'IDs est requise.' });
        }

        await Category.destroy({
            where: { categoryId: { [Op.in]: ids } },
            transaction
        });

        await AuditLog.create({
            userId: req.user.userId,
            action: 'BULK_DELETE_CATEGORIES',
            details: { count: ids.length, ids },
            ipAddress: req.ip
        }, { transaction });

        await transaction.commit();
        res.json({ message: `${ids.length} catégories supprimées.` });
    } catch (error) {
        if (transaction) await transaction.rollback();
        logger.error('Erreur bulk delete categories:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression groupée.' });
    }
};
