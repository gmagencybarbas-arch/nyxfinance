"use client";

import { useCallback, useState } from "react";

type MissionShareInput = {
  missionTitle: string;
  chapterName: string;
  progressLabel: string;
};

type RewardShareInput = {
  title: string;
  phrase: string;
  preview: string;
};

function buildMissionUrl(input: MissionShareInput) {
  const q = new URLSearchParams({
    type: "mission",
    title: input.missionTitle,
    subtitle: input.chapterName,
    progress: input.progressLabel,
  });
  return `/api/journey/share?${q.toString()}`;
}

function buildRewardUrl(input: RewardShareInput) {
  const q = new URLSearchParams({
    type: "reward",
    title: input.title,
    phrase: input.phrase,
  });
  return `/api/journey/share?${q.toString()}`;
}

async function fetchAsFile(url: string, fileName: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao gerar imagem");
  const blob = await res.blob();
  return new File([blob], fileName, { type: "image/png" });
}

export function useJourneyShare() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const close = useCallback(() => {
    setSheetOpen(false);
    setError(null);
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
  }, [previewUrl]);

  const prepare = useCallback(async (apiUrl: string, fileName: string) => {
    setBusy(true);
    setError(null);
    setSheetOpen(true);
    try {
      const f = await fetchAsFile(apiUrl, fileName);
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    } catch {
      setError("Não foi possível gerar o card.");
    } finally {
      setBusy(false);
    }
  }, []);

  const openMissionShare = useCallback(
    (input: MissionShareInput) =>
      prepare(buildMissionUrl(input), "nyx-missao.png"),
    [prepare]
  );

  const openRewardShare = useCallback(
    (input: RewardShareInput) =>
      prepare(buildRewardUrl(input), "nyx-recompensa.png"),
    [prepare]
  );

  const nativeShare = useCallback(async () => {
    if (!file) return;
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Conquista Nyx",
          text: "Olha minha conquista na Jornada da Nyx!",
        });
        return;
      }
      if (navigator.share) {
        await navigator.share({
          title: "Conquista Nyx",
          text: "Olha minha conquista na Jornada da Nyx!",
          url: window.location.origin + (previewUrl || "/jornada"),
        });
        return;
      }
      setError("Share nativo indisponível neste aparelho — use Salvar imagem.");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError("Não foi possível compartilhar.");
    }
  }, [file, previewUrl]);

  const download = useCallback(() => {
    if (!file || !previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = file.name;
    a.click();
  }, [file, previewUrl]);

  return {
    sheetOpen,
    busy,
    error,
    previewUrl,
    close,
    openMissionShare,
    openRewardShare,
    nativeShare,
    download,
  };
}
