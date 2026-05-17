import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { verifyAdminPassword, signAdminToken } from '../lib/auth';

interface PlugBody {
  connectorType?: unknown;
  powerKW?: unknown;
  status?: unknown;
  pricePerKWh?: unknown;
  priceType?: unknown;
}

function validatePlug(p: PlugBody, idx: number, errors: string[]) {
  const path = `plugs[${idx}]`;
  if (typeof p.connectorType !== 'string' || !p.connectorType) errors.push(`${path}.connectorType obrigatório`);
  if (typeof p.powerKW !== 'number' || Number.isNaN(p.powerKW)) errors.push(`${path}.powerKW obrigatório (number)`);
  if (typeof p.status !== 'string' || !p.status) errors.push(`${path}.status obrigatório`);
  if (typeof p.pricePerKWh !== 'number' || Number.isNaN(p.pricePerKWh)) errors.push(`${path}.pricePerKWh obrigatório (number)`);
  if (typeof p.priceType !== 'string' || !p.priceType) errors.push(`${path}.priceType obrigatório`);
}

interface StationBody {
  name?: unknown;
  lat?: unknown;
  lng?: unknown;
  address?: unknown;
  neighborhood?: unknown;
  city?: unknown;
  state?: unknown;
  plugs?: unknown;
}

function validateStationBody(body: StationBody, partial: boolean) {
  const errors: string[] = [];
  const str = (k: keyof StationBody, required: boolean) => {
    const v = body[k];
    if (v === undefined) {
      if (required && !partial) errors.push(`${k} obrigatório`);
      return undefined;
    }
    if (typeof v !== 'string' || !v.trim()) {
      errors.push(`${k} inválido`);
      return undefined;
    }
    return v;
  };
  const num = (k: keyof StationBody, required: boolean) => {
    const v = body[k];
    if (v === undefined) {
      if (required && !partial) errors.push(`${k} obrigatório`);
      return undefined;
    }
    if (typeof v !== 'number' || Number.isNaN(v)) {
      errors.push(`${k} inválido`);
      return undefined;
    }
    return v;
  };

  const data: Record<string, unknown> = {};
  const name = str('name', true); if (name !== undefined) data.name = name;
  const lat = num('lat', true); if (lat !== undefined) data.lat = lat;
  const lng = num('lng', true); if (lng !== undefined) data.lng = lng;
  const address = str('address', true); if (address !== undefined) data.address = address;
  const neighborhood = str('neighborhood', true); if (neighborhood !== undefined) data.neighborhood = neighborhood;
  const city = str('city', false); if (city !== undefined) data.city = city;
  const state = str('state', false); if (state !== undefined) data.state = state;

  let plugs: PlugBody[] | undefined;
  if (body.plugs !== undefined) {
    if (!Array.isArray(body.plugs)) {
      errors.push('plugs deve ser array');
    } else {
      plugs = body.plugs as PlugBody[];
      plugs.forEach((p, i) => validatePlug(p, i, errors));
    }
  } else if (!partial) {
    errors.push('plugs obrigatório');
  }

  return { data, plugs, errors };
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { password } = req.body ?? {};
    if (typeof password !== 'string' || !password) {
      return res.status(400).json({
        error: { code: 'INVALID_PASSWORD', message: 'Senha incorreta' },
      });
    }
    const ok = await verifyAdminPassword(password);
    if (!ok) {
      return res.status(401).json({
        error: { code: 'INVALID_PASSWORD', message: 'Senha incorreta' },
      });
    }
    res.json({ token: signAdminToken() });
  } catch (err) {
    next(err);
  }
}

export async function createStation(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, plugs, errors } = validateStationBody(req.body ?? {}, false);
    if (errors.length) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: errors.join('; ') } });
    }

    const station = await prisma.station.create({
      data: {
        ...(data as Prisma.StationUncheckedCreateInput),
        plugs: { create: plugs as Prisma.PlugCreateWithoutStationInput[] },
      },
      include: { plugs: true },
    });

    res.status(201).json({ data: station });
  } catch (err) {
    next(err);
  }
}

export async function updateStation(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { data, plugs, errors } = validateStationBody(req.body ?? {}, true);
    if (errors.length) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: errors.join('; ') } });
    }

    const exists = await prisma.station.findUnique({ where: { id }, select: { id: true } });
    if (!exists) {
      return res.status(404).json({ error: { code: 'STATION_NOT_FOUND', message: `Estação ${id} não encontrada.` } });
    }

    const station = await prisma.$transaction(async (tx) => {
      await tx.station.update({ where: { id }, data: data as Prisma.StationUncheckedUpdateInput });
      if (plugs) {
        await tx.plug.deleteMany({ where: { stationId: id } });
        await tx.plug.createMany({
          data: plugs.map((p) => ({ ...(p as Prisma.PlugUncheckedCreateInput), stationId: id })),
        });
      }
      return tx.station.findUniqueOrThrow({ where: { id }, include: { plugs: true } });
    });

    res.json({ data: station });
  } catch (err) {
    next(err);
  }
}

export async function deleteStation(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.station.delete({ where: { id: req.params.id } });
    res.json({ data: { deleted: true, id: req.params.id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({
        error: { code: 'STATION_NOT_FOUND', message: `Estação ${req.params.id} não encontrada.` },
      });
    }
    next(err);
  }
}

export async function reservePlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { plugId } = req.params;
    const { durationSeconds } = req.body ?? {};
    const seconds = typeof durationSeconds === 'number' && durationSeconds > 0 ? durationSeconds : 900;

    const reservedUntil = new Date(Date.now() + seconds * 1000);

    const plug = await prisma.plug.update({
      where: { id: plugId },
      data: { status: 'Reservado', reservedUntil },
    });

    res.json({ data: plug });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({
        error: { code: 'PLUG_NOT_FOUND', message: `Plug ${req.params.plugId} não encontrado.` },
      });
    }
    next(err);
  }
}
