import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "../shared/schema";
import argon2 from "argon2";
import { sql, eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function updatePasswords() {
  console.log("🔐 Updating user passwords to argon2id...");

  const hash = await argon2.hash("123456", {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4
  });

  console.log("Generated hash:", hash);

  const allUsers = await db.select().from(users);
  
  for (const user of allUsers) {
    await db.update(users)
      .set({ password: hash })
      .where(eq(users.id, user.id));
    console.log(`✅ Updated password for ${user.email}`);
  }

  console.log("🎉 All passwords updated!");
  await client.end();
}

updatePasswords().catch(console.error);
