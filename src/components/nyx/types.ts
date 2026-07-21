export type NyxState = "idle" | "listening" | "thinking" | "speaking";

/** @deprecated Prefer `@/components/nyx/avatar/types`. Mantido para compat. */
export type { NyxVisualState } from "./avatar/types";

export type ChatRole = "user" | "nyx";

export type ChatAttachment = {
  name: string;
  url: string;
  type?: string;
};

export type ChatMessageType = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  attachment?: ChatAttachment;
};
