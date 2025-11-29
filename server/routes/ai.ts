import type { Express } from "express";
import Groq from "groq-sdk";
import { z } from "zod";

const correctTextSchema = z.object({
  text: z.string().min(1),
});

export function registerAIRoutes(app: Express) {
  app.post("/api/ai/correct-text", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Chave da API do Groq não configurada" });
      }

      const parsed = correctTextSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Texto inválido" });
      }

      const { text } = parsed.data;
      const groq = new Groq({ apiKey });

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `Você é um assistente especializado em correção de texto em português brasileiro.
Corrija erros de ortografia, gramática, pontuação e acentuação no texto fornecido.
Mantenha o tom e o significado original da mensagem.
Retorne APENAS o texto corrigido, sem explicações ou comentários adicionais.
Se o texto já estiver correto, retorne-o sem alterações.`
          },
          {
            role: "user",
            content: text
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        max_tokens: 1024,
      });

      const correctedText = completion.choices[0]?.message?.content || text;

      res.json({ 
        original: text, 
        corrected: correctedText,
        wasChanged: text !== correctedText
      });
    } catch (error: any) {
      console.error("Error correcting text:", error);
      res.status(500).json({ error: "Falha ao corrigir texto" });
    }
  });
}
