import {
  Receipt,
  Wallet,
  Repeat,
  Layers,
  CalendarRange,
  Heart,
  UserRound,
  Camera,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import type { JourneyTrackNode } from "@/lib/journey/types";

export const JOURNEY_MISSION_ICONS: Record<
  Extract<JourneyTrackNode, { kind: "mission" }>["icon"],
  LucideIcon
> = {
  receipt: Receipt,
  wallet: Wallet,
  repeat: Repeat,
  layers: Layers,
  calendar: CalendarRange,
  heart: Heart,
  user: UserRound,
  camera: Camera,
  message: MessageCircle,
};
