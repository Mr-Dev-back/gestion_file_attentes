import { sequelize } from '../config/database.js';
import User from './User.js';
import Role from './Role.js';
import Permission from './Permission.js';
import Resource from './Resource.js';
import Action from './Action.js';
import RolePermission from './RolePermission.js';
import RoleHasPermission from './RoleHasPermission.js';
import ModelHasRole from './ModelHasRole.js';
import ModelHasPermission from './ModelHasPermission.js';
import Company from './Company.js';
import Site from './Site.js';
import Queue from './Queue.js';
import Category from './Category.js';
import CategoryQueue from './CategoryQueue.js';
import Workflow from './Workflow.js';
import WorkflowStep from './WorkflowStep.js';
import WorkflowTransition from './WorkflowTransition.js';
import QuaiConfig from './QuaiConfig.js';
import QuaiParameter from './QuaiParameter.js';
import QuaiQueue from './QuaiQueue.js';
import WorkflowStepQueue from './WorkflowStepQueue.js';
import StepParameter from './StepParameter.js';
import TicketStep from './TicketStep.js';
import Kiosk from './Kiosk.js';
import KioskQueue from './KioskQueue.js';
import KioskActivity from './KioskActivity.js';
import Ticket from './Ticket.js';
import TicketVehicleInfo from './TicketVehicleInfo.js';
import TicketLogistic from './TicketLogistic.js';
import TicketActionLog from './TicketActionLog.js';
import UserSite from './UserSite.js';
import UserQueue from './UserQueue.js';
import UserRole from './UserRole.js';
import AuditLog from './AuditLog.js';
import RefreshToken from './RefreshToken.js';
import SystemSetting from './SystemSetting.js';
import UserPasswordReset from './UserPasswordReset.js';
import LoginHistory from './LoginHistory.js';
import TransitionAllowedRole from './TransitionAllowedRole.js';

const RBAC_MODEL_TYPE = 'User';

// ==========================================
// Organisation & Auth (Spatie-inspired RBAC)
// ==========================================

User.belongsTo(Role, {
  foreignKey: 'roleId',
  as: 'assignedRole',
  constraints: false
});
Role.hasMany(User, {
  foreignKey: 'roleId',
  as: 'assignedUsers',
  constraints: false
});

User.belongsToMany(Role, {
  through: {
    model: ModelHasRole,
    scope: { modelType: RBAC_MODEL_TYPE }
  },
  foreignKey: 'modelId',
  otherKey: 'roleId',
  as: 'roles',
  constraints: false
});
Role.belongsToMany(User, {
  through: {
    model: ModelHasRole,
    scope: { modelType: RBAC_MODEL_TYPE }
  },
  foreignKey: 'roleId',
  otherKey: 'modelId',
  as: 'users',
  constraints: false
});

User.belongsToMany(Permission, {
  through: {
    model: ModelHasPermission,
    scope: { modelType: RBAC_MODEL_TYPE }
  },
  foreignKey: 'modelId',
  otherKey: 'permissionId',
  as: 'directPermissions',
  constraints: false
});
Permission.belongsToMany(User, {
  through: {
    model: ModelHasPermission,
    scope: { modelType: RBAC_MODEL_TYPE }
  },
  foreignKey: 'permissionId',
  otherKey: 'modelId',
  as: 'users',
  constraints: false
});

Role.belongsToMany(Permission, {
  through: RoleHasPermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions'
});
Permission.belongsToMany(Role, {
  through: RoleHasPermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles'
});

Permission.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resourceObj' });
Resource.hasMany(Permission, { foreignKey: 'resourceId', as: 'permissions' });

Permission.belongsTo(Action, { foreignKey: 'actionId', as: 'actionObj' });
Action.hasMany(Permission, { foreignKey: 'actionId', as: 'permissions' });

