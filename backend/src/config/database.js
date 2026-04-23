import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

class Database {
  constructor() {
    const {
      DB_NAME = 'gesparc',
      DB_USER = 'postgres',
      DB_PASSWORD = '',
      DB_HOST = 'localhost',
      DB_PORT = '5432'
    } = process.env;

    this.sequelize = new Sequelize(
      DB_NAME,
      DB_USER,
      DB_PASSWORD,
      {
        host: DB_HOST,
        dialect: 'postgres',
        port: Number(DB_PORT),
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );
  }

  getInstance() {
    return this.sequelize;
  }
}

const db = new Database();
export const sequelize = db.getInstance();
