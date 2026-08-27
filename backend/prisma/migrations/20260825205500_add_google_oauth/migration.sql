-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL,
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "authProvider" TEXT NOT NULL DEFAULT 'email';

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
