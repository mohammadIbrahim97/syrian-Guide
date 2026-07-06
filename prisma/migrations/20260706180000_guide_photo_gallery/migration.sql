-- CreateTable
CREATE TABLE "GuidePhoto" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuidePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuidePhoto_guideId_idx" ON "GuidePhoto"("guideId");

-- AddForeignKey
ALTER TABLE "GuidePhoto" ADD CONSTRAINT "GuidePhoto_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Lock down the Supabase Data API (PostgREST) for the new table, matching
-- 20260704183648_enable_rls_lockdown: RLS on, no policies. The app's Prisma
-- connection runs as the table owner and bypasses RLS.
ALTER TABLE "GuidePhoto" ENABLE ROW LEVEL SECURITY;
