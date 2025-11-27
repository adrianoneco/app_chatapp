import { Router } from "express";
import express from "express";
import { storage } from "../storage";
import { requireAuth } from "../utils/auth";
import { uploadAvatar, processAndSaveAvatar, deleteAvatarFile, AVATARS_DIR } from "../upload";

const router = Router();
const staticRouter = Router();

staticRouter.use("/", express.static(AVATARS_DIR));

router.post("/", requireAuth, uploadAvatar.single("avatar"), async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (user.avatar) {
      deleteAvatarFile(user.avatar);
    }

    const avatarUrl = await processAndSaveAvatar(req.file, userId);
    
    const updatedUser = await storage.updateUser(userId, { avatar: avatarUrl });

    res.json({ user: updatedUser, avatar: avatarUrl });
  } catch (error: any) {
    console.error("Upload avatar error:", error);
    res.status(500).json({ error: error.message || "Erro ao fazer upload do avatar" });
  }
});

router.delete("/", requireAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (user.avatar) {
      deleteAvatarFile(user.avatar);
    }

    const updatedUser = await storage.updateUser(userId, { avatar: null });

    res.json({ user: updatedUser });
  } catch (error) {
    console.error("Delete avatar error:", error);
    res.status(500).json({ error: "Erro ao remover avatar" });
  }
});

export { staticRouter as avatarStaticRouter };
export default router;
