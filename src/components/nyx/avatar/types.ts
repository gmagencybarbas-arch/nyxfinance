/**
 * Estados visuais da Nyx Alfa — 1:1 com os PNGs em /public/nyx.
 * Nomes dos arquivos (incluindo "sucess") são intencionais.
 */
import type { ReactNode } from "react";

export type NyxVisualState =
  | "master"
  | "typing"
  | "thinking"
  | "sucess"
  | "error"
  | "cigarro01"
  | "cigarro02";

/** Mapa centralizado de assets. Não espalhar caminhos hardcoded. */
export const NYX_ASSETS: Record<NyxVisualState, string> = {
  master: "/nyx/master.png",
  typing: "/nyx/typing.png",
  thinking: "/nyx/thinking.png",
  sucess: "/nyx/sucess.png",
  error: "/nyx/error.png",
  cigarro01: "/nyx/cigarro01.png",
  cigarro02: "/nyx/cigarro02.png",
};

export const NYX_ASSET_LIST = Object.values(NYX_ASSETS);

export const NYX_SPRITE_WIDTH = 996;
export const NYX_SPRITE_HEIGHT = 990;

export type NyxAlphaAvatarProps = {
  state: NyxVisualState;
  scrollShrink?: number;
  /** Mobile: enquadra mais ao centro */
  compact?: boolean;
  className?: string;
};

export type NyxAvatarStageProps = {
  state: NyxVisualState;
  scrollShrink?: number;
  compact?: boolean;
  className?: string;
  /** Legenda de status (desktop). */
  statusLabel?: string;
  /** Slot para toggle de som / controles. */
  controls?: ReactNode;
};
