-- DropIndex
DROP INDEX "CompanyQuestion_companyId_period_idx";

-- CreateIndex
CREATE INDEX "Bookmark_userId_questionId_idx" ON "Bookmark"("userId", "questionId");

-- CreateIndex
CREATE INDEX "CompanyQuestion_companyId_period_frequency_idx" ON "CompanyQuestion"("companyId", "period", "frequency" DESC);

-- CreateIndex
CREATE INDEX "CompanyQuestion_companyId_period_acceptanceRate_idx" ON "CompanyQuestion"("companyId", "period", "acceptanceRate" DESC);

-- CreateIndex
CREATE INDEX "Progress_userId_questionId_idx" ON "Progress"("userId", "questionId");
