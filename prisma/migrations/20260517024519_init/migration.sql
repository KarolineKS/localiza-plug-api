-- CreateTable
CREATE TABLE "stations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Pelotas',
    "state" TEXT NOT NULL DEFAULT 'RS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plugs" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "connectorType" TEXT NOT NULL,
    "powerKW" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "pricePerKWh" DOUBLE PRECISION NOT NULL,
    "priceType" TEXT NOT NULL,
    "reservedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plugs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stations_city_idx" ON "stations"("city");

-- CreateIndex
CREATE INDEX "plugs_stationId_idx" ON "plugs"("stationId");

-- CreateIndex
CREATE INDEX "plugs_status_idx" ON "plugs"("status");

-- CreateIndex
CREATE INDEX "plugs_connectorType_idx" ON "plugs"("connectorType");

-- AddForeignKey
ALTER TABLE "plugs" ADD CONSTRAINT "plugs_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
