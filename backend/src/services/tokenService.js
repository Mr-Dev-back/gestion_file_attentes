import { redisClient } from '../config/redis.js';
import logger from '../config/logger.js';
import { RefreshToken } from '../models/index.js';

/**
 * Token Service for managing refresh tokens in Redis
 * Provides better performance and automatic expiration compared to database storage
 * Falls back to database if Redis is unavailable
 */
class TokenService {
    /**
     * Check if Redis is available
     */
    async isRedisAvailable() {
        try {
            if (!redisClient.isOpen) {
                return false;
            }
            await redisClient.ping();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Store a refresh token in Redis (or database as fallback)
     * @param {string} userId - User ID
     * @param {string} token - Refresh token
     * @param {number} expiresIn - Expiration time in seconds (default: 7 days)
     */
    async storeRefreshToken(userId, token, expiresIn = 7 * 24 * 60 * 60) {
        try {
            const redisAvailable = await this.isRedisAvailable();

            if (redisAvailable) {
                // Use Redis
                const key = `refresh_token:${userId}:${token}`;
                const data = JSON.stringify({
                    userId,
                    createdAt: Date.now(),
                    expiresAt: Date.now() + (expiresIn * 1000)
                });

                await redisClient.setEx(key, expiresIn, data);
                logger.info(`Refresh token stored in Redis for user ${userId}`);
                return true;
            } else {
                // Fallback to database
                const expiresAt = new Date(Date.now() + expiresIn * 1000);
                await RefreshToken.create({
                    token,
                    userId,
                    expiresAt
                });
                logger.warn(`Redis unavailable, stored refresh token in database for user ${userId}`);
                return true;
            }
        } catch (error) {
            logger.error('Error storing refresh token:', error);
            throw error;
        }
    }

    /**
     * Validate a refresh token
     * @param {string} userId - User ID
     * @param {string} token - Refresh token to validate
     * @returns {Promise<boolean>} - True if token is valid
     */
    async validateRefreshToken(userId, token) {
        try {
            const redisAvailable = await this.isRedisAvailable();

            if (redisAvailable) {
                // Check Redis
                const key = `refresh_token:${userId}:${token}`;
                const data = await redisClient.get(key);

                if (!data) {
                    logger.warn(`Invalid or expired refresh token in Redis for user ${userId}`);
                    return false;
                }

                const tokenData = JSON.parse(data);

                // Check if token has expired
                if (tokenData.expiresAt < Date.now()) {
                    await this.revokeRefreshToken(userId, token);
                    return false;
                }

                return true;
            } else {
                // Fallback to database
                const rToken = await RefreshToken.findOne({ where: { token, userId } });

                if (!rToken || new Date() > rToken.expiresAt || rToken.isRevoked) {
                    logger.warn(`Invalid or expired refresh token in database for user ${userId}`);
                    return false;
                }

                return true;
            }
        } catch (error) {
            logger.error('Error validating refresh token:', error);
            return false;
        }
    }

    /**
     * Revoke a specific refresh token
     * @param {string} userId - User ID
     * @param {string} token - Refresh token to revoke
     */
    async revokeRefreshToken(userId, token) {
        try {
            const redisAvailable = await this.isRedisAvailable();

            if (redisAvailable) {
                const key = `refresh_token:${userId}:${token}`;
                await redisClient.del(key);
                logger.info(`Refresh token revoked from Redis for user ${userId}`);
            } else {
                // Fallback to database
                await RefreshToken.update(
                    { isRevoked: true },
                    { where: { token, userId } }
                );
                logger.warn(`Redis unavailable, revoked refresh token in database for user ${userId}`);
            }
            return true;
        } catch (error) {
            logger.error('Error revoking refresh token:', error);
            throw error;
        }
    }

    /**
     * Revoke all refresh tokens for a user
     * @param {string} userId - User ID
     */
    async revokeAllUserTokens(userId) {
        try {
            const pattern = `refresh_token:${userId}:*`;
            const keys = await redisClient.keys(pattern);

            if (keys.length > 0) {
                await redisClient.del(keys);
                logger.info(`Revoked ${keys.length} tokens for user ${userId}`);
            }

            return keys.length;
        } catch (error) {
            logger.error('Error revoking all user tokens:', error);
            throw error;
        }
    }

    /**
     * Get all active tokens for a user (for session management)
     * @param {string} userId - User ID
     * @returns {Promise<Array>} - Array of token data
     */
    async getUserTokens(userId) {
        try {
            const pattern = `refresh_token:${userId}:*`;
            const keys = await redisClient.keys(pattern);

            const tokens = [];
            for (const key of keys) {
                const data = await redisClient.get(key);
                if (data) {
                    const tokenData = JSON.parse(data);
                    tokens.push({
                        token: key.split(':')[2],
                        createdAt: new Date(tokenData.createdAt),
                        expiresAt: new Date(tokenData.expiresAt)
                    });
                }
            }

            return tokens;
        } catch (error) {
            logger.error('Error getting user tokens:', error);
            return [];
        }
    }

    /**
     * Clean up expired tokens (optional, Redis handles this automatically)
     * This method is for manual cleanup if needed
     */
    async cleanupExpiredTokens() {
        try {
            const pattern = 'refresh_token:*';
            const keys = await redisClient.keys(pattern);

            let cleaned = 0;
            for (const key of keys) {
                const data = await redisClient.get(key);
                if (data) {
                    const tokenData = JSON.parse(data);
                    if (tokenData.expiresAt < Date.now()) {
                        await redisClient.del(key);
                        cleaned++;
                    }
                }
            }

            if (cleaned > 0) {
                logger.info(`Cleaned up ${cleaned} expired tokens`);
            }

            return cleaned;
        } catch (error) {
            logger.error('Error cleaning up expired tokens:', error);
            return 0;
        }
    }
}

export default new TokenService();
