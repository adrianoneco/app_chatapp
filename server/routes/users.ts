import { Router } from "express";
import { storage } from "../storage";
import { insertUserSchema, updateUserSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";
import { requireAuth, hashPassword } from "../utils/auth";
import { deleteAvatarFile } from "../upload";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    res.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Erro ao buscar usuário" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const data = insertUserSchema.parse(req.body);
    
    const existing = await storage.getUserByEmail(data.email);
    if (existing) {
      return res.status(400).json({ error: "Email já cadastrado" });
    }

    if (data.externalId) {
      const isUnique = await storage.isExternalIdUnique(data.externalId);
      if (!isUnique) {
        return res.status(400).json({ error: "ID externo já está em uso" });
      }
    }

    const hashedPassword = await hashPassword(data.password);
    
    const user = await storage.createUser({
      ...data,
      password: hashedPassword,
    });

    res.status(201).json({ user });
  } catch (error: any) {
    if (error.name === "ZodError") {
      const validationError = fromError(error);
      return res.status(400).json({ error: validationError.message });
    }
    console.error("Create user error:", error);
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const data = updateUserSchema.parse(req.body);
    
    if (data.externalId) {
      const isUnique = await storage.isExternalIdUnique(data.externalId, req.params.id);
      if (!isUnique) {
        return res.status(400).json({ error: "ID externo já está em uso" });
      }
    }
    
    const user = await storage.updateUser(req.params.id, data);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json({ user });
  } catch (error: any) {
    if (error.name === "ZodError") {
      const validationError = fromError(error);
      return res.status(400).json({ error: validationError.message });
    }
    console.error("Update user error:", error);
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const user = await storage.getUser(req.params.id);
    if (user?.avatar) {
      deleteAvatarFile(user.avatar);
    }
    
    const success = await storage.deleteUser(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Erro ao deletar usuário" });
  }
});

router.patch("/preferences", requireAuth, async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const { mainSidebarCollapsed, conversationsSidebarWidth, conversationsSidebarCollapsed } = req.body;
    
    const updates: any = {};
    if (typeof mainSidebarCollapsed === "boolean") {
      updates.mainSidebarCollapsed = mainSidebarCollapsed;
    }
    if (typeof conversationsSidebarWidth === "number") {
      updates.conversationsSidebarWidth = conversationsSidebarWidth;
    }
    if (typeof conversationsSidebarCollapsed === "boolean") {
      updates.conversationsSidebarCollapsed = conversationsSidebarCollapsed;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nenhuma preferência para atualizar" });
    }

    const user = await storage.updateUser(req.session.userId, updates);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ error: "Erro ao atualizar preferências" });
  }
});

export default router;
