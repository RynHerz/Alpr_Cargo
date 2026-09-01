-- CreateTable
CREATE TABLE "Detection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" BIGINT NOT NULL,
    "sourceImageUrl" TEXT NOT NULL,
    "plateCropImageUrl" TEXT NOT NULL,
    "enhancedPlateImageUrl" TEXT,
    "plateNumber" TEXT NOT NULL,
    "formattedPlate" TEXT NOT NULL,
    "expiryDate" TEXT,
    "confidence" REAL NOT NULL,
    "bboxX" REAL NOT NULL,
    "bboxY" REAL NOT NULL,
    "bboxWidth" REAL NOT NULL,
    "bboxHeight" REAL NOT NULL,
    "method" TEXT NOT NULL,
    "vehicleType" TEXT,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "processingTimeMs" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CargoManifest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "detectionId" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "driverPhone" TEXT,
    "companyName" TEXT,
    "destination" TEXT,
    "documentNumber" TEXT,
    "cargoCategory" TEXT,
    "loadStatus" TEXT NOT NULL,
    "totalWeightKg" REAL,
    "totalItemsCount" INTEGER,
    "sealNumber" TEXT,
    "inspectionStatus" TEXT NOT NULL,
    "inspectorNotes" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CargoManifest_detectionId_fkey" FOREIGN KEY ("detectionId") REFERENCES "Detection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CargoItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manifestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "weightKg" REAL,
    "notes" TEXT,
    CONSTRAINT "CargoItem_manifestId_fkey" FOREIGN KEY ("manifestId") REFERENCES "CargoManifest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WhitelistRule" (
    "plateNumber" TEXT NOT NULL PRIMARY KEY,
    "ownerName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "notes" TEXT,
    "addedAt" BIGINT NOT NULL
);

-- CreateIndex
CREATE INDEX "Detection_plateNumber_idx" ON "Detection"("plateNumber");

-- CreateIndex
CREATE INDEX "Detection_status_idx" ON "Detection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CargoManifest_detectionId_key" ON "CargoManifest"("detectionId");
