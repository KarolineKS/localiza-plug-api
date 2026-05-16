import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { serializeStation, toStatus, toConnector, toPrice } from '../lib/stationMappers';

interface StationBody {
  id?: string;
  name?: string;
  lat?: number;
  lng?: number;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  status?: string;
  connector?: string;
  powerKW?: number;
  price?: string;
}

function parseStationBody(body: StationBody, partial: boolean) {
  const data: Prisma.StationUncheckedCreateInput | Prisma.StationUncheckedUpdateInput = {};
  const errors: string[] = [];

  const stringField = (key: keyof StationBody) => {
    const v = body[key];
    if (v === undefined) {
      if (!partial) errors.push(`${key} é obrigatório`);
      return;
    }
    if (typeof v !== 'string' || !v.trim()) errors.push(`${key} inválido`);
    else (data as any)[key] = v;
  };

  const numberField = (key: keyof StationBody) => {
    const v = body[key];
    if (v === undefined) {
      if (!partial) errors.push(`${key} é obrigatório`);
      return;
    }
    if (typeof v !== 'number' || Number.isNaN(v)) errors.push(`${key} inválido`);
    else (data as any)[key] = v;
  };

  stringField('name');
  numberField('lat');
  numberField('lng');
  stringField('address');
  stringField('neighborhood');
  if (body.city !== undefined) stringField('city');
  if (body.state !== undefined) stringField('state');
  numberField('powerKW');

  if (body.status !== undefined) {
    const s = toStatus(body.status);
    if (!s) errors.push(`status inválido: "${body.status}"`);
    else data.status = s;
  } else if (!partial) errors.push('status é obrigatório');

  if (body.connector !== undefined) {
    const c = toConnector(body.connector);
    if (!c) errors.push(`connector inválido: "${body.connector}"`);
    else data.connector = c;
  } else if (!partial) errors.push('connector é obrigatório');

  if (body.price !== undefined) {
    const p = toPrice(body.price);
    if (!p) errors.push(`price inválido: "${body.price}"`);
    else data.price = p;
  } else if (!partial) errors.push('price é obrigatório');

  if (body.id !== undefined && typeof body.id === 'string' && body.id.trim()) {
    (data as Prisma.StationUncheckedCreateInput).id = body.id;
  }

  return { data, errors };
}

export async function createStation(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, errors } = parseStationBody(req.body ?? {}, false);
    if (errors.length) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: errors.join('; ') },
      });
    }

    const station = await prisma.station.create({
      data: data as Prisma.StationUncheckedCreateInput,
    });

    res.status(201).json({ data: serializeStation(station) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return res.status(409).json({
        error: { code: 'ID_TAKEN', message: 'Já existe eletroposto com esse id.' },
      });
    }
    next(err);
  }
}

export async function updateStation(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { data, errors } = parseStationBody(req.body ?? {}, true);
    if (errors.length) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: errors.join('; ') },
      });
    }

    const station = await prisma.station.update({
      where: { id },
      data,
    });

    res.json({ data: serializeStation(station) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({
        error: { code: 'STATION_NOT_FOUND', message: `Eletroposto ${req.params.id} não encontrado.` },
      });
    }
    next(err);
  }
}

export async function deleteStation(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.station.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({
        error: { code: 'STATION_NOT_FOUND', message: `Eletroposto ${req.params.id} não encontrado.` },
      });
    }
    next(err);
  }
}
