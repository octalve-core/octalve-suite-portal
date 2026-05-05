import "dotenv/config";
import { prisma } from "./src/lib/prisma";

async function main() {
  try {
    console.log("Connecting to database...");
    const userCount = await prisma.user.count();
    console.log("Connection successful!");
    console.log("User count:", userCount);
  } catch (error) {
    console.error("Connection failed!");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
