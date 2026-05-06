import { z } from 'zod';

export const userSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").optional().or(z.literal('')),
  role: z.enum(['ADMINISTRATOR', 'MANAGER', 'SUPERVISOR', 'AGENT_QUAI', 'AGENT_GUERITE', 'EXPLOITATION'], {
    message: "Le rôle est requis et doit être valide"
  }),
  companyId: z.string().uuid("Société invalide").or(z.literal("")).transform(v => v === "" ? null : v).nullable().optional(),
  siteId: z.string().uuid("Site invalide").or(z.literal("")).transform(v => v === "" ? null : v).nullable().optional(),
  queueId: z.string().uuid("File d'attente invalide").or(z.literal("")).transform(v => v === "" ? null : v).nullable().optional(),
  queueIds: z.array(z.string().uuid()).optional().default([]),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
}).refine((data) => {
  if (data.role === 'MANAGER' && !data.companyId) return false;
  return true;
}, {
  message: "La société est requise pour un Manager",
  path: ["companyId"]
}).refine((data) => {
  if (['SUPERVISOR', 'AGENT_GUERITE', 'EXPLOITATION'].includes(data.role) && !data.siteId) return false;
  return true;
}, {
  message: "Le site est requis pour ce rôle",
  path: ["siteId"]
}).refine((data) => {
  if (data.role === 'AGENT_QUAI' && (!data.queueId && (!data.queueIds || data.queueIds.length === 0))) return false;
  return true;
}, {
  message: "Au moins une file d'attente est requise pour un Agent de Quai",
  path: ["queueIds"]
});

export const categorySchema = z.object({
  name: z.string().min(2, "Le nom est trop court"),
  prefix: z.string().min(2, "Le préfixe est trop court").max(5, "Le préfixe est trop long").regex(/^[A-Z0-9]+$/, "Le préfixe doit être en majuscules sans espaces"),
  description: z.string().optional(),
  estimatedDuration: z.number().min(1, "La durée doit être d'au moins 1 minute").optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide").default('#3b82f6'),
  queueIds: z.array(z.string().uuid()).default([]),
  isActive: z.boolean().default(true)
});

export const workflowStepSchema = z.object({
  name: z.string().min(2, "Le nom de l'étape est requis"),
  orderNumber: z.number().min(0, "L'ordre doit être un nombre positif"),
  queueIds: z.array(z.string().uuid()).min(1, "Au moins une file d'attente est requise"),
  isActived: z.boolean().default(true),
  formConfig: z.array(z.any()).default([])
});

export const workflowSchema = z.object({
  name: z.string().min(3, "Le nom du workflow est requis"),
  description: z.string().optional(),
  isActived: z.boolean().default(true)
});

export const quaiParameterSchema = z.object({
  label: z.string().min(3, "Le label du quai est requis"),
  siteId: z.string().uuid("Le site est requis"),
  stepIds: z.array(z.string().uuid()).min(1, "Au moins une étape est requise"),
  queueIds: z.array(z.string().uuid()).default([]),
  formConfig: z.array(z.any()).default([]),
  allowedUsers: z.array(z.string()).default([])
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis")
});

export const companySchema = z.object({
  name: z.string().min(2, "Le nom de la société est requis"),
  code: z.string().min(2, "Le code est requis").max(10, "Le code est trop long"),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
});

export const siteSchema = z.object({
  name: z.string().min(2, "Le nom du site est requis"),
  code: z.string().min(2, "Le code est requis").max(10, "Le code est trop long"),
  companyId: z.string().uuid("La société est requise"),
  workflowId: z.string().uuid().nullable().optional().or(z.literal('')),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isMonoUserProcess: z.boolean().default(false)
});

export const resourceSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  slug: z.string().min(2, "Le slug est trop court").max(30, "Le slug est trop long").regex(/^[A-Z_]+$/, "Le slug doit être en majuscules (ex: GESTION_QUAI)"),
  description: z.string().max(255, "La description est trop longue").optional().or(z.literal(''))
});

export const roleSchema = z.object({
  name: z.string().min(3, "Le nom du rôle doit contenir au moins 3 caractères"),
  description: z.string().optional().or(z.literal('')),
  scope: z.enum(['GLOBAL', 'COMPANY', 'SITE'], {
    message: "La portée est requise"
  }),
  permissionIds: z.array(z.string().uuid()).default([])
});

export const permissionSchema = z.object({
  resourceId: z.string().uuid("La ressource cible est requise"),
  actionId: z.string().uuid("L'action autorisée est requise"),
  action: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  conditions: z.any().optional().nullable(),
  description: z.string().optional().or(z.literal(''))
});
