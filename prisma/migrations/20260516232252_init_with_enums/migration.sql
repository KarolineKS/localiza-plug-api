-- CreateEnum
CREATE TYPE "StationStatus" AS ENUM ('DISPONIVEL', 'OCUPADO', 'EM_MANUTENCAO', 'RESERVADO');

-- CreateEnum
CREATE TYPE "StationConnector" AS ENUM ('CCS2', 'TIPO_2', 'CHADEMO');

-- CreateEnum
CREATE TYPE "StationPrice" AS ENUM ('GRATUITO', 'PAGO');

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
    "status" "StationStatus" NOT NULL,
    "connector" "StationConnector" NOT NULL,
    "powerKW" INTEGER NOT NULL,
    "price" "StationPrice" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stations_status_idx" ON "stations"("status");

-- CreateIndex
CREATE INDEX "stations_connector_idx" ON "stations"("connector");

-- CreateIndex
CREATE INDEX "stations_city_idx" ON "stations"("city");
