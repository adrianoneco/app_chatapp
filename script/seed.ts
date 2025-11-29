import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, conversations, messages, channels } from "../shared/schema";
import argon2 from "argon2";

// Hash function matching auth system
async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4
  });
}

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Create users
    console.log("Creating users...");
    const hashedPassword = await hashPassword("123456");

    // Check if conversations already exist
    const existingConversations = await db.select().from(conversations);
    if (existingConversations.length > 0) {
      console.log("⚠️  Conversations already exist, skipping seed");
      console.log("🎉 Database already seeded!");
      return;
    }
    
    // Get or create users
    let client1, client2, client3, attendant1, attendant2;
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length >= 5) {
      console.log("✅ Using existing users");
      [client1, client2, client3, attendant1, attendant2] = existingUsers;
    } else {
      console.log("Creating new users...");
      
      [client1] = await db.insert(users).values({
        email: "maria.silva@email.com",
        password: hashedPassword,
        name: "Maria Silva",
        mobilePhone: "+55 11 99999-1234",
        role: "client",
      }).returning();

    const [client2] = await db.insert(users).values({
      email: "joao.santos@email.com",
      password: hashedPassword,
      name: "João Santos",
      mobilePhone: "+55 11 98888-5678",
      role: "client",
    }).returning();

    const [client3] = await db.insert(users).values({
      email: "ana.costa@email.com",
      password: hashedPassword,
      name: "Ana Costa",
      mobilePhone: "+55 11 97777-9012",
      role: "client",
    }).returning();

    const [attendant1] = await db.insert(users).values({
      email: "suporte@empresa.com",
      password: hashedPassword,
      name: "Suporte",
      role: "admin",
    }).returning();

      [attendant2] = await db.insert(users).values({
        email: "carlos.santos@empresa.com",
        password: hashedPassword,
        name: "Carlos Santos",
        mobilePhone: "+55 11 98765-4321",
        role: "admin",
      }).returning();

      console.log("✅ Users created");
    }

    // Create channels
    console.log("Creating channels...");
    const existingChannels = await db.select().from(channels);
    let whatsappChannel, webChannel;
    
    if (existingChannels.length > 0) {
      console.log("✅ Using existing channels");
      whatsappChannel = existingChannels.find(c => c.type === 'whatsapp') || existingChannels[0];
      webChannel = existingChannels.find(c => c.type === 'web') || existingChannels[1] || existingChannels[0];
    } else {
      [whatsappChannel] = await db.insert(channels).values({
        name: "WhatsApp Principal",
        slug: "whatsapp-principal",
        type: "whatsapp",
        phoneNumber: "+55 11 99999-0000",
        isActive: true,
      }).returning();

      [webChannel] = await db.insert(channels).values({
        name: "Chat Web",
        slug: "chat-web",
        type: "web",
        isActive: true,
      }).returning();

      console.log("✅ Channels created");
    }

    // Create conversations
    console.log("Creating conversations...");
    const [conv1] = await db.insert(conversations).values({
      protocol: "ATD-2024-001234",
      clientId: client1.id,
      attendantId: attendant1.id,
      channelId: whatsappChannel.id,
      status: "open",
      priority: "high",
      subject: "Problemas com pedido #12345",
      city: "São Paulo",
      state: "SP",
      country: "Brasil",
    }).returning();

    const [conv2] = await db.insert(conversations).values({
      protocol: "ATD-2024-001235",
      clientId: client2.id,
      attendantId: attendant1.id,
      channelId: webChannel.id,
      status: "pending",
      priority: "normal",
      subject: "Dúvida sobre garantia",
      city: "Rio de Janeiro",
      state: "RJ",
      country: "Brasil",
    }).returning();

    const [conv3] = await db.insert(conversations).values({
      protocol: "ATD-2024-001236",
      clientId: client3.id,
      status: "closed",
      priority: "low",
      subject: "Informações de produto",
      city: "Belo Horizonte",
      state: "MG",
      country: "Brasil",
      closedAt: new Date(),
    }).returning();

    console.log("✅ Conversations created");

    // Create messages
    console.log("Creating messages...");
    
    // Conversation 1 messages
    const [msg1] = await db.insert(messages).values({
      conversationId: conv1.id,
      senderId: client1.id,
      senderType: "client",
      senderName: client1.name,
      content: "Olá, preciso de ajuda com meu pedido #12345",
      contentType: "text",
      status: "read",
      readAt: new Date(Date.now() - 3550000),
      createdAt: new Date(Date.now() - 3600000),
    }).returning();

    const [msg2] = await db.insert(messages).values({
      conversationId: conv1.id,
      senderId: attendant1.id,
      senderType: "attendant",
      senderName: attendant1.name,
      content: "Olá Maria! Claro, vou verificar o status do seu pedido. Um momento por favor.",
      contentType: "text",
      status: "read",
      readAt: new Date(Date.now() - 3450000),
      createdAt: new Date(Date.now() - 3500000),
    }).returning();

    await db.insert(messages).values({
      conversationId: conv1.id,
      senderId: attendant1.id,
      senderType: "attendant",
      senderName: attendant1.name,
      content: "https://picsum.photos/400/300",
      contentType: "image",
      fileUrl: "https://picsum.photos/400/300",
      metadata: JSON.stringify({ caption: "Aqui está o código de rastreamento do seu pedido" }),
      status: "read",
      readAt: new Date(Date.now() - 3350000),
      createdAt: new Date(Date.now() - 3400000),
    });

    await db.insert(messages).values({
      conversationId: conv1.id,
      senderId: client1.id,
      senderType: "client",
      senderName: client1.name,
      content: "Obrigada! Mas não recebi o código de rastreamento ainda.",
      contentType: "text",
      quotedMessageId: msg2.id,
      status: "delivered",
      deliveredAt: new Date(Date.now() - 1750000),
      createdAt: new Date(Date.now() - 1800000),
    });

    await db.insert(messages).values({
      conversationId: conv1.id,
      senderId: attendant1.id,
      senderType: "attendant",
      senderName: attendant1.name,
      content: "Gravei um áudio explicando o processo",
      contentType: "audio",
      fileUrl: "/audio.mp3",
      duration: 45,
      status: "read",
      readAt: new Date(Date.now() - 1650000),
      createdAt: new Date(Date.now() - 1700000),
    });

    await db.insert(messages).values({
      conversationId: conv1.id,
      senderId: client1.id,
      senderType: "client",
      senderName: client1.name,
      content: "Aqui está o vídeo do problema",
      contentType: "video",
      fileUrl: "/video.mp4",
      thumbnail: "https://picsum.photos/400/225",
      duration: 120,
      metadata: JSON.stringify({ caption: "O produto chegou com defeito" }),
      status: "sent",
      createdAt: new Date(Date.now() - 1600000),
    });

    await db.insert(messages).values({
      conversationId: conv1.id,
      senderId: attendant1.id,
      senderType: "attendant",
      senderName: attendant1.name,
      content: "Segue o contato do gerente para resolver isso",
      contentType: "contact",
      metadata: JSON.stringify({
        name: "Carlos Santos - Gerente",
        phone: "+55 11 98765-4321",
        email: "carlos.santos@empresa.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos"
      }),
      status: "delivered",
      deliveredAt: new Date(Date.now() - 1450000),
      isPrivate: true,
      createdAt: new Date(Date.now() - 1500000),
    });

    await db.insert(messages).values({
      conversationId: conv1.id,
      senderId: client1.id,
      senderType: "client",
      senderName: client1.name,
      content: "Essa música me lembra do problema rsrs",
      contentType: "music",
      fileUrl: "/music.mp3",
      metadata: JSON.stringify({
        title: "Don't Stop Me Now",
        artist: "Queen",
        album: "Jazz",
        albumArt: "https://picsum.photos/200/200",
        duration: 209
      }),
      status: "read",
      readAt: new Date(Date.now() - 1350000),
      createdAt: new Date(Date.now() - 1400000),
    });

    await db.insert(messages).values({
      conversationId: conv1.id,
      senderId: attendant1.id,
      senderType: "attendant",
      senderName: attendant1.name,
      content: "Vou resolver isso para você!",
      contentType: "text",
      isForwarded: true,
      status: "delivered",
      deliveredAt: new Date(Date.now() - 1250000),
      createdAt: new Date(Date.now() - 1300000),
    });

    // Conversation 2 messages
    await db.insert(messages).values({
      conversationId: conv2.id,
      senderId: client2.id,
      senderType: "client",
      senderName: client2.name,
      content: "Qual o prazo de garantia dos produtos?",
      contentType: "text",
      status: "read",
      readAt: new Date(Date.now() - 7150000),
      createdAt: new Date(Date.now() - 7200000),
    });

    await db.insert(messages).values({
      conversationId: conv2.id,
      senderId: attendant1.id,
      senderType: "attendant",
      senderName: attendant1.name,
      content: "A garantia é de 12 meses a partir da data de compra.",
      contentType: "text",
      status: "read",
      readAt: new Date(Date.now() - 7050000),
      createdAt: new Date(Date.now() - 7100000),
    });

    // Conversation 3 messages
    await db.insert(messages).values({
      conversationId: conv3.id,
      senderId: client3.id,
      senderType: "client",
      senderName: client3.name,
      content: "Vocês têm esse produto em estoque?",
      contentType: "text",
      status: "read",
      readAt: new Date(Date.now() - 9050000),
      createdAt: new Date(Date.now() - 86400000),
    });

    await db.insert(messages).values({
      conversationId: conv3.id,
      senderId: attendant1.id,
      senderType: "attendant",
      senderName: attendant1.name,
      content: "Sim, temos disponível. Posso reservar para você?",
      contentType: "text",
      isRead: true,
      createdAt: new Date(Date.now() - 86300000),
    });

    console.log("✅ Messages created");
    console.log("🎉 Database seeded successfully!");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await client.end();
  }
}

seed();
