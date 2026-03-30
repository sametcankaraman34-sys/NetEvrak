import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prismaClientSingleton = (() => {
  // Next.js dev ortamında hot-reload sırasında birden fazla client oluşmasını engeller.
  const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
  };

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = undefined;
  }

  const getPrisma = () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL_MISSING");
    }

    if (!globalForPrisma.prisma) {
      const adapter = new PrismaPg({ connectionString });
      globalForPrisma.prisma = new PrismaClient({ adapter });
    }

    return globalForPrisma.prisma;
  };

  return { getPrisma };
})();

export const getPrisma = prismaClientSingleton.getPrisma;

export function getPrismaOrNull(): PrismaClient | null {
  try {
    return getPrisma();
  } catch {
    return null;
  }
}

