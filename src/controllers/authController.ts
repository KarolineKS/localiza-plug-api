import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword, signToken } from "../lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== "string" || !EMAIL_RE.test(email)) {
      return res.status(400).json({
        error: { code: "INVALID_EMAIL", message: "E-mail inválido." },
      });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        error: {
          code: "WEAK_PASSWORD",
          message: "Senha deve ter ao menos 6 caracteres.",
        },
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), passwordHash },
      select: { id: true, email: true, createdAt: true },
    });

    const token = signToken({ sub: user.id, email: user.email });

    res.status(201).json({ data: { user, token } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return res.status(409).json({
        error: { code: "EMAIL_TAKEN", message: "E-mail já cadastrado." },
      });
    }
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Envie email e password.",
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "E-mail ou senha incorretos.",
        },
      });
    }

    const token = signToken({ sub: user.id, email: user.email });

    res.json({
      data: {
        user: { id: user.id, email: user.email, createdAt: user.createdAt },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Não autenticado." },
      });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, email: true, createdAt: true },
    });
    if (!user) {
      return res.status(404).json({
        error: { code: "USER_NOT_FOUND", message: "Usuário não encontrado." },
      });
    }
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}
