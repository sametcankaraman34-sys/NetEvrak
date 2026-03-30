import type { PrismaClient } from "@prisma/client";
import type { UserRole } from "@prisma/client";

const DEFAULT_ORG_NAME = "NetEvrak Demo Org";
const DEFAULT_USER_EMAIL = "demo@netevrak.local";
const DEFAULT_USER_NAME = "Demo Kullanici";
const DEFAULT_USER_ROLE: UserRole = "ADMIN";

export async function ensureDefaultOrgAndUser(prisma: PrismaClient): Promise<{
  organizationId: string;
  userId: string;
}> {
  const existingUser = await prisma.user.findUnique({
    where: { email: DEFAULT_USER_EMAIL },
    select: { id: true, organizationId: true },
  });

  if (existingUser) {
    return { organizationId: existingUser.organizationId, userId: existingUser.id };
  }

  const existingOrg = await prisma.organization.findFirst({
    where: { name: DEFAULT_ORG_NAME },
    select: { id: true },
  });

  const org = existingOrg
    ? existingOrg
    : await prisma.organization.create({
        data: { name: DEFAULT_ORG_NAME },
        select: { id: true },
      });

  const user = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: DEFAULT_USER_NAME,
      email: DEFAULT_USER_EMAIL,
      role: DEFAULT_USER_ROLE,
    },
    select: { id: true, organizationId: true },
  });

  return { organizationId: user.organizationId, userId: user.id };
}

