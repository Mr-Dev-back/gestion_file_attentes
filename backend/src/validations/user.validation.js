
import Joi from 'joi';

const validRoles = ['ADMINISTRATOR', 'SUPERVISOR', 'MANAGER', 'AGENT_QUAI', 'AGENT_GUERITE'];

export const createUserSchema = Joi.object({
    username: Joi.string().min(3).max(50).required().messages({
        'string.empty': 'Le nom d\'utilisateur est obligatoire.',
        'string.min': 'Le nom d\'utilisateur doit contenir au moins 3 caractères.',
        'any.required': 'Le nom d\'utilisateur est obligatoire.'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'L\'adresse email est invalide.',
        'any.required': 'L\'email est obligatoire.'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Le mot de passe doit contenir au moins 6 caractères.',
        'any.required': 'Le mot de passe est obligatoire.'
    }),
    role: Joi.string().valid(...validRoles).required().messages({
        'any.only': `Le rôle doit être l'un des suivants: ${validRoles.join(', ')}`,
        'any.required': 'Le rôle est obligatoire.'
    }),
    firstName: Joi.string().max(100).allow(null, ''),
    lastName: Joi.string().max(100).allow(null, ''),
    siteId: Joi.string().uuid().allow(null, '').messages({
        'string.guid': 'L\'ID du site doit être un UUID valide.'
    }),
    companyId: Joi.string().uuid().allow(null, '').messages({
        'string.guid': 'L\'ID de la société doit être un UUID valide.'
    }),
    queueId: Joi.string().uuid().allow(null, '').messages({
        'string.guid': 'L\'ID de la file doit être un UUID valide.'
    }),
    queueIds: Joi.array().items(Joi.string().uuid()).allow(null).default([])
}).unknown(true);

export const updateUserSchema = Joi.object({
    username: Joi.string().min(3).max(50),
    email: Joi.string().email(),
    password: Joi.string().min(6),
    role: Joi.string().valid(...validRoles),
    isActive: Joi.boolean(),
    firstName: Joi.string().max(100).allow(null, ''),
    lastName: Joi.string().max(100).allow(null, ''),
    siteId: Joi.string().uuid().allow(null, ''),
    companyId: Joi.string().uuid().allow(null, ''),
    queueId: Joi.string().uuid().allow(null, '')
}).unknown(true);