User.belongsTo(Site, { foreignKey: 'siteId', as: 'site' });
Site.hasMany(User, { foreignKey: 'siteId', as: 'siteUsers' });

User.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(User, { foreignKey: 'companyId', as: 'users' });

User.belongsTo(Queue, { foreignKey: 'assignedQueueId', as: 'queue' });
Queue.hasMany(User, { foreignKey: 'assignedQueueId', as: 'assignedUsers' });

User.belongsToMany(Site, { through: UserSite, foreignKey: 'userId', as: 'sites' });
Site.belongsToMany(User, { through: UserSite, foreignKey: 'siteId', as: 'users' });

User.belongsToMany(Queue, { through: UserQueue, foreignKey: 'userId', as: 'queues' });
Queue.belongsToMany(User, { through: UserQueue, foreignKey: 'queueId', as: 'agents' });

Site.belongsTo(Company, { foreignKey: 'companyId', as: 'company', onDelete: 'CASCADE' });
Company.hasMany(Site, { foreignKey: 'companyId', as: 'sites', onDelete: 'CASCADE' });

// ==========================================
// Workflow & Configuration
// ==========================================

Site.belongsTo(Workflow, { foreignKey: 'workflowId', as: 'workflow' });
Workflow.hasMany(Site, { foreignKey: 'workflowId', as: 'sites' });

WorkflowStep.belongsTo(Workflow, { foreignKey: 'workflowId', as: 'workflow' });
Workflow.hasMany(WorkflowStep, { foreignKey: 'workflowId', as: 'steps' });

WorkflowStep.belongsToMany(Queue, { through: WorkflowStepQueue, foreignKey: 'stepId', as: 'queues' });
Queue.belongsToMany(WorkflowStep, { through: WorkflowStepQueue, foreignKey: 'queueId', as: 'steps' });

WorkflowTransition.belongsTo(Workflow, { foreignKey: 'workflowId', as: 'workflow' });
Workflow.hasMany(WorkflowTransition, { foreignKey: 'workflowId', as: 'transitions' });

WorkflowTransition.belongsTo(WorkflowStep, { foreignKey: 'fromStepId', as: 'fromStep' });
WorkflowTransition.belongsTo(WorkflowStep, { foreignKey: 'toStepId', as: 'toStep' });

QuaiConfig.belongsTo(Site, { foreignKey: 'siteId', as: 'site' });
QuaiConfig.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Site.hasMany(QuaiConfig, { foreignKey: 'siteId', as: 'quais' });
Category.hasMany(QuaiConfig, { foreignKey: 'categoryId', as: 'quais' });

StepParameter.belongsTo(WorkflowStep, { foreignKey: 'stepId', as: 'step' });
StepParameter.belongsTo(QuaiConfig, { foreignKey: 'quaiId', as: 'quai' });
WorkflowStep.hasMany(StepParameter, { foreignKey: 'stepId', as: 'parameters' });
QuaiConfig.hasMany(StepParameter, { foreignKey: 'quaiId', as: 'parameters' });

TicketStep.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });
TicketStep.belongsTo(WorkflowStep, { foreignKey: 'stepId', as: 'step' });
Ticket.hasMany(TicketStep, { foreignKey: 'ticketId', as: 'ticketSteps' });

Category.belongsToMany(Queue, { through: CategoryQueue, foreignKey: 'categoryId', as: 'queues' });
Queue.belongsToMany(Category, { through: CategoryQueue, foreignKey: 'queueId', as: 'categories' });

Queue.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Queue, { foreignKey: 'categoryId', as: 'queuesList' });

Queue.belongsTo(WorkflowStep, { foreignKey: 'stepId', as: 'step' });
WorkflowStep.hasMany(Queue, { foreignKey: 'stepId', as: 'stepQueues' });

Queue.belongsTo(QuaiParameter, { foreignKey: 'quaiId', as: 'quai' });
QuaiParameter.hasMany(Queue, { foreignKey: 'quaiId', as: 'quaiQueues' });

