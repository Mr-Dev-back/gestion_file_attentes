-- ============================================================
-- GesParc — Gestion de Flotte Automobile
-- Schéma PostgreSQL — Conventions camelCase
-- ============================================================
-- Conventions :
--   Tables    : singulier PascalCase       (User, Ticket, Site…)
--   Colonnes  : camelCase                  (createdAt, isActive…)
--   PK        : <entité>Id                 (userId, ticketId…)
--   FK        : <entité>Id                 (correspond à la PK cible)
--   Contraintes : <table>_<col>_<type>     (snake_case pour SQL)
--   PK pivots : PK composite (pas de surrogate key)
--
-- PostgreSQL : 15+
-- Exécution  : psql -U <user> -d <dbname> -v ON_ERROR_STOP=1 -f gfa_schema.sql
-- ============================================================

BEGIN;

-- ============================================================
-- 0. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. TYPES ENUM
-- ============================================================

CREATE TYPE public.enum_role_scope AS ENUM (
    'GLOBAL', 'COMPANY', 'SITE'
);

CREATE TYPE public.enum_userSite_status AS ENUM (
    'ACTIVE', 'SUSPENDED'
);

CREATE TYPE public.enum_ticket_status AS ENUM (
    'EN_ATTENTE', 'APPELE', 'EN_TRAITEMENT',
    'EN_PAUSE', 'TRANSFERE', 'COMPLETE', 'ABANDONNE', 'ANNULE'
);

CREATE TYPE public.enum_ticket_priority AS ENUM (
    'BASSE', 'NORMAL', 'HAUTE', 'URGENTE'
);

CREATE TYPE public.enum_ticketHistory_event AS ENUM (
    'CREATED', 'CALLED', 'RECALLED', 'TRANSFERRED',
    'REDIRECTED', 'PRIORITY_SET', 'ON_HOLD', 'RESUMED',
    'COMPLETED', 'ABANDONED', 'CANCELLED', 'PRINTED'
);

CREATE TYPE public.enum_kiosk_type AS ENUM (
    'ENTRANCE', 'EXIT', 'SERVICE', 'INFO'
);

CREATE TYPE public.enum_kiosk_status AS ENUM (
    'ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR'
);

CREATE TYPE public.enum_kioskActivity_severity AS ENUM (
    'INFO', 'WARNING', 'ERROR', 'CRITICAL'
);

CREATE TYPE public.enum_loginHistory_status AS ENUM (
    'SUCCESS', 'FAILED', 'LOCKED', 'MFA_REQUIRED'
);

CREATE TYPE public.enum_notification_type AS ENUM (
    'TICKET_CALLED', 'TICKET_CREATED', 'QUEUE_ALERT',
    'SYSTEM_ALERT', 'PASSWORD_RESET'
);

CREATE TYPE public.enum_notification_channel AS ENUM (
    'SMS', 'EMAIL', 'PUSH', 'WEBSOCKET'
);

CREATE TYPE public.enum_notification_status AS ENUM (
    'PENDING', 'SENT', 'FAILED', 'SKIPPED'
);

CREATE TYPE public.enum_systemSetting_type AS ENUM (
    'STRING', 'INTEGER', 'BOOLEAN', 'JSON', 'DECIMAL'
);

CREATE TYPE public.enum_systemSetting_scope AS ENUM (
    'GLOBAL', 'COMPANY', 'SITE'
);

-- ============================================================
-- 2. DOMAINE ORGANISATION
-- ============================================================

-- ----------------------------------------------------------
-- Company
-- ----------------------------------------------------------
CREATE TABLE public."Company" (
    "companyId"   UUID         NOT NULL DEFAULT gen_random_uuid(),
    "name"        VARCHAR(255) NOT NULL,
    "code"        VARCHAR(50),
    "description" VARCHAR(500),
    "isActive"    BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT "Company_pkey"     PRIMARY KEY ("companyId"),
    CONSTRAINT "Company_name_key" UNIQUE ("name"),
    CONSTRAINT "Company_code_key" UNIQUE ("code")
);

COMMENT ON TABLE  public."Company"       IS 'Entreprises clientes — niveau racine du modèle multi-tenant';
COMMENT ON COLUMN public."Company"."code" IS 'Code court unique utilisé dans les intégrations externes';

-- ----------------------------------------------------------
-- Role
-- ----------------------------------------------------------
CREATE TABLE public."Role" (
    "roleId"      UUID                       NOT NULL DEFAULT gen_random_uuid(),
    "name"        VARCHAR(100)               NOT NULL,
    "description" VARCHAR(500),
    "scope"       public.enum_role_scope     NOT NULL DEFAULT 'SITE',
    "createdAt"   TIMESTAMPTZ                NOT NULL DEFAULT now(),
    "updatedAt"   TIMESTAMPTZ                NOT NULL DEFAULT now(),
    CONSTRAINT "Role_pkey"     PRIMARY KEY ("roleId"),
    CONSTRAINT "Role_name_key" UNIQUE ("name")
);

COMMENT ON TABLE  public."Role"        IS 'Rôles applicatifs avec portée (GLOBAL, COMPANY, SITE)';
COMMENT ON COLUMN public."Role"."scope" IS 'GLOBAL = toutes entreprises, COMPANY = une entreprise, SITE = un site';

-- ----------------------------------------------------------
-- Permission
-- ----------------------------------------------------------
CREATE TABLE public."Permission" (
    "permissionId" UUID         NOT NULL DEFAULT gen_random_uuid(),
    "code"         VARCHAR(100) NOT NULL,
    "resource"     VARCHAR(100) NOT NULL,
    "action"       VARCHAR(100) NOT NULL,
    "description"  VARCHAR(500),
    "createdAt"    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updatedAt"    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT "Permission_pkey"                   PRIMARY KEY ("permissionId"),
    CONSTRAINT "Permission_code_key"               UNIQUE ("code"),
    CONSTRAINT "Permission_resource_action_key"    UNIQUE ("resource", "action")
);

