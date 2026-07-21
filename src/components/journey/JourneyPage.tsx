"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAssistant } from "@/contexts/AssistantContext";
import type { JourneyStateDto, JourneyTrackNode } from "@/lib/journey/types";
import { missionHref, getMissionAction } from "@/lib/journey/missionActionMap";
import { JourneyHeader } from "./JourneyHeader";
import { JourneyHeroMissionCard } from "./JourneyHeroMissionCard";
import { JourneyCollectionSummary } from "./JourneyCollectionSummary";
import { JourneySidebar } from "./JourneySidebar";
import { JourneyTrack } from "./JourneyTrack";
import { MissionModal } from "./MissionModal";
import { JourneyRewardModal } from "./JourneyRewardModal";
import { ShareActionsSheet } from "./share/ShareActionsSheet";
import { useJourneyShare } from "./share/useJourneyShare";
import { SKIN_IDS, CHARACTER_IDS } from "@/lib/assistant/ids";
import { finalRewardNode } from "./journeyHeroMission";

export function JourneyPage() {
  const router = useRouter();
  const assistant = useAssistant();
  const [state, setState] = useState<JourneyStateDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(
    null
  );
  const [rewardNode, setRewardNode] = useState<
    Extract<JourneyTrackNode, { kind: "reward" }> | null
  >(null);
  const share = useJourneyShare();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/journey");
      if (!res.ok) throw new Error("Falha ao carregar");
      const data = (await res.json()) as JourneyStateDto;
      setState(data);

      if (data.newlyUnlockedRewardIds.length > 0) {
        const node = data.nodes.find(
          (n) =>
            n.kind === "reward" &&
            data.newlyUnlockedRewardIds.includes(n.id)
        );
        if (node && node.kind === "reward") setRewardNode(node);
      }
    } catch {
      setError("Não foi possível carregar a Jornada.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedMission = useMemo(() => {
    if (!state || !selectedMissionId) return null;
    const n = state.nodes.find(
      (x) => x.kind === "mission" && x.id === selectedMissionId
    );
    return n && n.kind === "mission" ? n : null;
  }, [state, selectedMissionId]);

  const onNodeClick = (node: JourneyTrackNode) => {
    if (node.kind === "chapter") return;
    if (node.kind === "mission") {
      if (node.status === "locked") {
        setSelectedMissionId(node.id);
        return;
      }
      setSelectedMissionId(node.id);
      return;
    }
    if (node.kind === "reward") {
      setRewardNode(node);
    }
  };

  const goMission = () => {
    if (!selectedMission) return;
    const href = missionHref(selectedMission.id);
    setSelectedMissionId(null);
    router.push(href);
  };

  const useRewardNow = async () => {
    if (!rewardNode) return;
    if (rewardNode.characterId && rewardNode.skinId) {
      await assistant.switchCharacter(
        rewardNode.characterId,
        rewardNode.skinId
      );
    } else if (rewardNode.skinId) {
      await assistant.switchSkin(rewardNode.skinId);
    }
    setRewardNode(null);
    router.push("/nyx");
  };

  const useNyxBeach = async () => {
    await assistant.switchCharacter(CHARACTER_IDS.nyx, SKIN_IDS.nyxBeach);
    router.push("/nyx");
  };

  const shareCollectionAchievement = () => {
    const reward = state ? finalRewardNode(state) : null;
    void share.openRewardShare({
      title: reward?.title ?? "Jornada concluída",
      phrase:
        reward?.phrase ??
        "Coleção completa. Orgulho define.",
      preview: reward?.preview ?? "",
    });
  };

  const reviewCollection = () => {
    document
      .getElementById("journey-track")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative min-h-[70vh] overflow-x-clip">
      {/* Fundo com profundidade: gradiente navy/roxo + pontos sutis */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,#2a1560_0%,#170d2c_45%,#0d0819_100%)]" />
        <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgba(196,181,253,0.14)_1px,transparent_1px)] [background-size:26px_26px]" />
        <div className="absolute top-1/4 -left-24 h-72 w-72 rounded-full bg-fuchsia-600/10 blur-3xl" />
        <div className="absolute bottom-1/4 -right-24 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-amber-400/[0.06] blur-3xl" />
      </div>

      <div className="lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-10">
        <JourneySidebar state={state} />

        <div className="min-w-0 overflow-x-clip">
          <JourneyHeader state={state} loading={loading} />

          <JourneyHeroMissionCard
            state={state}
            loading={loading}
            onDetails={(id) => setSelectedMissionId(id)}
            onUseNyxBeach={() => void useNyxBeach()}
            onShareAchievement={shareCollectionAchievement}
            onReviewCollection={reviewCollection}
          />

          <JourneyCollectionSummary state={state} loading={loading} />

          {error ? (
            <p className="mt-6 text-center text-sm text-rose-400">{error}</p>
          ) : null}

          {loading && !state ? (
            <div className="mx-auto mt-8 h-96 w-full max-w-[1050px] animate-pulse rounded-3xl bg-white/[0.04]" />
          ) : state ? (
            <div id="journey-track" className="mt-6 scroll-mt-24">
              <JourneyTrack nodes={state.nodes} onNodeClick={onNodeClick} />
            </div>
          ) : null}
        </div>
      </div>

      <MissionModal
        mission={selectedMission}
        open={Boolean(selectedMission)}
        onClose={() => setSelectedMissionId(null)}
        onPrimary={goMission}
        ctaLabel={
          selectedMission
            ? getMissionAction(selectedMission.id)?.ctaLabel ?? "Continuar"
            : "Continuar"
        }
        collectionProgress={
          state
            ? `${state.completedMissionCount} de ${state.totalMissionCount}`
            : undefined
        }
      />

      <JourneyRewardModal
        reward={rewardNode}
        open={Boolean(rewardNode)}
        onClose={() => setRewardNode(null)}
        onUseNow={() => void useRewardNow()}
        onShare={() => {
          if (!rewardNode) return;
          void share.openRewardShare({
            title: rewardNode.title,
            phrase: rewardNode.phrase,
            preview: rewardNode.preview,
          });
        }}
      />

      <ShareActionsSheet
        open={share.sheetOpen}
        busy={share.busy}
        error={share.error}
        previewUrl={share.previewUrl}
        onClose={share.close}
        onNativeShare={() => void share.nativeShare()}
        onDownload={() => void share.download()}
      />
    </div>
  );
}
