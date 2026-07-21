import { describe, expect, it } from "vitest";
import type { JourneyStateDto, JourneyTrackNode } from "@/lib/journey/types";
import {
  heroProgressLabel,
  pickHeroMission,
  shouldShowRewardPreview,
  type HeroMission,
} from "@/components/journey/journeyHeroMission";

function mission(
  id: string,
  status: "current" | "available" | "completed" | "locked",
  extras?: Partial<HeroMission>
): JourneyTrackNode {
  return {
    kind: "mission",
    id: id as HeroMission["id"],
    title: id,
    description: "",
    chapterId: "ch_1",
    chapterName: "Cap 1",
    icon: "receipt",
    status,
    progressCurrent: 0,
    progressTarget: 1,
    ...extras,
  };
}

function reward(
  id: string,
  title: string,
  status: "locked" | "ready" | "claimed"
): JourneyTrackNode {
  return {
    kind: "reward",
    id: id as never,
    title,
    phrase: "",
    status,
    preview: "/store/skins/eva-default/master.png",
    rewardKind: "character",
  };
}

describe("pickHeroMission", () => {
  it("prefere missão current", () => {
    const nodes: JourneyTrackNode[] = [
      mission("a", "completed"),
      mission("b", "current"),
      mission("c", "available"),
    ];
    expect(pickHeroMission(nodes)?.id).toBe("b");
  });

  it("fallback para primeira available", () => {
    const nodes: JourneyTrackNode[] = [
      mission("a", "completed"),
      mission("b", "available"),
    ];
    expect(pickHeroMission(nodes)?.id).toBe("b");
  });

  it("retorna null se tudo concluído", () => {
    const nodes: JourneyTrackNode[] = [mission("a", "completed")];
    expect(pickHeroMission(nodes)).toBeNull();
  });
});

describe("heroProgressLabel", () => {
  it("mostra contador quando target > 1", () => {
    const m = mission("x", "current");
    if (m.kind === "mission") {
      m.progressCurrent = 2;
      m.progressTarget = 5;
      expect(heroProgressLabel(m)).toBe("2 de 5");
    }
  });
});

describe("shouldShowRewardPreview", () => {
  it("mostra preview quando falta 1 missão para Eva", () => {
    const current = mission("set_monthly_income", "current", {
      icon: "wallet",
    });
    const state = {
      completedMissionCount: 2,
      totalMissionCount: 10,
      collectionComplete: false,
      nextRewardTitle: "Eva",
      nodes: [
        mission("complete_profile", "completed"),
        mission("upload_profile_picture", "completed"),
        current,
        reward("r_eva", "Eva", "locked"),
      ],
    } as JourneyStateDto;
    expect(shouldShowRewardPreview(state, current as HeroMission)).toBe(true);
  });

  it("não mostra preview cedo demais", () => {
    const current = mission("complete_profile", "current", { icon: "user" });
    const state = {
      completedMissionCount: 0,
      totalMissionCount: 10,
      collectionComplete: false,
      nextRewardTitle: "Eva",
      nodes: [current, reward("r_eva", "Eva", "locked")],
    } as JourneyStateDto;
    expect(shouldShowRewardPreview(state, current as HeroMission)).toBe(false);
  });
});
