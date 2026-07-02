-- CreateEnum
CREATE TYPE "GuideType" AS ENUM ('STUDENT', 'PROFESSIONAL');

-- DropForeignKey
ALTER TABLE "Tour" DROP CONSTRAINT "Tour_guideId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_tourId_fkey";

-- AlterTable
ALTER TABLE "Guide" ADD COLUMN     "guideType" "GuideType" NOT NULL DEFAULT 'STUDENT',
ADD COLUMN     "hourlyRate" DOUBLE PRECISION,
ADD COLUMN     "maxGroupSize" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "packageDuration" INTEGER,
ADD COLUMN     "packagePrice" DOUBLE PRECISION,
ADD COLUMN     "university" TEXT;

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "tourId",
ADD COLUMN     "durationHours" INTEGER,
ADD COLUMN     "guideId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Tour";

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
