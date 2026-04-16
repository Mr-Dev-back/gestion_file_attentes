import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

class LoggerService {
    constructor() {
        // Define log format
        const logFormat = winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            winston.format.splat(),
            winston.format.json()
        );

        // Console format for development
        const consoleFormat = winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                let msg = `${timestamp} [${level}]: ${message}`;
                if (Object.keys(meta).length > 0) {
                    msg += ` ${JSON.stringify(meta)}`;
                }
                return msg;
            })
        );

        // Daily rotate file transport for all logs
        const dailyRotateTransport = new DailyRotateFile({
            filename: 'logs/app-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d', // Keep logs for 14 days
            format: logFormat
        });

        // Daily rotate file transport for errors only
        const errorRotateTransport = new DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '30d', // Keep error logs for 30 days
            format: logFormat
        });

        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: logFormat,
            transports: [
                dailyRotateTransport,
                errorRotateTransport
            ],
            exceptionHandlers: [
                new DailyRotateFile({
                    filename: 'logs/exceptions-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '30d'
                })
            ],
            rejectionHandlers: [
                new DailyRotateFile({
                    filename: 'logs/rejections-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '30d'
                })
            ]
        });

        // Add console transport in non-production environments
        if (true) {
            this.logger.add(new winston.transports.Console({
                format: consoleFormat
            }));
        }
    }

    getInstance() {
        return this.logger;
    }
}

const loggerService = new LoggerService();
export default loggerService.getInstance();
