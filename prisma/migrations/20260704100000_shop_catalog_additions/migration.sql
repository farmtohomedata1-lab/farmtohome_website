-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- AlterTable: add new nullable/defaulted columns first, plus a staging
-- column for the price type change (String -> Decimal can't be cast
-- directly since values are stored like "$36.00").
ALTER TABLE "Product"
    ADD COLUMN "compareAtPrice" DECIMAL(10, 2),
    ADD COLUMN "discountActive" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "isOnSale" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "inStock" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "categoryId" TEXT,
    ADD COLUMN "brandId" TEXT,
    ADD COLUMN "price_new" DECIMAL(10, 2);

-- DataMigration: strip non-numeric characters (e.g. "$36.00" -> 36.00) to
-- backfill the new numeric price column.
UPDATE "Product"
SET "price_new" = NULLIF(regexp_replace("price", '[^0-9.]', '', 'g'), '')::DECIMAL(10, 2);

-- DataMigration: same parse for the old string oldPrice -> compareAtPrice.
UPDATE "Product"
SET "compareAtPrice" = NULLIF(regexp_replace("oldPrice", '[^0-9.]', '', 'g'), '')::DECIMAL(10, 2)
WHERE "oldPrice" IS NOT NULL;

-- DataMigration: only mark a product as actively discounted if the parsed
-- compare-at price is genuinely greater than the new price, matching the
-- "on sale" business rule exactly (discountActive && compareAtPrice > price).
UPDATE "Product"
SET "discountActive" = true, "isOnSale" = true
WHERE "compareAtPrice" IS NOT NULL AND "compareAtPrice" > "price_new";

-- AlterTable: drop the old string columns, promote price_new to price.
ALTER TABLE "Product" DROP COLUMN "price";
ALTER TABLE "Product" DROP COLUMN "oldPrice";
ALTER TABLE "Product" RENAME COLUMN "price_new" TO "price";
ALTER TABLE "Product" ALTER COLUMN "price" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
