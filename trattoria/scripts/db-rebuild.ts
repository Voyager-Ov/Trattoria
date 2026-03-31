import { execSync } from "node:child_process";

const steps = [
  {
    label: "Resetting database schema",
    command: "npx prisma db push --force-reset --accept-data-loss --skip-generate",
  },
  {
    label: "Generating Prisma client",
    command: "npx prisma generate",
  },
  {
    label: "Seeding master data",
    command: "npm run db:seed",
  },
];

for (const step of steps) {
  console.log(`\n==> ${step.label}`);
  execSync(step.command, { stdio: "inherit" });
}

console.log("\nDatabase rebuild completed.");
