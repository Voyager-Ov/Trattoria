import fs from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();
const generatedClientDir = path.join(workspaceRoot, "node_modules", ".prisma", "client");
const prismaClientDir = path.join(workspaceRoot, "node_modules", "@prisma", "client");

if (!fs.existsSync(generatedClientDir) || !fs.existsSync(prismaClientDir)) {
  process.exit(0);
}

for (const fileName of fs.readdirSync(generatedClientDir)) {
  if (!fileName.endsWith(".d.ts")) {
    continue;
  }

  fs.copyFileSync(
    path.join(generatedClientDir, fileName),
    path.join(prismaClientDir, fileName),
  );
}
