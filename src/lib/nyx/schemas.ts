import { z } from "zod";

const planningType = z.enum(["ACTUAL", "PLANNED", "COMMITTED"]);

export const nyxTransactionDraftSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.number().positive(),
  description: z.string().min(1).max(200),
  category: z.string().min(1).max(128),
  occurredAt: z.string().min(1),
  planningType,
});

export const nyxInstallmentDraftSchema = z.object({
  description: z.string().min(1).max(200),
  category: z.string().min(1).max(128),
  installmentAmount: z.number().positive(),
  totalInstallments: z.number().int().min(2).max(120),
  totalAmount: z.number().nonnegative(),
  firstDueDate: z.string().min(1),
  trackInCommitments: z.boolean(),
});

export const nyxRecurringDraftSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().positive(),
  category: z.string().min(1).max(128),
  dueDay: z.number().int().min(1).max(31),
  active: z.boolean(),
});

export const nyxActionSchema = z.object({
  actionId: z.string().min(1),
  kind: z.enum(["TRANSACTION", "INSTALLMENT_PLAN", "RECURRING_BILL", "SIMULATION"]),
  confidence: z.number().min(0).max(1),
  missingFields: z.array(z.string()),
  transaction: nyxTransactionDraftSchema.nullable(),
  installment: nyxInstallmentDraftSchema.nullable(),
  recurringBill: nyxRecurringDraftSchema.nullable(),
});

export const nyxPendingBatchSchema = z.object({
  batchId: z.string().min(1),
  actions: z.array(nyxActionSchema),
  createdAt: z.string().min(1),
});

export const nyxInterpretationSchema = z.object({
  intent: z.enum([
    "CREATE_TRANSACTION",
    "CREATE_INSTALLMENT",
    "CREATE_RECURRING_BILL",
    "SIMULATE_PURCHASE",
    "ASK_FINANCIAL_QUESTION",
    "CASUAL_CONVERSATION",
    "CORRECT_PENDING_ACTIONS",
    "CONFIRM_PENDING_ACTIONS",
    "CANCEL_PENDING_ACTIONS",
    "NEEDS_CLARIFICATION",
  ]),
  reply: z.string().min(1).max(800),
  requiresConfirmation: z.boolean(),
  actions: z.array(nyxActionSchema),
  pendingBatch: nyxPendingBatchSchema.nullable(),
  missingFields: z.array(z.string()),
});

export type NyxInterpretationParsed = z.infer<typeof nyxInterpretationSchema>;

