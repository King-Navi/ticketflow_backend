import dotenv from 'dotenv';
import { Sequelize, DataTypes, Model } from 'sequelize';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

dotenv.config();

const RETRY_LIMIT = 10;
const RETRY_INTERVAL_MS = 5000;

const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined;
const DB_SSL = process.env.DB_SSL === 'true';

export const sequelizeCon = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  dialectOptions: DB_SSL ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  define: { freezeTableName: true, underscored: false },
  logging: false,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function listFilesRecursive(dir) {
  const out = [];
  const entries = await readdir(dir);
  for (const name of entries) {
    const full = path.join(dir, name);
    const s = await stat(full);
    if (s.isDirectory()) out.push(...(await listFilesRecursive(full)));
    else out.push(full);
  }
  return out;
}

function isClass(fn) {
  return typeof fn === 'function' && /^\s*class\s+/.test(String(fn));
}

async function loadAllModels() {
  const modelsDir = path.resolve(__dirname, '../model_db');
  const files = (await listFilesRecursive(modelsDir))
    .filter(f =>
      (f.endsWith('.js') || f.endsWith('.mjs')) &&
      path.basename(f) !== 'index.js'
    );

  for (const file of files) {
    const mod = await import(pathToFileURL(file).href);
    const exp = mod?.default ?? mod;

    if (typeof exp === 'function') {
      if (isClass(exp)) {
        const isSequelizeModel = exp.prototype instanceof Model;

        const hasOwnInit = Object.prototype.hasOwnProperty.call(exp, 'init');
        if (isSequelizeModel && hasOwnInit && exp.init.length === 2) {
          await exp.init(sequelizeCon, DataTypes);
          continue;
        }

        const initFn = mod.initModel || mod.register;
        if (typeof initFn === 'function') {
          await initFn(sequelizeCon, DataTypes);
          continue;
        }

        continue;
      }

      const maybeModel = await exp(sequelizeCon, DataTypes);
      if (!maybeModel) {
        console.warn(`[models] ${path.relative(modelsDir, file)}: la fábrica no devolvió un modelo`);
      }
      continue;
    }

    const initFn = mod.initModel || mod.register || mod.init;
    if (typeof initFn === 'function') {
      await initFn(sequelizeCon, DataTypes);
      continue;
    }

    console.warn(`[models] No se pudo cargar: ${path.relative(modelsDir, file)} (export no soportado)`);
  }

  const models = sequelizeCon.models;
  Object.values(models).forEach((m) => {
    if (typeof m.associate === 'function') m.associate(models);
  });
}

export async function initDatabase() {
  let retries = 0, lastErr;
  while (retries < RETRY_LIMIT) {
    try {
      await sequelizeCon.authenticate();
      break;
    } catch (err) {
      lastErr = err;
      retries++;
      if (retries >= RETRY_LIMIT) throw lastErr;
      await new Promise((res) => setTimeout(res, RETRY_INTERVAL_MS));
    }
  }

  await loadAllModels();
}
