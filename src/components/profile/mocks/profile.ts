import type { ProfileIdentity, RecurringExpense, NotificationSettings } from "../types";
import { DEFAULT_EXPENSE_CATEGORIES } from "../constants/categories";

export const MOCK_PROFILE_IDENTITY: ProfileIdentity = {
  fullName: "",
  profession: "",
  jobTitle: "",
  salaryRange: "3k_5k",
  payday: 1,
  financialGoal: "",
};

export const MOCK_RECURRING_EXPENSES: RecurringExpense[] = [
  { id: "1", name: "Aluguel", amount: 150000, dueDay: 10, categoryId: "casa" },
  { id: "2", name: "Internet", amount: 9900, dueDay: 15, categoryId: "casa" },
  { id: "3", name: "Academia", amount: 8900, dueDay: 5, categoryId: "saude" },
];

export const MOCK_NOTIFICATION_SETTINGS: NotificationSettings = {
  salaryReminder: true,
  expenseReminders: true,
  weeklySummary: true,
  highSpendingAlert: false,
};

export const MOCK_REFERRAL_CODE = "NYX-A7K2M9";
