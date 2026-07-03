-- CreateTable
CREATE TABLE "PageSection" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pack" TEXT,
    "price" TEXT NOT NULL,
    "oldPrice" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "image" TEXT,
    "featuredTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageSection_page_idx" ON "PageSection"("page");

-- CreateIndex
CREATE UNIQUE INDEX "PageSection_page_sectionKey_key" ON "PageSection"("page", "sectionKey");

-- CreateIndex
CREATE INDEX "Product_featuredTags_idx" ON "Product" USING GIN ("featuredTags");

-- CreateIndex
CREATE UNIQUE INDEX "LoginAttempt_email_key" ON "LoginAttempt"("email");
