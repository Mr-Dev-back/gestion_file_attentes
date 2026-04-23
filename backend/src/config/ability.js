import { AbilityBuilder, createMongoAbility } from '@casl/ability';

/**
 * [SENIOR NOTE] 
 * Ce fichier gère la conversion des permissions DB (Spatie-like) en règles CASL (Frontend/Logic).
 * Les permissions sont extraites de l'utilisateur (Rôles + Directes).
 */

const DEFAULT_GUARD = 'api';

/**
 * Normalise les noms de sujets (slug -> PascalCase)
 * EX: 'USER_LOGS' -> 'UserLogs'
 */
const toSubjectName = (value) => {
  if (!value || value === 'all' || value === '*') return 'all';

  return String(value)
    .toLowerCase()
    .split(/[_:\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
};

/**
 * Remplace les variables dynamiques dans les conditions de permission.
 * EX: { "siteId": "${user.siteId}" } -> { "siteId": "uuid-du-site" }
 */
const replacePlaceholders = (value, user) => {
  if (typeof value === 'string') {
    const replacements = {
      '${user.userId}': user.userId,
      '${user.siteId}': user.siteId,
      '${user.companyId}': user.companyId,
      '${user.assignedQueueId}': user.assignedQueueId,
      '${user.assignedQueueIds}': user.queues?.map((q) => q.queueId) || []
    };

    if (Object.prototype.hasOwnProperty.call(replacements, value)) {
      return replacements[value];
    }

    return value.replace(/\$\{user\.[^}]+\}/g, (match) => {
      const replacement = replacements[match];
      return replacement === undefined ? match : replacement;
    });
  }

  if (Array.isArray(value)) {
    return value.map((entry) => replacePlaceholders(entry, user));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, replacePlaceholders(entry, user)])
    );
  }

  return value;
};

/**
 * Convertit une permission DB en objet exploitable par AbilityBuilder.
 */
const normalizePermission = (permission, user) => {
  const code = permission.code || permission.name || null;
  const [codeSubject, codeAction] = code?.split(':') || [];

  return {
    action: permission.action || codeAction?.toLowerCase() || 'read',
    subject: permission.subject || toSubjectName(permission.resourceObj?.slug || codeSubject),
    conditions: permission.conditions ? replacePlaceholders(permission.conditions, user) : undefined
  };
};

/**
 * Inclusions Sequelize pour charger tout le nécessaire RBAC en une requête.
 */
export const rbacPermissionInclude = {
  association: 'permissions',
  through: { attributes: [] }
};

export const rbacUserAuthorizationInclude = [
  {
    association: 'roles',
    through: { attributes: [] },
    include: [rbacPermissionInclude]
  },
  {
    association: 'directPermissions',
    through: { attributes: [] }
  },
  {
    association: 'assignedRole',
    include: [rbacPermissionInclude]
  }
];

/**
 * Extrait les objets de permission uniques d'un utilisateur.
 */
export const extractUserPermissions = (user) => {
  const unique = new Map();
  
  // Rôles multiples (Nouveau Spatie)
  const rolePermissions = (user.roles || []).flatMap((role) => role.permissions || []);
  
  // Rôle principal (Compatibilité legacy)
  const assignedRolePermissions = user.assignedRole?.permissions || [];
  
  // Permissions directes (Nouveau Spatie)
  const directPermissions = user.directPermissions || [];

  [...rolePermissions, ...assignedRolePermissions, ...directPermissions].forEach((p) => {
    if (!p) return;
    const key = p.permissionId || p.code || p.name;
    if (key && !unique.has(key)) unique.set(key, p);
  });

  return Array.from(unique.values());
};

/**
 * Extrait uniquement les noms/codes de permissions pour le frontend.
 */
export const extractPermissionNames = (user) => {
  return [...new Set(
    extractUserPermissions(user)
      .flatMap((p) => [p.code, p.name])
      .filter(Boolean)
  )];
};

/**
 * Définit les capacités CASL basées sur les données utilisateur.
 */
export const defineAbilitiesFor = (user) => {
  const { can, build } = new AbilityBuilder(createMongoAbility);

  if (!user) return build();

  // Vérification Administration
  const roles = user.roles?.length ? user.roles : user.assignedRole ? [user.assignedRole] : [];
  const isAdmin = roles.some((r) => r.name === 'ADMINISTRATOR');

  if (isAdmin) {
    can('manage', 'all');
    return build();
  }

  // Application des permissions granulaires
  extractUserPermissions(user)
    .filter((p) => !p.guardName || p.guardName === DEFAULT_GUARD)
    .forEach((p) => {
      const { action, subject, conditions } = normalizePermission(p, user);
      can(action, subject, conditions);
    });

  return build();
};
