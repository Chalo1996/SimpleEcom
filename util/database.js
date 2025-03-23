// When working with sequelize -> SQL: uncomment

import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB,
  process.env.DB_USER,
  process.env.PASSWORD,
  {
    host: process.env.HOST,
    dialect: "mysql",
    logging: true,
  }
);

export default sequelize;
