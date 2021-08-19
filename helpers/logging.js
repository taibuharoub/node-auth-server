import path from "path";
import fs from "fs";

const __dirname = path.resolve();

export const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "./logs/access.log"),
  { flags: "a" }
);
