-- Eventos da Jornada (flags que não derivam só de dados financeiros)
CREATE TABLE IF NOT EXISTS "user_journey_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "event_key" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "user_journey_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_journey_events_user_id_event_key_key"
  ON "user_journey_events"("user_id", "event_key");

CREATE INDEX IF NOT EXISTS "user_journey_events_user_id_idx"
  ON "user_journey_events"("user_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_journey_events_user_id_fkey'
  ) THEN
    ALTER TABLE "user_journey_events"
      ADD CONSTRAINT "user_journey_events_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "user_journey_events" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journey_events_select_own" ON "user_journey_events";
CREATE POLICY "journey_events_select_own" ON "user_journey_events"
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "journey_events_insert_own" ON "user_journey_events";
CREATE POLICY "journey_events_insert_own" ON "user_journey_events"
  FOR INSERT WITH CHECK (auth.uid() = user_id);
