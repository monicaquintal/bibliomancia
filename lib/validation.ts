import { z } from "zod";

export const emailSchema = z.string().trim().email("E-mail inválido");
export const passwordSchema = z.string().min(6, "A senha precisa ter ao menos 6 caracteres");

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe a senha"),
});

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  password: passwordSchema,
});

export const addBookSchema = z.object({
  googleVolumeId: z.string().min(1),
});

export const createCustomStatusSchema = z.object({
  label: z.string().trim().min(1, "Informe um nome para o status").max(40),
});

export const updateStatusSchema = z.object({
  entryId: z.string().uuid(),
  statusId: z.string().uuid(),
});

export const startSessionSchema = z.object({
  entryId: z.string().uuid(),
  startedAt: z.string().optional(),
  format: z.enum(["livro", "ebook", "audiobook"]),
});

export const updateSessionDatesSchema = z.object({
  sessionId: z.string().uuid(),
  startedAt: z.string().optional().nullable(),
  finishedAt: z.string().optional().nullable(),
});

export const finishSessionSchema = z.object({
  sessionId: z.string().uuid(),
  finishedAt: z.string().min(1, "Informe a data de término"),
});

export const abandonSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

export const deleteLibraryEntrySchema = z.object({
  entryId: z.string().uuid(),
});

export const addCommentSchema = z.object({
  sessionId: z.string().uuid(),
  body: z.string().trim().min(1, "Escreva um comentário"),
  progressPage: z.coerce.number().int().positive().optional().nullable(),
  progressPercent: z.coerce.number().int().min(0).max(100).optional().nullable(),
});

// nota fracionada de 1 a 5 em passos de 0,5, armazenada como "meias-estrelas" (2 a 10)
export const setRatingSchema = z.object({
  sessionId: z.string().uuid(),
  ratingHalf: z.coerce.number().int().min(2).max(10),
});

export const setReviewSchema = z.object({
  sessionId: z.string().uuid(),
  review: z.string().trim().min(1, "Escreva a resenha"),
});

export const setReadingGoalSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  targetBooks: z.coerce.number().int().min(1, "A meta precisa ser de ao menos 1 livro").max(1000),
});

export const importRowSchema = z.object({
  goodreadsId: z.string().max(30),
  publisher: z.string().max(300).nullable(),
  pageCount: z.number().int().positive().max(100000).nullable(),
  year: z.number().int().min(0).max(3000).nullable(),
  title: z.string().min(1).max(500),
  author: z.string().max(300),
  isbn10: z.string().max(13).nullable(),
  isbn13: z.string().max(13).nullable(),
  exclusiveShelf: z.enum(["read", "currently-reading", "to-read"]),
  customShelves: z.array(z.string().min(1).max(100)).max(30),
  rating: z.number().int().min(0).max(5),
  dateRead: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  review: z.string().max(20000),
  binding: z.string().max(100),
});

export const importBatchSchema = z.object({
  rows: z.array(importRowSchema).min(1).max(10),
});

export const createShelfSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome para a estante").max(40),
  entryId: z.string().uuid().optional(),
});

export const deleteShelfSchema = z.object({
  shelfId: z.string().uuid(),
});

export const toggleShelfEntrySchema = z.object({
  entryId: z.string().uuid(),
  shelfId: z.string().uuid(),
  member: z.enum(["0", "1"]),
});

export const manualBookSchema = z.object({
  title: z.string().trim().min(1, "Informe o título").max(500),
  subtitle: z.string().trim().max(500).optional(),
  authors: z.string().trim().max(500).optional(),
  publisher: z.string().trim().max(300).optional(),
  description: z.string().trim().max(5000).optional(),
  isbn: z
    .string()
    .trim()
    .transform((v) => v.replace(/[-\s]/g, ""))
    .refine((v) => /^(\d{9}[\dXx]|\d{13})$/.test(v), "ISBN inválido (10 ou 13 dígitos)")
    .optional(),
  // a URL vai parar em CSS (background-image), então nada de aspas ou parênteses
  thumbnailUrl: z
    .string()
    .trim()
    .max(2000)
    .regex(/^https?:\/\/[^\s"'()<>]+$/, "Link da capa inválido")
    .optional(),
  pageCount: z.coerce.number().int().positive().max(100000).optional(),
  year: z.coerce.number().int().min(0).max(3000).optional(),
  status: z.enum(["quero", "lendo", "lido"]).default("quero"),
  format: z.enum(["livro", "ebook", "audiobook"]).default("livro"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .optional(),
});
