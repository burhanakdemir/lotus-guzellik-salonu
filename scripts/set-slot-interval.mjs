import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const minutes = Number(process.argv[2] || 30);

await prisma.salonSettings.update({
  where: { id: "default" },
  data: { slotInterval: minutes },
});
console.log(`slotInterval = ${minutes} dk`);
await prisma.$disconnect();
