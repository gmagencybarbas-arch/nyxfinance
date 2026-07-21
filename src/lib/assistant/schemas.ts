import { z } from "zod";

export const selectAssistantSchema = z
  .object({
    characterId: z.string().uuid(),
    skinId: z.string().uuid(),
  })
  .strict();

export type SelectAssistantInput = z.infer<typeof selectAssistantSchema>;
