-- ============================================================
-- GFA — SYSTÈME DE GESTION DE FLUX (LOGISTIQUE & PARCOURS)
-- Script de création de base de données PostgreSQL
-- ============================================================

BEGIN;

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TYPES ENUM
DO $$ BEGIN
    CREATE TYPE public.enum_ticket_status AS ENUM (
        'EN_ATTENTE', 'APPELE', 'EN_TRAITEMENT', 'ISOLE', 'TRANSFERE', 'COMPLETE', 'ANNULE'
    );
    CREATE TYPE public.enum_action_type AS ENUM (
        'APPEL', 'RAPPEL', 'COMMENCER', 'TERMINER', 'ISOLER', 'PESEE_ENTREE', 'PESEE_SORTIE'
    );
    CREATE TYPE public.enum_kiosk_status AS ENUM ('ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. STRUCTURE ORGANISATIONNELLE
CREATE TABLE public."Company" (
    "companyId"   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"        VARCHAR(100) NOT NULL,
    "code"        VARCHAR(20) UNIQUE,
    "isActived"   BOOLEAN DEFAULT true,
    "createdAt"   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public."Workflow" (
    "workflowId"  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"        VARCHAR(100) NOT NULL,
    "description" TEXT,
    "isActived"   BOOLEAN DEFAULT true,
    "createdAt"   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public."Site" (
    "siteId"      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "companyId"   UUID NOT NULL REFERENCES public."Company"("companyId") ON DELETE CASCADE,
    "workflowId"  UUID REFERENCES public."Workflow"("workflowId") ON DELETE SET NULL,
    "name"        VARCHAR(100) NOT NULL,
    "code"        VARCHAR(20) UNIQUE,
    "address"     TEXT,
    "alertThreshold" INTEGER DEFAULT 45, -- Seuil d'alerte en minutes
    "isActived"   BOOLEAN DEFAULT true,
    "createdAt"   TIMESTAMPTZ DEFAULT now()
);

-- 3. SÉCURITÉ : RÔLES ET PERMISSIONS
CREATE TABLE public."Role" (
    "roleId"      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"        VARCHAR(50) NOT NULL UNIQUE,
    "description" TEXT
);

CREATE TABLE public."Permission" (
    "permissionId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "code"         VARCHAR(50) NOT NULL UNIQUE, 
    "description"  TEXT,
    "resources"    JSONB DEFAULT '[]', 
    "actions"      JSONB DEFAULT '[]',
    "createdAt"    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public."RolePermission" (
    "roleId"       UUID NOT NULL REFERENCES public."Role"("roleId") ON DELETE CASCADE,
    "permissionId" UUID NOT NULL REFERENCES public."Permission"("permissionId") ON DELETE CASCADE,
    "createdAt"    TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY ("roleId", "permissionId")
);

-- 4. UTILISATEURS
CREATE TABLE public."User" (
    "userId"      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "roleId"      UUID REFERENCES public."Role"("roleId"),
    "email"       VARCHAR(150) NOT NULL UNIQUE,
    "password"    TEXT NOT NULL,
    "firstName"   VARCHAR(100),
    "lastName"    VARCHAR(100),
    "isActive"    BOOLEAN DEFAULT true,
    "failedAttempts" INTEGER DEFAULT 0,
    "lockUntil"    TIMESTAMPTZ,
    "createdAt"   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public."UserSite" (
    "userId"      UUID REFERENCES public."User"("userId") ON DELETE CASCADE,
    "siteId"      UUID REFERENCES public."Site"("siteId") ON DELETE CASCADE,
    PRIMARY KEY ("userId", "siteId")
);

CREATE TABLE public."RefreshToken" (
    "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId"      UUID NOT NULL REFERENCES public."User"("userId") ON DELETE CASCADE,
    "token"       TEXT NOT NULL,
    "expiresAt"   TIMESTAMPTZ NOT NULL,
    "isRevoked"   BOOLEAN DEFAULT false
);

-- 5. MATÉRIEL (BORNES & PONT-BASCULE)
CREATE TABLE public."Kiosk" (
    "kioskId"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "siteId"      UUID NOT NULL REFERENCES public."Site"("siteId") ON DELETE CASCADE,
    "name"        VARCHAR(100) NOT NULL,
    "kioskType"   VARCHAR(50) DEFAULT 'ENTRANCE', -- ENTRANCE, EXIT, WEIGH_STATION
    "status"      public.enum_kiosk_status DEFAULT 'OFFLINE',
    "ipAddress"   VARCHAR(45),
    "macAddress"  VARCHAR(17) UNIQUE,
    "capabilities" JSONB DEFAULT '{"hasPrinter": true, "hasScale": false}',
    "lastPing"    TIMESTAMPTZ
);

-- 6. MOTEUR DE WORKFLOW
CREATE TABLE public."Category" (
    "categoryId"  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"        VARCHAR(50) NOT NULL,
    "prefix"      VARCHAR(10) NOT NULL, -- ex: 'BET' pour Béton
    "color"       VARCHAR(7) DEFAULT '#3b82f6'
);

CREATE TABLE public."Queue" (
    "queueId"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"        VARCHAR(100) NOT NULL,
    "isActived"   BOOLEAN DEFAULT true
);

CREATE TABLE public."WorkflowStep" (
    "stepId"                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "workflowId"             UUID NOT NULL REFERENCES public."Workflow"("workflowId") ON DELETE CASCADE,
    "queueId"                UUID NOT NULL REFERENCES public."Queue"("queueId"),
    "stepOrder"              SMALLINT NOT NULL,
    "formConfig"             JSONB DEFAULT '[]',
    "isolationAfterRecalls"  SMALLINT DEFAULT 2,
    "isInitial"              BOOLEAN DEFAULT false,
    "isFinal"                BOOLEAN DEFAULT false,
    UNIQUE("workflowId", "stepOrder")
);

-- 7. GESTION DES TICKETS (CONFORME CAHIER DES CHARGES)
CREATE TABLE public."Ticket" (
    "ticketId"      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ticketNumber"  VARCHAR(50) NOT NULL UNIQUE,
    "siteId"        UUID NOT NULL REFERENCES public."Site"("siteId"),
    "categoryId"    UUID REFERENCES public."Category"("categoryId"),
    "currentStepId" UUID REFERENCES public."WorkflowStep"("stepId"),
    "status"        public.enum_ticket_status DEFAULT 'EN_ATTENTE',
    
    -- Identification Logistique
    "driverName"    VARCHAR(100),
    "driverPhone"   VARCHAR(20),
    "licensePlate"  VARCHAR(20),
    "orderNumber"   VARCHAR(50),
    "companyName"   VARCHAR(100),
    
    -- Pesage
    "weightIn"      DECIMAL(10,2),
    "weightOut"     DECIMAL(10,2),
    "priority"      SMALLINT DEFAULT 0,
    "recallCount"   SMALLINT DEFAULT 0,
    
    -- Chronométrie (KPI)
    "arrivedAt"     TIMESTAMPTZ DEFAULT now(),
    "calledAt"      TIMESTAMPTZ,
    "startedAt"     TIMESTAMPTZ,
    "completedAt"   TIMESTAMPTZ,
    "updatedAt"     TIMESTAMPTZ DEFAULT now(),
    "calledBy"      UUID REFERENCES public."User"("userId")
);

-- 8. HISTORIQUE ET AUDIT
CREATE TABLE public."TicketActionLog" (
    "logId"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ticketId"       UUID NOT NULL REFERENCES public."Ticket"("ticketId") ON DELETE CASCADE,
    "stepId"         UUID REFERENCES public."WorkflowStep"("stepId"),
    "actionType"     public.enum_action_type NOT NULL,
    "agentId"        UUID REFERENCES public."User"("userId"),
    "formData"       JSONB DEFAULT '{}',
    "occurredAt"     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public."AuditLog" (
    "auditId"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId"         UUID REFERENCES public."User"("userId"),
    "action"         VARCHAR(100) NOT NULL,
    "details"        JSONB,
    "ipAddress"      VARCHAR(45),
    "occurredAt"     TIMESTAMPTZ DEFAULT now()
);

-- 9. INDEX DE PERFORMANCE
CREATE INDEX idx_ticket_status ON public."Ticket"("status");
CREATE INDEX idx_ticket_site ON public."Ticket"("siteId");
CREATE INDEX idx_workflow_step_lookup ON public."WorkflowStep"("workflowId", "stepOrder");

COMMIT;