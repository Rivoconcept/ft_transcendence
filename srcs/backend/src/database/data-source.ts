import "reflect-metadata";
import { DataSource } from "typeorm";
import { DataSourceOptions } from "typeorm/browser";
import { User } from "./entities/user.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,

  synchronize: true, // ⚠️ OK pour dev uniquement
  logging: true,

  entities: [User],
} as DataSourceOptions);
