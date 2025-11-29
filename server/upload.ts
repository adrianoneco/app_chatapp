import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";

const DATA_DIR = "./data";
const AVATARS_DIR = path.join(DATA_DIR, "avatars");
const MEDIA_DIR = path.join(DATA_DIR, "media");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

const storage = multer.memoryStorage();

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, MEDIA_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WebP."));
  }
};

const mediaFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "video/mp4", "video/webm", "video/quicktime",
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/webm", "audio/ogg",
    "application/pdf", 
    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain"
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de arquivo não permitido."));
  }
};

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadMedia = multer({
  storage: diskStorage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for media
  },
});

export async function processAndSaveAvatar(
  file: Express.Multer.File,
  userId: string
): Promise<string> {
  const userDir = path.join(AVATARS_DIR, userId.substring(0, 2));
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

  const filename = `${userId}.webp`;
  const filepath = path.join(userDir, filename);

  await sharp(file.buffer)
    .resize(256, 256, {
      fit: "cover",
      position: "center",
    })
    .webp({ quality: 85 })
    .toFile(filepath);

  return `/api/avatars/${userId.substring(0, 2)}/${filename}`;
}

export function deleteAvatarFile(avatarPath: string): void {
  if (!avatarPath || !avatarPath.startsWith("/api/avatars/")) {
    return;
  }

  const relativePath = avatarPath.replace("/api/avatars/", "");
  const filepath = path.join(AVATARS_DIR, relativePath);

  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}

export function getAvatarPath(relativePath: string): string {
  return path.join(AVATARS_DIR, relativePath);
}

export { AVATARS_DIR, MEDIA_DIR };
