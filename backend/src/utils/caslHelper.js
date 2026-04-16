import { Op } from 'sequelize';

/**
 * Traduit les règles CASL d'un utilisateur en clause WHERE Sequelize.
 * @param {import('@casl/ability').PureAbility} ability - L'instance Ability du sujet
 * @param {string} action - L'action souhaitée (ex: 'read')
 * @param {string} subject - Le sujet (ex: 'Ticket', 'Analytics')
 * @returns {Object} - Un objet 'where' utilisable par Sequelize
 */
export const getSequelizeWhere = (ability, action, subject) => {
    // Si l'utilisateur peut tout gérer, pas de restriction
    if (ability.can('manage', 'all')) {
        return {};
    }

    // Récupère les règles pertinentes pour cette action et ce sujet
    // pureAbility.rulesFor(action, subject) retourne les règles applicables
    const rules = ability.rulesFor(action, subject);
    
    if (rules.length === 0) {
        // Aucune règle ne permet cette action, on retourne une condition impossible
        return { [Op.and]: [ { [Op.literal]: '1=0' } ] }; 
    }

    const conditions = [];

    for (const rule of rules) {
        if (rule.inverted) {
            // Note: La gestion des règles inversées ('cannot') est complexe en SQL pur.
            // Pour ce projet, on se concentre sur les règles positives ('can').
            continue;
        }

        if (!rule.conditions) {
            // Une règle sans condition signifie "accès total" pour ce sujet
            return {};
        }

        // On traduit les conditions CASL (Mongo-like) en Sequelize
        const seqCondition = translateConditions(rule.conditions);
        conditions.push(seqCondition);
    }

    if (conditions.length === 0) {
        return { [Op.and]: [ { [Op.literal]: '1=0' } ] };
    }

    // Si on a plusieurs règles positives, c'est un OR
    return conditions.length === 1 ? conditions[0] : { [Op.or]: conditions };
};

/**
 * Traduit une structure de conditions style MongoDB en Sequelize.
 * Gère $in, les égalités simples, et les objets imbriqués.
 */
function translateConditions(conditions) {
    const where = {};

    for (const [key, value] of Object.entries(conditions)) {
        if (value && typeof value === 'object') {
            if (value.$in) {
                where[key] = { [Op.in]: value.$in };
            } else if (value.$eq) {
                where[key] = value.$eq;
            } else {
                // Récursion pour les objets imbriqués (ex: { site: { companyId: 1 } })
                // Sequelize supporte le dot-notation dans certains cas, sinon on aplatit
                where[key] = translateConditions(value);
            }
        } else {
            // Égalité simple
            where[key] = value;
        }
    }

    return where;
}
