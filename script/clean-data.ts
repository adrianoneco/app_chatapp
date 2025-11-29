import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { messages, conversations } from "../shared/schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function clean() {
  console.log("🧹 Cleaning messages and conversations...");
  
  try {
    await db.delete(messages);
    console.log("✅ Messages deleted");
    
    await db.delete(conversations);
    console.log("✅ Conversations deleted");
    
    console.log("🎉 Database cleaned!");
  } catch (error) {
    console.error("❌ Error cleaning database:", error);
  } finally {
    await client.end();
  }
}

clean();
