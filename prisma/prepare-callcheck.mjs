import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  try {
    const deleted = await db.$executeRawUnsafe('DELETE FROM "OtpCode"');
    console.log(`[entrypoint] Удалено временных проверок телефона: ${deleted}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("no such table")) {
      console.log("[entrypoint] Таблица временных проверок будет создана впервые");
      return;
    }
    throw error;
  }
}

main()
  .finally(async () => {
    await db.$disconnect();
  })
  .catch((error) => {
    console.error("[entrypoint] Не удалось подготовить таблицу временных проверок", error);
    process.exit(1);
  });
