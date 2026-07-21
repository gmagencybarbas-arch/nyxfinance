-- InstallmentPlan + colunas de parcela em transactions

CREATE TABLE "installment_plans" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "description" VARCHAR(512),
    "total_installments" INTEGER NOT NULL,
    "installment_amount" DECIMAL(19,4) NOT NULL,
    "total_amount" DECIMAL(19,4),
    "first_due_date" TIMESTAMPTZ(6) NOT NULL,
    "track_in_commitments" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "installment_plans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "installment_plans_user_id_idx" ON "installment_plans"("user_id");

ALTER TABLE "installment_plans" ADD CONSTRAINT "installment_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "installment_plans" ADD CONSTRAINT "installment_plans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transactions" ADD COLUMN "installment_plan_id" UUID;
ALTER TABLE "transactions" ADD COLUMN "installment_number" INTEGER;
ALTER TABLE "transactions" ADD COLUMN "is_installment" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_installment_plan_id_fkey" FOREIGN KEY ("installment_plan_id") REFERENCES "installment_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
