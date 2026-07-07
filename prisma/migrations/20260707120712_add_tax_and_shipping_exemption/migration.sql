-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "chargeShipping" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "taxOverridePercent" DECIMAL(5,2),
ADD COLUMN     "taxable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "taxEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taxPercentage" DECIMAL(5,2) NOT NULL DEFAULT 9;
