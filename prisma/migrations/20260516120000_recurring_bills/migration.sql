CREATE TABLE "recurring_bills" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "category" VARCHAR(128) NOT NULL,
    "due_day" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "recurring_bills_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "recurring_bills_user_id_active_idx" ON "recurring_bills"("user_id", "active");
CREATE INDEX "recurring_bills_tenant_id_idx" ON "recurring_bills"("tenant_id");

ALTER TABLE "recurring_bills" ADD CONSTRAINT "recurring_bills_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "recurring_bills" ADD CONSTRAINT "recurring_bills_due_day_range" CHECK ("due_day" >= 1 AND "due_day" <= 31);

ALTER TABLE "recurring_bills" ADD CONSTRAINT "recurring_bills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recurring_bills" ADD CONSTRAINT "recurring_bills_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
