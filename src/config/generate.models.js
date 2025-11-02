import { execSync } from "child_process";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.join(__dirname, "src", "model_db");

if (fs.existsSync(modelsDir)) {
  fs.rmSync(modelsDir, { recursive: true, force: true });
  console.log("Old models removed.");
}

const cmd = `npx sequelize-auto \
  -h ${process.env.DB_HOST} \
  -d ${process.env.DB_NAME} \
  -u ${process.env.DB_USER_DEV} \
  -p ${process.env.DB_PORT} \
  -x ${process.env.DB_PASS_DEV} \
  -e postgres \
  -o ./src/model_db \
  -l esm \
  -a ./src/config/sequelize-additional.json`;

try {
  console.log("Generating models with sequelize-auto (PostgreSQL + ESM)...");
  execSync(cmd, { stdio: "inherit" });
  console.log("Models generated successfully.");
} catch (error) {
  console.error("Failed to generate models:", error.message);
}