Queue.belongsTo(Site, { foreignKey: 'siteId', as: 'site' });
Site.hasMany(Queue, { foreignKey: 'siteId', as: 'queues' });

// ==========================================
// Hardware
// ==========================================

Kiosk.belongsTo(Site, { foreignKey: 'siteId', as: 'site' });
Site.hasMany(Kiosk, { foreignKey: 'siteId', as: 'kiosks' });

Kiosk.belongsToMany(Queue, { through: KioskQueue, foreignKey: 'kioskId', as: 'queues' });
Queue.belongsToMany(Kiosk, { through: KioskQueue, foreignKey: 'queueId', as: 'kiosks' });

KioskActivity.belongsTo(Kiosk, { foreignKey: 'kioskId', as: 'kiosk' });
Kiosk.hasMany(KioskActivity, { foreignKey: 'kioskId', as: 'activities' });

// ==========================================
// Ticket Ecosystem
// ==========================================

Ticket.belongsTo(Site, { foreignKey: 'siteId', as: 'site' });
Ticket.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Ticket.belongsTo(WorkflowStep, { foreignKey: 'currentStepId', as: 'currentStep' });
Ticket.belongsTo(Queue, { foreignKey: 'queueId', as: 'queue' });
Ticket.belongsTo(User, { foreignKey: 'calledBy', as: 'caller', onDelete: 'SET NULL' });

Ticket.hasOne(TicketVehicleInfo, { foreignKey: 'ticketId', as: 'vehicleInfo' });
TicketVehicleInfo.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });

Ticket.hasOne(TicketLogistic, { foreignKey: 'ticketId', as: 'logistic' });
TicketLogistic.belongsTo(Ticket, { foreignKey: 'ticketId' });

TicketActionLog.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });
Ticket.hasMany(TicketActionLog, { foreignKey: 'ticketId', as: 'actionLogs' });

TicketActionLog.belongsTo(WorkflowStep, { foreignKey: 'stepId', as: 'step' });
TicketActionLog.belongsTo(User, { foreignKey: 'agentId', as: 'agent', onDelete: 'SET NULL' });

// ==========================================
// User Support Tables
// ==========================================

AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'SET NULL' });
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs', onDelete: 'SET NULL' });

RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens', onDelete: 'CASCADE' });

UserPasswordReset.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
User.hasMany(UserPasswordReset, { foreignKey: 'userId', as: 'passwordResets', onDelete: 'CASCADE' });

LoginHistory.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
User.hasMany(LoginHistory, { foreignKey: 'userId', as: 'loginHistories', onDelete: 'CASCADE' });

QuaiParameter.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
QuaiParameter.belongsTo(WorkflowStep, { foreignKey: 'stepId', as: 'step' });
QuaiParameter.belongsToMany(Queue, { through: QuaiQueue, foreignKey: 'quaiId', as: 'queues' });
Queue.belongsToMany(QuaiParameter, { through: QuaiQueue, foreignKey: 'queueId', as: 'quais' });

export {
  sequelize,
  User,
  Role,
  Permission,
  RolePermission,
  RoleHasPermission,
  ModelHasRole,
  ModelHasPermission,
  Company,
  Site,
  Queue,
  Category,
  CategoryQueue,
  Workflow,
  WorkflowStep,
  WorkflowTransition,
  WorkflowStepQueue,
  QuaiConfig,
  QuaiParameter,
  QuaiQueue,
  StepParameter,
  TicketStep,
  Kiosk,
  KioskQueue,
  KioskActivity,
  Ticket,
  TicketActionLog,
  TicketVehicleInfo,
  TicketLogistic,
  UserSite,
  UserQueue,
  UserRole,
  AuditLog,
  RefreshToken,
  SystemSetting,
  UserPasswordReset,
  LoginHistory,
  TransitionAllowedRole,
  Resource,
  Action
};
