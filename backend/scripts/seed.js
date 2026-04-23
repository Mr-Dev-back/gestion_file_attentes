import bcrypt from 'bcrypt';
import { sequelize } from '../config/database.js';
import logger from '../config/logger.js';
import {
  Role, Permission, User
} from '../models/index.js';

async function seed() {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    logger.info('--- ⚠️ Reset Complet & Seeding Industriel GesParc ---');

    // 0. Reset complet de la base de données
    // force: true supprime les tables et les recrée
    await sequelize.sync({ force: true });
    logger.info('✓ Base de données réinitialisée à zéro.');

    // 1. Création des 19 Permissions (RBAC)
    const permissionsData = [
      { code: 'config:admin', resource: 'config', action: 'manage', description: 'Configuration système' },
      { code: 'user:manage', resource: 'user', action: 'manage', description: 'Gestion des utilisateurs' },
      { code: 'workflow:design', resource: 'workflow', action: 'design', description: 'Créer les étapes du workflow' },
      { code: 'site:manage', resource: 'site', action: 'manage', description: 'Gérer les sites géographiques' },
      { code: 'company:manage', resource: 'company', action: 'manage', description: 'Gérer les sociétés' },
      { code: 'quai:manage', resource: 'quai', action: 'manage', description: 'Configurer les quais' },
      { code: 'kiosk:manage', resource: 'kiosk', action: 'manage', description: 'Gérer les bornes tickets' },
      { code: 'monitor:global', resource: 'monitoring', action: 'global', description: 'Cartographie multi-sites' },
      { code: 'monitor:site', resource: 'monitoring', action: 'site', description: 'Vue synoptique du site' },
      { code: 'track:search', resource: 'tracking', action: 'search', description: 'Rechercher un véhicule' },
      { code: 'stats:read', resource: 'stats', action: 'read', description: 'Consulter les statistiques' },
      { code: 'audit:read', resource: 'audit', action: 'read', description: 'Consulter les journaux d\'activité' },
      { code: 'report:export', resource: 'report', action: 'export', description: 'Exporter les rapports' },
      { code: 'ticket:create', resource: 'ticket', action: 'create', description: 'Créer des tickets' },
      { code: 'ticket:status', resource: 'ticket', action: 'status', description: 'Appeler/Traiter un ticket' },
      { code: 'ticket:priority', resource: 'ticket', action: 'priority', description: 'Gérer les urgences' },
      { code: 'ticket:transfert', resource: 'ticket', action: 'transfert', description: 'Transférer entre files' },
      { code: 'ticket:recall', resource: 'ticket', action: 'recall', description: 'Rappeler un véhicule' },
      { code: 'queue:read', resource: 'queue', action: 'read', description: 'Voir les files d\'attente' }
    ];
    const permissions = await Permission.bulkCreate(permissionsData, { transaction });
    logger.info(`✓ ${permissions.length} permissions injectées.`);

    // 2. Création des Rôles avec Scopes
    const roleAdmin = await Role.create({ name: 'ADMINISTRATOR', description: 'Accès total système', scope: 'GLOBAL' }, { transaction });
    const roleManager = await Role.create({ name: 'MANAGER', description: 'Pilotage société', scope: 'COMPANY' }, { transaction });
    const roleSupervisor = await Role.create({ name: 'SUPERVISOR', description: 'Gestionnaire de site', scope: 'SITE' }, { transaction });
    const roleAgent = await Role.create({ name: 'AGENT_QUAI', description: 'Opérateur de quai', scope: 'SITE' }, { transaction });

    // 3. Assignation des Permissions
    await roleAdmin.setPermissions(permissions, { transaction });

    const managerCodes = ['monitor:global', 'monitor:site', 'stats:read', 'report:export', 'audit:read', 'queue:read', 'track:search', 'ticket:recall'];
    await roleManager.setPermissions(permissions.filter(p => managerCodes.includes(p.code)), { transaction });

    const supervisorCodes = ['monitor:site', 'track:search', 'ticket:priority', 'ticket:transfert', 'ticket:recall', 'queue:read', 'stats:read'];
    await roleSupervisor.setPermissions(permissions.filter(p => supervisorCodes.includes(p.code)), { transaction });

    const agentCodes = ['ticket:status', 'ticket:transfert', 'queue:read'];
    await roleAgent.setPermissions(permissions.filter(p => agentCodes.includes(p.code)), { transaction });
    
    logger.info('✓ Rôles et matrices de permissions configurés.');


    // 5. Création des Utilisateurs types
    const salt = await bcrypt.genSalt(10);
    const commonPassword = await bcrypt.hash('Sibmlab@1014', salt);

    const usersData = [
      {
        username: 'Kei Frejuste',
        email: 'stagiaire.info@sibmci.com',
        password: commonPassword,
        roleId: roleAdmin.roleId,
        firstName: 'Kei', lastName: 'Frejuste',
        isActive: true
      }
    ];

    await User.bulkCreate(usersData, { transaction });
    logger.info(`✓ ${usersData.length} utilisateurs de test créés.`);

    await transaction.commit();
    logger.info('🚀 SEEDING TERMINÉ AVEC SUCCÈS !');
    process.exit(0);
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error('❌ ERREUR CRITIQUE DURANT LE SEEDING:', error);
    process.exit(1);
  }
}

seed();