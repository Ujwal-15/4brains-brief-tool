import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash("ujwal123", 10);
  const pmPass = await bcrypt.hash("priya123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "ujwal@4brains.in" },
    update: { name: "Ujwal", role: "ADMIN", password: adminPass },
    create: {
      name: "Ujwal",
      email: "ujwal@4brains.in",
      password: adminPass,
      role: "ADMIN",
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: "priya@4brains.in" },
    update: { name: "Priya", role: "PM", password: pmPass },
    create: {
      name: "Priya",
      email: "priya@4brains.in",
      password: pmPass,
      role: "PM",
    },
  });

  console.log(`Seeded admin: ${admin.email} (id=${admin.id})`);
  console.log(`Seeded PM:    ${pm.email} (id=${pm.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
