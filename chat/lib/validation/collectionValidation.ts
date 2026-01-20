import { z } from "zod";

export const collectionCreateSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name must be under 100 characters"),
    description: z.string().max(500, "Description must be under 500 characters").optional().nullable(),
    visibility: z.enum(["PRIVATE", "PUBLIC", "UNLISTED"]).default("PRIVATE"),
    cover_image_url: z.string().url("Invalid URL").optional().nullable(),
});

export const collectionUpdateSchema = collectionCreateSchema.partial();

export const collectionItemSchema = z.object({
    persona_id: z.string().uuid("Invalid persona ID"),
    order_index: z.number().int().optional(),
});
