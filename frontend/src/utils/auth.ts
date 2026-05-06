/**
 * Vérifie si un JWT est expiré.
 * @param token Le token JWT à vérifier
 * @param marginMS Marge de sécurité en millisecondes (défaut: 10s)
 * @returns true si le token est expiré ou invalide
 */
export const isTokenExpired = (token: string, marginMS: number = 10000): boolean => {
    if (!token) return true;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return true;
        
        const payload = JSON.parse(atob(parts[1]));
        if (!payload.exp) return false; // Pas d'expiration définie
        
        return (payload.exp * 1000) < (Date.now() + marginMS);
    } catch (e) {
        return true;
    }
};
