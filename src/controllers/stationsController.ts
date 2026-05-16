import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { serializeStation, toStatus, toConnector } from '../lib/stationMappers';

const SOURCE = 'LocalizaPlug API v1';

export async function listStations(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, connector, minPower, city } = req.query;

    const where: Prisma.StationWhereInput = {};

    if (typeof status === 'string' && status) {
      const mapped = toStatus(status);
      if (!mapped) {
        return res.status(400).json({
          error: { code: 'INVALID_STATUS', message: `Status inválido: "${status}".` },
        });
      }
      where.status = mapped;
    }

    if (typeof connector === 'string' && connector) {
      const mapped = toConnector(connector);
      if (!mapped) {
        return res.status(400).json({
          error: { code: 'INVALID_CONNECTOR', message: `Conector inválido: "${connector}".` },
        });
      }
      where.connector = mapped;
    }

    if (typeof city === 'string' && city) where.city = city;

    if (typeof minPower === 'string' && minPower) {
      const min = Number(minPower);
      if (!Number.isNaN(min)) where.powerKW = { gte: min };
    }

    const stations = await prisma.station.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json({
      data: stations.map(serializeStation),
      meta: {
        total: stations.length,
        timestamp: new Date().toISOString(),
        source: SOURCE,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getStation(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const station = await prisma.station.findUnique({ where: { id } });

    if (!station) {
      return res.status(404).json({
        error: { code: 'STATION_NOT_FOUND', message: `Eletroposto ${id} não encontrado.` },
      });
    }

    res.json({
      data: serializeStation(station),
      meta: {
        total: 1,
        timestamp: new Date().toISOString(),
        source: SOURCE,
      },
    });
  } catch (err) {
    next(err);
  }
}
