-- Existing production table: baseline with migrate resolve only after confirming
-- that the live table matches this definition. New databases create it normally.
CREATE TABLE "VerificationCode" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VerificationCode_email_idx" ON "VerificationCode"("email");
