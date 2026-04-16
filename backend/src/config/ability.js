import { AbilityBuilder, createMongoAbility } from '@casl/ability';

/**
 * Définit les capacités (Abilities) pour un utilisateur donné.
 * @param {Object} user - L'instance Sequelize de l'utilisateur avec ses rôles et permissions inclus.
 * @returns {import('@casl/ability').PureAbility}
 */
export const defineAbilitiesFor = (user) => {
  const { can, build } = new AbilityBuilder(createMongoAbility);

  if (!user) return build();

  // Les administrateurs ont tous les droits
  const isAdmin = user.roles && user.roles.some(role => role.name === 'ADMINISTRATOR');
  if (isAdmin) {
    can('manage', 'all');
    return build();
  }

  // On itère sur tous les rôles de l'utilisateur
  if (user.roles) {
    user.roles.forEach(role => {
      if (role.permissions) {
        role.permissions.forEach(permission => {
          // Extraction de l'action et du sujet (compatible avec la migration progressive)
          const action = permission.action || permission.code?.split(':')[1]?.toLowerCase() || 'read';
          const subject = permission.subject || permission.code?.split(':')[0]?.charAt(0).toUpperCase() + permission.code?.split(':')[0]?.slice(1).toLowerCase() || 'all';

          let conditions = permission.conditions;
          
          // Substitution dynamique des variables utilisateur dans les conditions
          if (conditions) {
            conditions = parseConditions(conditions, user);
          }

          can(action, subject, conditions);
        });
      }
    });
  }

  return build();
};

/**
 * Remplace les placeholders comme "${user.siteId}" par les valeurs réelles de l'utilisateur.
 * Supporte les structures imbriquées et les tableaux pour l'opérateur $in.
 */
function parseConditions(conditions, user) {
  const strConditions = JSON.stringify(conditions);
  
  const replacements = {
    '${user.userId}': user.userId,
    '${user.siteId}': user.siteId,
    '${user.companyId}': user.companyId,
    '${user.assignedQueueId}': user.assignedQueueId,
    '${user.assignedQueueIds}': JSON.stringify(user.queues?.map(q => q.queueId) || [])
  };

  let result = strConditions;
  Object.keys(replacements).forEach(key => {
    const value = replacements[key];
    // Si la valeur est un tableau (utilisé avec $in), on enlève les guillemets autour du placeholder
    if (key === '${user.assignedQueueIds}') {
      result = result.replace(`"${key}"`, value);
    } else {
      result = result.replace(key, value);
    }
  });

  return JSON.parse(result);
}
