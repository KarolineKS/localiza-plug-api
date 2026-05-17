import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

const SOURCE = 'LocalizaPlug API v1';

export async function listStations(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, connector, minPower, priceType, city } = req.query;

    const plugConditions: Prisma.PlugWhereInput = {};
    if (typeof status === 'string' && status) plugConditions.status = status;
    if (typeof connector === 'string' && connector) plugConditions.connectorType = connector;
    if (typeof priceType === 'string' && priceType) plugConditions.priceType = priceType;
    if (typeof minPower === 'string' && minPower) {
      const min = Number(minPower);
      if (!Number.isNaN(min)) plugConditions.powerKW = { gte: min };
    }

    const where: Prisma.StationWhereInput = {};
    if (Object.keys(plugConditions).length > 0) {
      where.plugs = { some: plugConditions };
    }
    if (typeof city === 'string' && city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    const stations = await prisma.station.findMany({
      where,
      include: { plugs: true },
      orderBy: { name: 'asc' },
    });

    res.json({
      data: stations,
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
    const station = await prisma.station.findUnique({
      where: { id: req.params.id },
      include: { plugs: true },
    });

    if (!station) {
      return res.status(404).json({
        error: { code: 'STATION_NOT_FOUND', message: `Estação ${req.params.id} não encontrada.` },
      });
    }

    res.json({
      data: station,
      meta: { total: 1, timestamp: new Date().toISOString(), source: SOURCE },
    });
  } catch (err) {
    next(err);
  }
}