COMMENT ON COLUMN public."Permission"."code"     IS 'Code mnémotechnique ex: TICKETS_READ, USERS_MANAGE';
COMMENT ON COLUMN public."Permission"."resource" IS 'Ressource concernée ex: tickets, users, queues';
COMMENT ON COLUMN public."Permission"."action"   IS 'Action ex: READ, CREATE, UPDATE, DELETE, CALL';

-- ----------------------------------------------------------
-- RolePermission  (pivot Role ↔ Permission)
-- ----------------------------------------------------------
CREATE TABLE public."RolePermission" (
    "roleId"       UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId")
);

-- ----------------------------------------------------------
-- User
-- ----------------------------------------------------------
CREATE TABLE public."User" (
    "userId"               UUID         NOT NULL DEFAULT gen_random_uuid(),
    "roleId"               UUID,
    "username"             VARCHAR(100) NOT NULL,
    "email"                VARCHAR(255) NOT NULL,
    "hashedPassword"       VARCHAR(255) NOT NULL,
    "isActive"             BOOLEAN      NOT NULL DEFAULT true,
    "failedLoginAttempts"  SMALLINT     NOT NULL DEFAULT 0,
    "lockUntil"            TIMESTAMPTZ,
    "lastLoginAt"          TIMESTAMPTZ,
    "createdAt"            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updatedAt"            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT "User_pkey"                    PRIMARY KEY ("userId"),
    CONSTRAINT "User_email_key"               UNIQUE ("email"),
    CONSTRAINT "User_username_key"            UNIQUE ("username"),
    CONSTRAINT "User_failedLoginAttempts_check" CHECK ("failedLoginAttempts" >= 0)
);

COMMENT ON COLUMN public."User"."failedLoginAttempts" IS 'Réinitialisé à 0 à chaque connexion réussie';
COMMENT ON COLUMN public."User"."lockUntil"           IS 'NULL = compte non verrouillé';
COMMENT ON COLUMN public."User"."hashedPassword"      IS 'Hash bcrypt/argon2 — jamais stocker en clair';

-- ----------------------------------------------------------
-- UserSite  (pivot User ↔ Site — multi-site)
-- FK vers Site ajoutée après création de Site
-- ----------------------------------------------------------
CREATE TABLE public."UserSite" (
    "userId"    UUID                           NOT NULL,
    "siteId"    UUID                           NOT NULL,
    "isDefault" BOOLEAN                        NOT NULL DEFAULT false,
    "status"    public.enum_userSite_status    NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ                    NOT NULL DEFAULT now(),
    CONSTRAINT "UserSite_pkey" PRIMARY KEY ("userId", "siteId")
);

COMMENT ON COLUMN public."UserSite"."isDefault" IS 'Site par défaut à l''ouverture de session — un seul par user';

-- ============================================================
-- 3. DOMAINE WORKFLOW / CONFIGURATION
-- ============================================================

-- ----------------------------------------------------------
-- Workflow
-- ----------------------------------------------------------
CREATE TABLE public."Workflow" (
    "workflowId"  UUID         NOT NULL DEFAULT gen_random_uuid(),
    "name"        VARCHAR(255) NOT NULL,
    "description" TEXT,
    "isActive"    BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT "Workflow_pkey"     PRIMARY KEY ("workflowId"),
    CONSTRAINT "Workflow_name_key" UNIQUE ("name")
);

COMMENT ON TABLE public."Workflow" IS 'Définition des flux de traitement (séquences d''étapes)';

-- ----------------------------------------------------------
-- Site  (dépend de Company et Workflow)
-- ----------------------------------------------------------
CREATE TABLE public."Site" (
    "siteId"             UUID         NOT NULL DEFAULT gen_random_uuid(),
    "companyId"          UUID         NOT NULL,
    "workflowId"         UUID,
    "name"               VARCHAR(255) NOT NULL,
    "code"               VARCHAR(50),
    "isActive"           BOOLEAN      NOT NULL DEFAULT true,
    "isMonoUserProcess"  BOOLEAN      NOT NULL DEFAULT false,
    "alertThresholdMin"  SMALLINT     NOT NULL DEFAULT 45,
    "createdAt"          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updatedAt"          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT "Site_pkey"          PRIMARY KEY ("siteId"),
    CONSTRAINT "Site_code_key"      UNIQUE ("code"),
    CONSTRAINT "Site_alert_check"   CHECK ("alertThresholdMin" > 0 AND "alertThresholdMin" <= 1440)
);

COMMENT ON COLUMN public."Site"."workflowId"        IS 'Workflow par défaut du site — surchargé par Queue si besoin';
COMMENT ON COLUMN public."Site"."alertThresholdMin" IS 'Seuil d''alerte temps d''attente en minutes (1–1440)';
COMMENT ON COLUMN public."Site"."isMonoUserProcess" IS 'Si true : un seul agent actif à la fois sur ce site';

