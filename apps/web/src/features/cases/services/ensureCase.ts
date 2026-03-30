import type { PrismaClient } from "@prisma/client";

import { ensureDefaultOrgAndUser } from "@/lib/db/devSeed";

const FIXED_SECTOR = "accounting";

export async function ensureCaseById(prisma: PrismaClient, caseId: string): Promise<{
  id: string;
  sector: string;
}> {
  const existing = await prisma.case.findUnique({
    where: { id: caseId },
    select: { id: true, sector: true },
  });

  if (existing) return existing;

  const { organizationId, userId } = await ensureDefaultOrgAndUser(prisma);

  const created = await prisma.case.create({
    data: {
      id: caseId,
      organizationId,
      title: `Case ${caseId}`,
      sector: FIXED_SECTOR,
      status: "CREATED",
      createdById: userId,
    },
    select: { id: true, sector: true },
  });

  return created;
}

