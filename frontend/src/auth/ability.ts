import { createMongoAbility } from '@casl/ability';

/**
 * Détecte le type de sujet pour CASL.
 * Permet de passer soit une chaîne ('Ticket'), soit un objet avec une propriété '__typename'.
 */
export const detectSubjectType = (subject?: any) => {
  if (subject && typeof subject === 'object' && (subject as any).__typename) {
    return (subject as any).__typename;
  }
  return subject;
};

export const ability = createMongoAbility(
  [], 
  { detectSubjectType }
);

/**
 * Met à jour les capacités de l'instance globale 'ability'.
 * Prend désormais directement les "rules" CASL envoyées par le backend.
 */
export const updateAbility = (rules: any[]) => {
  if (!rules || rules.length === 0) {
    return ability.update([]);
  }

  ability.update(rules);
};