/** JSON Schema estrito para Structured Outputs da OpenAI. */
export const NYX_INTERPRETATION_JSON_SCHEMA = {
  name: "nyx_interpretation",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "intent",
      "reply",
      "requiresConfirmation",
      "actions",
      "pendingBatch",
      "missingFields",
    ],
    properties: {
      intent: {
        type: "string",
        enum: [
          "CREATE_TRANSACTION",
          "CREATE_INSTALLMENT",
          "CREATE_RECURRING_BILL",
          "SIMULATE_PURCHASE",
          "ASK_FINANCIAL_QUESTION",
          "CASUAL_CONVERSATION",
          "CORRECT_PENDING_ACTIONS",
          "CONFIRM_PENDING_ACTIONS",
          "CANCEL_PENDING_ACTIONS",
          "NEEDS_CLARIFICATION",
        ],
      },
      reply: { type: "string" },
      requiresConfirmation: { type: "boolean" },
      missingFields: { type: "array", items: { type: "string" } },
      actions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "actionId",
            "kind",
            "confidence",
            "missingFields",
            "transaction",
            "installment",
            "recurringBill",
          ],
          properties: {
            actionId: { type: "string" },
            kind: {
              type: "string",
              enum: ["TRANSACTION", "INSTALLMENT_PLAN", "RECURRING_BILL", "SIMULATION"],
            },
            confidence: { type: "number" },
            missingFields: { type: "array", items: { type: "string" } },
            transaction: {
              anyOf: [
                {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "type",
                    "amount",
                    "description",
                    "category",
                    "occurredAt",
                    "planningType",
                  ],
                  properties: {
                    type: { type: "string", enum: ["INCOME", "EXPENSE", "TRANSFER"] },
                    amount: { type: "number" },
                    description: { type: "string" },
                    category: { type: "string" },
                    occurredAt: { type: "string" },
                    planningType: {
                      type: "string",
                      enum: ["ACTUAL", "PLANNED", "COMMITTED"],
                    },
                  },
                },
                { type: "null" },
              ],
            },
            installment: {
              anyOf: [
                {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "description",
                    "category",
                    "installmentAmount",
                    "totalInstallments",
                    "totalAmount",
                    "firstDueDate",
                    "trackInCommitments",
                  ],
                  properties: {
                    description: { type: "string" },
                    category: { type: "string" },
                    installmentAmount: { type: "number" },
                    totalInstallments: { type: "number" },
                    totalAmount: { type: "number" },
                    firstDueDate: { type: "string" },
                    trackInCommitments: { type: "boolean" },
                  },
                },
                { type: "null" },
              ],
            },
            recurringBill: {
              anyOf: [
                {
                  type: "object",
                  additionalProperties: false,
                  required: ["title", "amount", "category", "dueDay", "active"],
                  properties: {
                    title: { type: "string" },
                    amount: { type: "number" },
                    category: { type: "string" },
                    dueDay: { type: "number" },
                    active: { type: "boolean" },
                  },
                },
                { type: "null" },
              ],
            },
          },
        },
      },
      pendingBatch: {
        anyOf: [
          {
            type: "object",
            additionalProperties: false,
            required: ["batchId", "actions", "createdAt"],
            properties: {
              batchId: { type: "string" },
              createdAt: { type: "string" },
              actions: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "actionId",
                    "kind",
                    "confidence",
                    "missingFields",
                    "transaction",
                    "installment",
                    "recurringBill",
                  ],
                  properties: {
                    actionId: { type: "string" },
                    kind: {
                      type: "string",
                      enum: [
                        "TRANSACTION",
                        "INSTALLMENT_PLAN",
                        "RECURRING_BILL",
                        "SIMULATION",
                      ],
                    },
                    confidence: { type: "number" },
                    missingFields: { type: "array", items: { type: "string" } },
                    transaction: {
                      anyOf: [
                        {
                          type: "object",
                          additionalProperties: false,
                          required: [
                            "type",
                            "amount",
                            "description",
                            "category",
                            "occurredAt",
                            "planningType",
                          ],
                          properties: {
                            type: {
                              type: "string",
                              enum: ["INCOME", "EXPENSE", "TRANSFER"],
                            },
                            amount: { type: "number" },
                            description: { type: "string" },
                            category: { type: "string" },
                            occurredAt: { type: "string" },
                            planningType: {
                              type: "string",
                              enum: ["ACTUAL", "PLANNED", "COMMITTED"],
                            },
                          },
                        },
                        { type: "null" },
                      ],
                    },
                    installment: {
                      anyOf: [
                        {
                          type: "object",
                          additionalProperties: false,
                          required: [
                            "description",
                            "category",
                            "installmentAmount",
                            "totalInstallments",
                            "totalAmount",
                            "firstDueDate",
                            "trackInCommitments",
                          ],
                          properties: {
                            description: { type: "string" },
                            category: { type: "string" },
                            installmentAmount: { type: "number" },
                            totalInstallments: { type: "number" },
                            totalAmount: { type: "number" },
                            firstDueDate: { type: "string" },
                            trackInCommitments: { type: "boolean" },
                          },
                        },
                        { type: "null" },
                      ],
                    },
                    recurringBill: {
                      anyOf: [
                        {
                          type: "object",
                          additionalProperties: false,
                          required: ["title", "amount", "category", "dueDay", "active"],
                          properties: {
                            title: { type: "string" },
                            amount: { type: "number" },
                            category: { type: "string" },
                            dueDay: { type: "number" },
                            active: { type: "boolean" },
                          },
                        },
                        { type: "null" },
                      ],
                    },
                  },
                },
              },
            },
          },
          { type: "null" },
        ],
      },
    },
  },
} as const;
