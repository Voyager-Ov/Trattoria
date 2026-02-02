-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoAuditAction" ADD VALUE 'CREATE_EXPENSE';
ALTER TYPE "TipoAuditAction" ADD VALUE 'UPDATE_EXPENSE';
ALTER TYPE "TipoAuditAction" ADD VALUE 'DELETE_EXPENSE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "permisos" TEXT[] DEFAULT ARRAY[]::TEXT[];