-- ----------------------------------------------------------
-- Category
-- ----------------------------------------------------------
CREATE TABLE public."Category" (
    "categoryId"        UUID         NOT NULL DEFAULT gen_random_uuid(),
    "name"              VARCHAR(255) NOT NULL,
    "description"       TEXT,
    "color"             CHAR(7)      NOT NULL DEFAULT '#3b82f6',
    "prefix"            VARCHAR(20)  NOT NULL,
    "estimatedDuration" SMALLINT     NOT NULL DEFAULT 30,
    "isActive"          BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updatedAt"         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT "Category_pkey"             PRIMARY KEY ("categoryId"),
    CONSTRAINT "Category_name_key"         UNIQUE ("name"),
    CONSTRAINT "Category_color_check"      CHECK ("color" ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT "Category_duration_check"   CHECK ("estimatedDuration" > 0)
);

COMMENT ON COLUMN public."Category"."prefix"            IS 'Préfixe du numéro de ticket ex: LIV, RET, ADM';
COMMENT ON COLUMN public."Category"."estimatedDuration" IS 'Durée estimée de traitement en minutes';
COMMENT ON COLUMN public."Category"."color"             IS 'Couleur d''affichage au format #RRGGBB';

-- ----------------------------------------------------------
-- Queue  (dépend de Site et Workflow)
-- ----------------------------------------------------------
CREATE TABLE public."Queue" (
    "queueId"    UUID         NOT NULL DEFAULT gen_random_uuid(),
    "siteId"     UUID         NOT NULL,
    "workflowId" UUID,
    "name"       VARCHAR(255) NOT NULL,
    "priority"   SMALLINT     NOT NULL DEFAULT 0,
    "isActive"   BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updatedAt"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT "Queue_pkey" PRIMARY KEY ("queueId")
);

COMMENT ON COLUMN public."Queue"."priority" IS 'Ordre de traitement — plus élevé = plus prioritaire';

-- ----------------------------------------------------------
-- WorkflowStep  (dépend de Workflow; FK queueId après Queue)
-- ----------------------------------------------------------
CREATE TABLE public."WorkflowStep" (
    "stepId"     UUID         NOT NULL DEFAULT gen_random_uuid(),
    "workflowId" UUID         NOT NULL,
    "queueId"    UUID,
    "name"       VARCHAR(255) NOT NULL,
    "code"       VARCHAR(50),
    "stepOrder"  SMALLINT     NOT NULL DEFAULT 0,
    "color"      CHAR(7)      NOT NULL DEFAULT '#808080',
    "isInitial"  BOOLEAN      NOT NULL DEFAULT false,
    "isFinal"    BOOLEAN      NOT NULL DEFAULT false,
    "createdAt"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updatedAt"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT "WorkflowStep_pkey"        PRIMARY KEY ("stepId"),
    CONSTRAINT "WorkflowStep_color_check" CHECK ("color" ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT "WorkflowStep_order_check" CHECK ("stepOrder" >= 0)
);

COMMENT ON COLUMN public."WorkflowStep"."code"      IS 'Code normalisé ex: WAITING, LOADING, UNLOADING, DONE';
COMMENT ON COLUMN public."WorkflowStep"."isInitial" IS 'Une seule étape initiale par workflow (index unique partiel)';

-- ----------------------------------------------------------
-- WorkflowTransition  (dépend de Workflow et WorkflowStep)
-- ----------------------------------------------------------
CREATE TABLE public."WorkflowTransition" (
    "transitionId" UUID        NOT NULL DEFAULT gen_random_uuid(),
    "workflowId"   UUID        NOT NULL,
    "fromStepId"   UUID        NOT NULL,
    "toStepId"     UUID        NOT NULL,
    "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "WorkflowTransition_pkey"      PRIMARY KEY ("transitionId"),
    CONSTRAINT "WorkflowTransition_no_loop"   CHECK ("fromStepId" <> "toStepId"),
    CONSTRAINT "WorkflowTransition_uniq_pair" UNIQUE ("workflowId", "fromStepId", "toStepId")
);

COMMENT ON TABLE public."WorkflowTransition" IS 'Arcs du graphe de workflow — transitions autorisées entre étapes';

-- ----------------------------------------------------------
-- TransitionAllowedRole  (pivot WorkflowTransition ↔ Role)
-- ----------------------------------------------------------
CREATE TABLE public."TransitionAllowedRole" (
    "transitionId" UUID NOT NULL,
    "roleId"       UUID NOT NULL,
    CONSTRAINT "TransitionAllowedRole_pkey" PRIMARY KEY ("transitionId", "roleId")
);

COMMENT ON TABLE public."TransitionAllowedRole" IS 'Rôles autorisés à déclencher une transition';

-- ----------------------------------------------------------
-- CategoryQueue  (pivot Category ↔ Queue)
-- ----------------------------------------------------------
CREATE TABLE public."CategoryQueue" (
    "categoryId"  UUID        NOT NULL,
    "queueId"     UUID        NOT NULL,
    "maxCapacity" INTEGER,
    "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "CategoryQueue_pkey"        PRIMARY KEY ("categoryId", "queueId"),
    CONSTRAINT "CategoryQueue_cap_check"   CHECK ("maxCapacity" IS NULL OR "maxCapacity" > 0)
);

COMMENT ON COLUMN public."CategoryQueue"."maxCapacity" IS 'NULL = capacité illimitée';

-- ----------------------------------------------------------
-- Kiosk  (dépend de Site)
-- ----------------------------------------------------------
CREATE TABLE public."Kiosk" (
    "kioskId"    UUID                     NOT NULL DEFAULT gen_random_uuid(),
    "siteId"     UUID                     NOT NULL,
    "name"       VARCHAR(255)             NOT NULL,
    "type"       public.enum_kiosk_type   NOT NULL DEFAULT 'ENTRANCE',
    "status"     public.enum_kiosk_status NOT NULL DEFAULT 'OFFLINE',
    "ipAddress"  INET,
    "macAddress" MACADDR,
    "hasPrinter" BOOLEAN                  NOT NULL DEFAULT false,
    "hasCamera"  BOOLEAN                  NOT NULL DEFAULT false,
    "hasScanner" BOOLEAN                  NOT NULL DEFAULT false,
    "createdAt"  TIMESTAMPTZ              NOT NULL DEFAULT now(),
    "updatedAt"  TIMESTAMPTZ              NOT NULL DEFAULT now(),
    CONSTRAINT "Kiosk_pkey"    PRIMARY KEY ("kioskId"),
    CONSTRAINT "Kiosk_mac_key" UNIQUE ("macAddress")
);

COMMENT ON COLUMN public."Kiosk"."ipAddress"  IS 'Adresse IP de la borne (type INET : IPv4 et IPv6)';
COMMENT ON COLUMN public."Kiosk"."macAddress" IS 'Adresse MAC — identifiant matériel unique';
COMMENT ON COLUMN public."Kiosk"."hasPrinter" IS 'Capacité matérielle : imprimante thermique';

-- ----------------------------------------------------------
-- KioskQueue  (pivot Kiosk ↔ Queue)
-- ----------------------------------------------------------
CREATE TABLE public."KioskQueue" (
    "kioskId"   UUID    NOT NULL,
    "queueId"   UUID    NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "KioskQueue_pkey" PRIMARY KEY ("kioskId", "queueId")
);

COMMENT ON COLUMN public."KioskQueue"."isDefault" IS 'File sélectionnée par défaut à l''ouverture de la borne';

-- ----------------------------------------------------------
-- KioskActivity  (dépend de Kiosk)
-- ----------------------------------------------------------
CREATE TABLE public."KioskActivity" (
    "kioskActivityId" UUID                               NOT NULL DEFAULT gen_random_uuid(),
    "kioskId"         UUID                               NOT NULL,
    "event"           VARCHAR(100)                       NOT NULL,
    "description"     TEXT,
    "severity"        public.enum_kioskActivity_severity NOT NULL DEFAULT 'INFO',
    "createdAt"       TIMESTAMPTZ                        NOT NULL DEFAULT now(),
    CONSTRAINT "KioskActivity_pkey" PRIMARY KEY ("kioskActivityId")
);

COMMENT ON COLUMN public."KioskActivity"."event" IS 'Code événement normalisé ex: STATUS_CHANGE, PAPER_LOW, RESTART';

-- ----------------------------------------------------------
-- SystemSetting
-- ----------------------------------------------------------
CREATE TABLE public."SystemSetting" (
    "settingId"   UUID                           NOT NULL DEFAULT gen_random_uuid(),
    "key"         VARCHAR(100)                   NOT NULL,
    "value"       TEXT                           NOT NULL,
    "type"        public.enum_systemSetting_type  NOT NULL DEFAULT 'STRING',
    "scope"       public.enum_systemSetting_scope NOT NULL DEFAULT 'GLOBAL',
    "scopeId"     UUID,
    "category"    VARCHAR(100)                   NOT NULL DEFAULT 'GENERAL',
    "description" VARCHAR(500),
    "createdAt"   TIMESTAMPTZ                    NOT NULL DEFAULT now(),
    "updatedAt"   TIMESTAMPTZ                    NOT NULL DEFAULT now(),
    CONSTRAINT "SystemSetting_pkey"       PRIMARY KEY ("settingId"),
    CONSTRAINT "SystemSetting_scope_check" CHECK ("scope" = 'GLOBAL' OR "scopeId" IS NOT NULL)
);

COMMENT ON COLUMN public."SystemSetting"."scopeId" IS 'ID de l''entité ciblée — NULL autorisé uniquement si scope=GLOBAL';

-- ============================================================
-- 4. DOMAINE LOGISTIQUE (Ticket)
-- ============================================================

-- ----------------------------------------------------------
-- Ticket
-- ----------------------------------------------------------
CREATE TABLE public."Ticket" (
    "ticketId"            UUID                        NOT NULL DEFAULT gen_random_uuid(),
    "ticketNumber"        VARCHAR(50)                 NOT NULL,
    "siteId"              UUID                        NOT NULL,
    "companyId"           UUID,
    "queueId"             UUID,
    "stepId"              UUID,
    "createdById"         UUID,
    "calledById"          UUID,
    "status"              public.enum_ticket_status   NOT NULL DEFAULT 'EN_ATTENTE',
    "priority"            public.enum_ticket_priority NOT NULL DEFAULT 'NORMAL',
    "priorityReason"      VARCHAR(255),
    "arrivedAt"           TIMESTAMPTZ                 NOT NULL DEFAULT now(),
    "calledAt"            TIMESTAMPTZ,
    "completedAt"         TIMESTAMPTZ,
    "queuePosition"       INTEGER,
    "currentCategoryIndex" SMALLINT                   NOT NULL DEFAULT 0,
    "createdAt"           TIMESTAMPTZ                 NOT NULL DEFAULT now(),
    "updatedAt"           TIMESTAMPTZ                 NOT NULL DEFAULT now(),
    CONSTRAINT "Ticket_pkey"                    PRIMARY KEY ("ticketId"),
    CONSTRAINT "Ticket_number_key"              UNIQUE ("ticketNumber"),
    CONSTRAINT "Ticket_queuePosition_check"     CHECK ("queuePosition" IS NULL OR "queuePosition" > 0),
    CONSTRAINT "Ticket_catIndex_check"          CHECK ("currentCategoryIndex" >= 0),
    CONSTRAINT "Ticket_calledAfterArrived"      CHECK ("calledAt" IS NULL OR "calledAt" >= "arrivedAt"),
    CONSTRAINT "Ticket_completedAfterCalled"    CHECK (
        "completedAt" IS NULL OR ("calledAt" IS NOT NULL AND "completedAt" >= "calledAt")
    )
);

COMMENT ON COLUMN public."Ticket"."ticketNumber"        IS 'Numéro lisible imprimé sur le ticket ex: LIV-0042';
COMMENT ON COLUMN public."Ticket"."queueId"             IS 'File courante (nullable = ticket non en file)';
COMMENT ON COLUMN public."Ticket"."stepId"              IS 'Étape courante (nullable = workflow non démarré)';
COMMENT ON COLUMN public."Ticket"."currentCategoryIndex" IS 'Index de la catégorie en cours dans TicketCategory';

-- ----------------------------------------------------------
-- TicketVehicleInfo  (1:1 avec Ticket)
-- ----------------------------------------------------------
CREATE TABLE public."TicketVehicleInfo" (
    "ticketId"     UUID         NOT NULL,
    "licensePlate" VARCHAR(20)  NOT NULL,
    "driverName"   VARCHAR(255) NOT NULL,
    "driverPhone"  VARCHAR(30),
    "companyName"  VARCHAR(255),
    CONSTRAINT "TicketVehicleInfo_pkey" PRIMARY KEY ("ticketId")
);

COMMENT ON COLUMN public."TicketVehicleInfo"."companyName" IS 'Snapshot — conservé même si l''entreprise est renommée';

-- ----------------------------------------------------------
-- TicketLogistic  (1:1 avec Ticket)
-- ----------------------------------------------------------
CREATE TABLE public."TicketLogistic" (
    "ticketId"     UUID        NOT NULL,
    "orderNumber"  VARCHAR(100),
    "salesPerson"  VARCHAR(255),
    "qrCode"       TEXT,
    "printedCount" SMALLINT    NOT NULL DEFAULT 0,
    CONSTRAINT "TicketLogistic_pkey"          PRIMARY KEY ("ticketId"),
    CONSTRAINT "TicketLogistic_printed_check" CHECK ("printedCount" >= 0)
);

COMMENT ON COLUMN public."TicketLogistic"."qrCode"       IS 'Contenu encodé dans le QR code imprimé';
COMMENT ON COLUMN public."TicketLogistic"."printedCount" IS 'Nombre de réimpressions (0 = jamais imprimé)';

-- ----------------------------------------------------------
-- TicketCategory  (N:N Ticket ↔ Category)
-- ----------------------------------------------------------
CREATE TABLE public."TicketCategory" (
    "ticketId"   UUID     NOT NULL,
    "categoryId" UUID     NOT NULL,
    "position"   SMALLINT NOT NULL DEFAULT 0,
    CONSTRAINT "TicketCategory_pkey"          PRIMARY KEY ("ticketId", "categoryId"),
    CONSTRAINT "TicketCategory_position_check" CHECK ("position" >= 0)
);

COMMENT ON COLUMN public."TicketCategory"."position" IS 'Ordre de traitement des catégories (0 = première)';

-- ----------------------------------------------------------
-- TicketHistory  (append-only — jamais modifié)
-- ----------------------------------------------------------
CREATE TABLE public."TicketHistory" (
    "ticketHistoryId" UUID                               NOT NULL DEFAULT gen_random_uuid(),
    "ticketId"        UUID                               NOT NULL,
    "actorId"         UUID,
    "event"           public.enum_ticketHistory_event    NOT NULL,
    "fromStatus"      public.enum_ticket_status,
    "toStatus"        public.enum_ticket_status,
    "fromQueueId"     UUID,
    "toQueueId"       UUID,
    "fromStepId"      UUID,
    "toStepId"        UUID,
    "metadata"        JSONB,
    "occurredAt"      TIMESTAMPTZ                        NOT NULL DEFAULT now(),
    CONSTRAINT "TicketHistory_pkey" PRIMARY KEY ("ticketHistoryId")
);

COMMENT ON TABLE  public."TicketHistory"           IS 'Journal append-only des événements métier — immuable';
COMMENT ON COLUMN public."TicketHistory"."actorId" IS 'NULL = action système ou borne (pas d''agent humain)';
COMMENT ON COLUMN public."TicketHistory"."metadata" IS 'Contexte libre : raison, note agent, données custom';

-- ============================================================
-- 5. DOMAINE SÉCURITÉ
-- ============================================================

-- ----------------------------------------------------------
-- RefreshToken
-- ----------------------------------------------------------
CREATE TABLE public."RefreshToken" (
    "refreshTokenId"   UUID         NOT NULL DEFAULT gen_random_uuid(),
    "userId"           UUID         NOT NULL,
    "token"            VARCHAR(255) NOT NULL,
    "expiresAt"        TIMESTAMPTZ  NOT NULL,
    "revoked"          BOOLEAN      NOT NULL DEFAULT false,
    "replacedByToken"  VARCHAR(255),
    "createdAt"        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updatedAt"        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("refreshTokenId")
);

COMMENT ON COLUMN public."RefreshToken"."replacedByToken" IS 'Token suivant dans la chaîne de rotation';

-- ----------------------------------------------------------
-- Session
-- ----------------------------------------------------------
CREATE TABLE public."Session" (
    "sessionId"    UUID         NOT NULL DEFAULT gen_random_uuid(),
    "userId"       UUID         NOT NULL,
    "siteId"       UUID,
    "tokenHash"    VARCHAR(64)  NOT NULL,
    "ipAddress"    INET,
    "userAgent"    TEXT,
    "expiresAt"    TIMESTAMPTZ  NOT NULL,
    "lastActiveAt" TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "revokedAt"    TIMESTAMPTZ,
    "createdAt"    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT "Session_pkey"      PRIMARY KEY ("sessionId"),
    CONSTRAINT "Session_token_key" UNIQUE ("tokenHash")
);

COMMENT ON COLUMN public."Session"."tokenHash" IS 'SHA-256 du token JWT — jamais stocker le token brut';
COMMENT ON COLUMN public."Session"."siteId"    IS 'Site actif au moment de la connexion';

-- ----------------------------------------------------------
-- LoginHistory
-- ----------------------------------------------------------
CREATE TABLE public."LoginHistory" (
    "loginHistoryId" UUID                             NOT NULL DEFAULT gen_random_uuid(),
    "userId"         UUID                             NOT NULL,
    "ipAddress"      INET,
    "userAgent"      TEXT,
    "status"         public.enum_loginHistory_status  NOT NULL,
    "createdAt"      TIMESTAMPTZ                      NOT NULL DEFAULT now(),
    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("loginHistoryId")
);

COMMENT ON TABLE public."LoginHistory" IS 'Historique de toutes les tentatives de connexion';

-- ----------------------------------------------------------
-- AuditLog
-- ----------------------------------------------------------
CREATE TABLE public."AuditLog" (
    "auditLogId" UUID         NOT NULL DEFAULT gen_random_uuid(),
    "userId"     UUID,
    "action"     VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(100),
    "entityId"   VARCHAR(255),
    "details"    JSONB,
    "ipAddress"  INET,
    "createdAt"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("auditLogId")
);

COMMENT ON COLUMN public."AuditLog"."entityType" IS 'Nom de la ressource concernée ex: Ticket, User';
COMMENT ON COLUMN public."AuditLog"."entityId"   IS 'UUID de l''entité (VARCHAR pour flexibilité)';
COMMENT ON COLUMN public."AuditLog"."details"    IS 'JSONB : before/after pour les updates';

-- ----------------------------------------------------------
-- UserPasswordReset
-- ----------------------------------------------------------
CREATE TABLE public."UserPasswordReset" (
    "userPasswordResetId" UUID         NOT NULL DEFAULT gen_random_uuid(),
    "userId"              UUID         NOT NULL,
    "token"               VARCHAR(255) NOT NULL,
    "expiresAt"           TIMESTAMPTZ  NOT NULL,
    "usedAt"              TIMESTAMPTZ,
    "createdAt"           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT "UserPasswordReset_pkey" PRIMARY KEY ("userPasswordResetId")
);

COMMENT ON TABLE public."UserPasswordReset" IS 'Tokens de réinitialisation de mot de passe — usage unique';

-- ============================================================
-- 6. DOMAINE NOTIFICATIONS & STATISTIQUES
-- ============================================================

-- ----------------------------------------------------------
-- Notification
-- ----------------------------------------------------------
CREATE TABLE public."Notification" (
    "notificationId" UUID                              NOT NULL DEFAULT gen_random_uuid(),
    "userId"         UUID,
    "ticketId"       UUID,
    "type"           public.enum_notification_type     NOT NULL,
    "channel"        public.enum_notification_channel  NOT NULL,
    "recipient"      VARCHAR(255)                      NOT NULL,
    "payload"        JSONB                             NOT NULL DEFAULT '{}',
    "status"         public.enum_notification_status   NOT NULL DEFAULT 'PENDING',
    "sentAt"         TIMESTAMPTZ,
    "errorMsg"       TEXT,
    "createdAt"      TIMESTAMPTZ                       NOT NULL DEFAULT now(),
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notificationId")
);

COMMENT ON COLUMN public."Notification"."recipient" IS 'Destinataire : numéro, email ou device token';
COMMENT ON COLUMN public."Notification"."payload"   IS 'Corps du message structuré selon type et channel';

-- ----------------------------------------------------------
-- DailyStatistic
-- ----------------------------------------------------------
CREATE TABLE public."DailyStatistic" (
    "dailyStatisticId"    UUID        NOT NULL DEFAULT gen_random_uuid(),
    "siteId"              UUID        NOT NULL,
    "queueId"             UUID,
    "categoryId"          UUID,
    "statDate"            DATE        NOT NULL,
    "ticketsTotal"        INTEGER     NOT NULL DEFAULT 0,
    "ticketsCompleted"    INTEGER     NOT NULL DEFAULT 0,
    "ticketsAbandoned"    INTEGER     NOT NULL DEFAULT 0,
    "ticketsTransferred"  INTEGER     NOT NULL DEFAULT 0,
    "avgWaitSeconds"      INTEGER,
    "avgServiceSeconds"   INTEGER,
    "maxWaitSeconds"      INTEGER,
    "peakHour"            SMALLINT,
    "computedAt"          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "DailyStatistic_pkey"        PRIMARY KEY ("dailyStatisticId"),
    CONSTRAINT "DailyStatistic_peakHour_check" CHECK ("peakHour" IS NULL OR "peakHour" BETWEEN 0 AND 23),
    CONSTRAINT "DailyStatistic_totals_check"   CHECK ("ticketsCompleted" + "ticketsAbandoned" <= "ticketsTotal"),
    CONSTRAINT "DailyStatistic_unique_slot"    UNIQUE ("siteId", "queueId", "categoryId", "statDate")
        DEFERRABLE INITIALLY DEFERRED
);

COMMENT ON COLUMN public."DailyStatistic"."queueId"    IS 'NULL = agrégat toutes files du site';
COMMENT ON COLUMN public."DailyStatistic"."categoryId" IS 'NULL = agrégat toutes catégories';
COMMENT ON COLUMN public."DailyStatistic"."statDate"   IS 'Date de la journée agrégée';
COMMENT ON COLUMN public."DailyStatistic"."peakHour"   IS 'Heure de pointe (0–23)';

-- ============================================================
-- 7. CLÉS ÉTRANGÈRES
-- ============================================================

-- Organisation
ALTER TABLE public."User"
    ADD CONSTRAINT "User_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES public."Role" ("roleId")
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public."RolePermission"
    ADD CONSTRAINT "RolePermission_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES public."Role" ("roleId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."RolePermission"
    ADD CONSTRAINT "RolePermission_permissionId_fkey"
    FOREIGN KEY ("permissionId") REFERENCES public."Permission" ("permissionId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."Site"
    ADD CONSTRAINT "Site_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES public."Company" ("companyId")
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE public."Site"
    ADD CONSTRAINT "Site_workflowId_fkey"
    FOREIGN KEY ("workflowId") REFERENCES public."Workflow" ("workflowId")
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public."UserSite"
    ADD CONSTRAINT "UserSite_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES public."User" ("userId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."UserSite"
    ADD CONSTRAINT "UserSite_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES public."Site" ("siteId")
    ON UPDATE CASCADE ON DELETE CASCADE;

-- Workflow / Configuration
ALTER TABLE public."Queue"
    ADD CONSTRAINT "Queue_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES public."Site" ("siteId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."Queue"
    ADD CONSTRAINT "Queue_workflowId_fkey"
    FOREIGN KEY ("workflowId") REFERENCES public."Workflow" ("workflowId")
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public."WorkflowStep"
    ADD CONSTRAINT "WorkflowStep_workflowId_fkey"
    FOREIGN KEY ("workflowId") REFERENCES public."Workflow" ("workflowId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."WorkflowStep"
    ADD CONSTRAINT "WorkflowStep_queueId_fkey"
    FOREIGN KEY ("queueId") REFERENCES public."Queue" ("queueId")
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public."WorkflowTransition"
    ADD CONSTRAINT "WorkflowTransition_workflowId_fkey"
    FOREIGN KEY ("workflowId") REFERENCES public."Workflow" ("workflowId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."WorkflowTransition"
    ADD CONSTRAINT "WorkflowTransition_fromStepId_fkey"
    FOREIGN KEY ("fromStepId") REFERENCES public."WorkflowStep" ("stepId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."WorkflowTransition"
    ADD CONSTRAINT "WorkflowTransition_toStepId_fkey"
    FOREIGN KEY ("toStepId") REFERENCES public."WorkflowStep" ("stepId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."TransitionAllowedRole"
    ADD CONSTRAINT "TransitionAllowedRole_transitionId_fkey"
    FOREIGN KEY ("transitionId") REFERENCES public."WorkflowTransition" ("transitionId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."TransitionAllowedRole"
    ADD CONSTRAINT "TransitionAllowedRole_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES public."Role" ("roleId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."CategoryQueue"
    ADD CONSTRAINT "CategoryQueue_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES public."Category" ("categoryId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."CategoryQueue"
    ADD CONSTRAINT "CategoryQueue_queueId_fkey"
    FOREIGN KEY ("queueId") REFERENCES public."Queue" ("queueId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."Kiosk"
    ADD CONSTRAINT "Kiosk_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES public."Site" ("siteId")
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE public."KioskQueue"
    ADD CONSTRAINT "KioskQueue_kioskId_fkey"
    FOREIGN KEY ("kioskId") REFERENCES public."Kiosk" ("kioskId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."KioskQueue"
    ADD CONSTRAINT "KioskQueue_queueId_fkey"
    FOREIGN KEY ("queueId") REFERENCES public."Queue" ("queueId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."KioskActivity"
    ADD CONSTRAINT "KioskActivity_kioskId_fkey"
    FOREIGN KEY ("kioskId") REFERENCES public."Kiosk" ("kioskId")
    ON UPDATE CASCADE ON DELETE CASCADE;

-- Logistique
ALTER TABLE public."Ticket"
    ADD CONSTRAINT "Ticket_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES public."Site" ("siteId")
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE public."Ticket"
    ADD CONSTRAINT "Ticket_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES public."Company" ("companyId")
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public."Ticket"
    ADD CONSTRAINT "Ticket_queueId_fkey"
    FOREIGN KEY ("queueId") REFERENCES public."Queue" ("queueId")
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public."Ticket"
    ADD CONSTRAINT "Ticket_stepId_fkey"
    FOREIGN KEY ("stepId") REFERENCES public."WorkflowStep" ("stepId")
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public."Ticket"
    ADD CONSTRAINT "Ticket_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES public."User" ("userId")
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public."Ticket"
    ADD CONSTRAINT "Ticket_calledById_fkey"
    FOREIGN KEY ("calledById") REFERENCES public."User" ("userId")
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public."TicketVehicleInfo"
    ADD CONSTRAINT "TicketVehicleInfo_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES public."Ticket" ("ticketId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."TicketLogistic"
    ADD CONSTRAINT "TicketLogistic_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES public."Ticket" ("ticketId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."TicketCategory"
    ADD CONSTRAINT "TicketCategory_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES public."Ticket" ("ticketId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."TicketCategory"
    ADD CONSTRAINT "TicketCategory_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES public."Category" ("categoryId")
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE public."TicketHistory"
    ADD CONSTRAINT "TicketHistory_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES public."Ticket" ("ticketId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."TicketHistory"
    ADD CONSTRAINT "TicketHistory_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES public."User" ("userId")
    ON UPDATE CASCADE ON DELETE SET NULL;

-- Sécurité
ALTER TABLE public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES public."User" ("userId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."Session"
    ADD CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES public."User" ("userId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."Session"
    ADD CONSTRAINT "Session_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES public."Site" ("siteId")
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public."LoginHistory"
    ADD CONSTRAINT "LoginHistory_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES public."User" ("userId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES public."User" ("userId")
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public."UserPasswordReset"
    ADD CONSTRAINT "UserPasswordReset_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES public."User" ("userId")
    ON UPDATE CASCADE ON DELETE CASCADE;

-- Notifications & Statistiques
ALTER TABLE public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES public."User" ("userId")
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public."Notification"
    ADD CONSTRAINT "Notification_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES public."Ticket" ("ticketId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."DailyStatistic"
    ADD CONSTRAINT "DailyStatistic_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES public."Site" ("siteId")
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."DailyStatistic"
    ADD CONSTRAINT "DailyStatistic_queueId_fkey"
    FOREIGN KEY ("queueId") REFERENCES public."Queue" ("queueId")
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public."DailyStatistic"
    ADD CONSTRAINT "DailyStatistic_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES public."Category" ("categoryId")
    ON UPDATE CASCADE ON DELETE SET NULL;

-- ============================================================
-- 8. INDEX
-- ============================================================

-- Organisation
CREATE INDEX "idx_Site_companyId"
    ON public."Site" ("companyId");

CREATE INDEX "idx_User_roleId"
    ON public."User" ("roleId") WHERE "roleId" IS NOT NULL;

CREATE INDEX "idx_UserSite_siteId"
    ON public."UserSite" ("siteId");

CREATE UNIQUE INDEX "udx_UserSite_defaultSite"
    ON public."UserSite" ("userId") WHERE "isDefault" = true;

-- Workflow
CREATE INDEX "idx_Queue_siteId"
    ON public."Queue" ("siteId");

CREATE INDEX "idx_Queue_active"
    ON public."Queue" ("siteId", "isActive") WHERE "isActive" = true;

CREATE INDEX "idx_WorkflowStep_workflowId"
    ON public."WorkflowStep" ("workflowId");

CREATE INDEX "idx_WorkflowTransition_workflowId"
    ON public."WorkflowTransition" ("workflowId");

CREATE INDEX "idx_WorkflowTransition_fromStepId"
    ON public."WorkflowTransition" ("fromStepId");

CREATE INDEX "idx_WorkflowTransition_toStepId"
    ON public."WorkflowTransition" ("toStepId");

CREATE INDEX "idx_TransitionAllowedRole_roleId"
    ON public."TransitionAllowedRole" ("roleId");

CREATE UNIQUE INDEX "udx_WorkflowStep_singleInitial"
    ON public."WorkflowStep" ("workflowId") WHERE "isInitial" = true;

-- Kiosks
CREATE INDEX "idx_Kiosk_siteId"
    ON public."Kiosk" ("siteId");

CREATE INDEX "idx_KioskActivity_kioskId"
    ON public."KioskActivity" ("kioskId", "createdAt" DESC);

CREATE UNIQUE INDEX "udx_KioskQueue_defaultQueue"
    ON public."KioskQueue" ("kioskId") WHERE "isDefault" = true;

-- SystemSetting
CREATE UNIQUE INDEX "udx_SystemSetting_lookup"
    ON public."SystemSetting" ("key", "scope", COALESCE("scopeId"::TEXT, ''));

-- Ticket
CREATE INDEX "idx_Ticket_siteStatus"
    ON public."Ticket" ("siteId", "status");

CREATE INDEX "idx_Ticket_queueId"
    ON public."Ticket" ("queueId") WHERE "queueId" IS NOT NULL;

CREATE INDEX "idx_Ticket_stepId"
    ON public."Ticket" ("stepId") WHERE "stepId" IS NOT NULL;

CREATE INDEX "idx_Ticket_companyId"
    ON public."Ticket" ("companyId") WHERE "companyId" IS NOT NULL;

CREATE INDEX "idx_Ticket_arrivedAt"
    ON public."Ticket" ("arrivedAt" DESC);

CREATE INDEX "idx_Ticket_calledById"
    ON public."Ticket" ("calledById") WHERE "calledById" IS NOT NULL;

CREATE INDEX "idx_Ticket_active"
    ON public."Ticket" ("siteId", "arrivedAt" DESC)
    WHERE "status" IN ('EN_ATTENTE', 'APPELE', 'EN_TRAITEMENT');

-- TicketHistory
CREATE INDEX "idx_TicketHistory_ticketId"
    ON public."TicketHistory" ("ticketId", "occurredAt" DESC);

CREATE INDEX "idx_TicketHistory_event"
    ON public."TicketHistory" ("event", "occurredAt" DESC);

CREATE INDEX "idx_TicketHistory_actorId"
    ON public."TicketHistory" ("actorId") WHERE "actorId" IS NOT NULL;

-- TicketCategory
CREATE INDEX "idx_TicketCategory_categoryId"
    ON public."TicketCategory" ("categoryId");

-- Sécurité
CREATE INDEX "idx_RefreshToken_userId"
    ON public."RefreshToken" ("userId");

CREATE INDEX "idx_RefreshToken_active"
    ON public."RefreshToken" ("userId") WHERE "revoked" = false;

CREATE INDEX "idx_Session_active"
    ON public."Session" ("userId", "lastActiveAt" DESC)
    WHERE "revokedAt" IS NULL;

CREATE INDEX "idx_LoginHistory_userId"
    ON public."LoginHistory" ("userId", "createdAt" DESC);

CREATE INDEX "idx_AuditLog_entity"
    ON public."AuditLog" ("entityType", "entityId");

CREATE INDEX "idx_AuditLog_createdAt"
    ON public."AuditLog" ("createdAt" DESC);

CREATE INDEX "idx_AuditLog_userId"
    ON public."AuditLog" ("userId") WHERE "userId" IS NOT NULL;

CREATE INDEX "idx_UserPasswordReset_token"
    ON public."UserPasswordReset" ("token") WHERE "usedAt" IS NULL;

-- Notification
CREATE INDEX "idx_Notification_pending"
    ON public."Notification" ("createdAt") WHERE "status" = 'PENDING';

CREATE INDEX "idx_Notification_ticketId"
    ON public."Notification" ("ticketId") WHERE "ticketId" IS NOT NULL;

-- DailyStatistic
CREATE INDEX "idx_DailyStatistic_siteDate"
    ON public."DailyStatistic" ("siteId", "statDate" DESC);

-- ============================================================
-- 9. SEED MINIMAL
-- ============================================================

INSERT INTO public."Role" ("name", "description", "scope") VALUES
    ('SUPERADMIN',  'Accès complet à toutes les ressources', 'GLOBAL'),
    ('MANAGER',     'Gestion opérationnelle d''une ou plusieurs entreprises', 'COMPANY'),
    ('SUPERVISEUR', 'Supervision des files et des agents sur un site', 'SITE'),
    ('AGENT',       'Agent de traitement — accès au site assigné uniquement', 'SITE')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO public."SystemSetting" ("key", "value", "type", "scope", "category", "description") VALUES
    ('establishment_name',  'GesParc', 'STRING',  'GLOBAL', 'GENERAL',  'Nom affiché sur les tickets et interfaces'),
    ('ticket_expiry_hours', '24',  'INTEGER', 'GLOBAL', 'TICKETS',  'Durée de vie d''un ticket non traité en heures'),
    ('max_reprint_count',   '3',   'INTEGER', 'GLOBAL', 'TICKETS',  'Nombre maximal de réimpressions par ticket'),
    ('session_ttl_minutes', '480', 'INTEGER', 'GLOBAL', 'SECURITY', 'Durée de vie d''une session en minutes (8h)'),
    ('lock_threshold',      '5',   'INTEGER', 'GLOBAL', 'SECURITY', 'Nombre d''échecs avant verrouillage du compte'),
    ('lock_duration_min',   '15',  'INTEGER', 'GLOBAL', 'SECURITY', 'Durée du verrouillage en minutes')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. VÉRIFICATION FINALE
-- ============================================================
DO $$
DECLARE
    v_tables  INTEGER;
    v_indexes INTEGER;
    v_fks     INTEGER;
    v_enums   INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_tables  FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    SELECT COUNT(*) INTO v_indexes FROM pg_indexes
        WHERE schemaname = 'public';
    SELECT COUNT(*) INTO v_fks     FROM information_schema.referential_constraints
        WHERE constraint_schema = 'public';
    SELECT COUNT(*) INTO v_enums   FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typtype = 'e';

    RAISE NOTICE '============================================';
    RAISE NOTICE 'GesParc SCHEMA — RÉSUMÉ CRÉATION';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Tables   : % (attendu ≥ 28)', v_tables;
    RAISE NOTICE 'Index    : % (attendu ≥ 35)', v_indexes;
    RAISE NOTICE 'FK       : % (attendu ≥ 38)', v_fks;
    RAISE NOTICE 'ENUMs    : % (attendu = 14)', v_enums;
    RAISE NOTICE '============================================';

    IF v_tables < 28 THEN RAISE EXCEPTION 'Tables insuffisantes : %', v_tables; END IF;
    IF v_fks    < 38 THEN RAISE EXCEPTION 'FK insuffisantes : %',     v_fks;    END IF;

    RAISE NOTICE 'Schéma GesParc créé avec succès.';
END $$;

COMMIT;