-- Assistente: personagens, skins, desbloqueios e preferência

CREATE TYPE "SkinAvailabilityStatus" AS ENUM ('available', 'locked', 'coming_soon', 'unavailable');

CREATE TABLE IF NOT EXISTS "characters" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "slug" VARCHAR(64) NOT NULL,
  "name" VARCHAR(128) NOT NULL,
  "description" VARCHAR(512) NOT NULL,
  "personality_key" VARCHAR(64) NOT NULL,
  "default_unlocked" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "characters_slug_key" ON "characters"("slug");

CREATE TABLE IF NOT EXISTS "character_skins" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "character_id" uuid NOT NULL,
  "slug" VARCHAR(64) NOT NULL,
  "name" VARCHAR(128) NOT NULL,
  "description" VARCHAR(512) NOT NULL,
  "asset_config" JSONB NOT NULL,
  "default_unlocked" BOOLEAN NOT NULL DEFAULT false,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "availability_status" "SkinAvailabilityStatus" NOT NULL DEFAULT 'locked',
  "unlock_rule_key" VARCHAR(128),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "character_skins_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "character_skins_slug_key" ON "character_skins"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "character_skins_character_id_slug_key" ON "character_skins"("character_id", "slug");
CREATE INDEX IF NOT EXISTS "character_skins_character_id_active_idx" ON "character_skins"("character_id", "active");

-- no máximo uma skin default por personagem
CREATE UNIQUE INDEX IF NOT EXISTS "character_skins_one_default_per_character"
  ON "character_skins"("character_id")
  WHERE "is_default" = true;

CREATE TABLE IF NOT EXISTS "user_character_unlocks" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "character_id" uuid NOT NULL,
  "unlock_source" VARCHAR(64) NOT NULL,
  "unlocked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "metadata" JSONB,
  CONSTRAINT "user_character_unlocks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_character_unlocks_user_id_character_id_key"
  ON "user_character_unlocks"("user_id", "character_id");
CREATE INDEX IF NOT EXISTS "user_character_unlocks_user_id_idx" ON "user_character_unlocks"("user_id");

CREATE TABLE IF NOT EXISTS "user_skin_unlocks" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "skin_id" uuid NOT NULL,
  "unlock_source" VARCHAR(64) NOT NULL,
  "unlocked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "metadata" JSONB,
  CONSTRAINT "user_skin_unlocks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_skin_unlocks_user_id_skin_id_key"
  ON "user_skin_unlocks"("user_id", "skin_id");
CREATE INDEX IF NOT EXISTS "user_skin_unlocks_user_id_idx" ON "user_skin_unlocks"("user_id");

CREATE TABLE IF NOT EXISTS "user_assistant_preferences" (
  "user_id" uuid NOT NULL,
  "selected_character_id" uuid NOT NULL,
  "selected_skin_id" uuid NOT NULL,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "user_assistant_preferences_pkey" PRIMARY KEY ("user_id")
);

ALTER TABLE "character_skins"
  ADD CONSTRAINT "character_skins_character_id_fkey"
  FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_character_unlocks"
  ADD CONSTRAINT "user_character_unlocks_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_character_unlocks"
  ADD CONSTRAINT "user_character_unlocks_character_id_fkey"
  FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_skin_unlocks"
  ADD CONSTRAINT "user_skin_unlocks_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_skin_unlocks"
  ADD CONSTRAINT "user_skin_unlocks_skin_id_fkey"
  FOREIGN KEY ("skin_id") REFERENCES "character_skins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_assistant_preferences"
  ADD CONSTRAINT "user_assistant_preferences_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_assistant_preferences"
  ADD CONSTRAINT "user_assistant_preferences_selected_character_id_fkey"
  FOREIGN KEY ("selected_character_id") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_assistant_preferences"
  ADD CONSTRAINT "user_assistant_preferences_selected_skin_id_fkey"
  FOREIGN KEY ("selected_skin_id") REFERENCES "character_skins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS
ALTER TABLE "characters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "character_skins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_character_unlocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_skin_unlocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_assistant_preferences" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'characters' AND policyname = 'Anyone can read active characters'
  ) THEN
    CREATE POLICY "Anyone can read active characters"
      ON "characters" FOR SELECT
      USING (active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'character_skins' AND policyname = 'Anyone can read active skins'
  ) THEN
    CREATE POLICY "Anyone can read active skins"
      ON "character_skins" FOR SELECT
      USING (active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_character_unlocks' AND policyname = 'Users read own character unlocks'
  ) THEN
    CREATE POLICY "Users read own character unlocks"
      ON "user_character_unlocks" FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_skin_unlocks' AND policyname = 'Users read own skin unlocks'
  ) THEN
    CREATE POLICY "Users read own skin unlocks"
      ON "user_skin_unlocks" FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_assistant_preferences' AND policyname = 'Users read own assistant preference'
  ) THEN
    CREATE POLICY "Users read own assistant preference"
      ON "user_assistant_preferences" FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_assistant_preferences' AND policyname = 'Users update own assistant preference'
  ) THEN
    CREATE POLICY "Users update own assistant preference"
      ON "user_assistant_preferences" FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
