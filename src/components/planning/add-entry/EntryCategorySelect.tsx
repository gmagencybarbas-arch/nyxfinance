"use client";

import { useCallback, useState } from "react";
import { AddCategoryModal } from "@/components/profile/AddCategoryModal";
import type { ExpenseCategory } from "@/components/profile/types";
import { inputClass, labelClass } from "./formShared";

interface EntryCategorySelectProps {
  categories: ExpenseCategory[];
  value: string;
  onChange: (categoryId: string) => void;
  onAddCategory?: (category: Omit<ExpenseCategory, "id">) => ExpenseCategory;
}

export function EntryCategorySelect({
  categories,
  value,
  onChange,
  onAddCategory,
}: EntryCategorySelectProps) {
  const [showAddCategory, setShowAddCategory] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      if (v === "__add__") {
        if (onAddCategory) setShowAddCategory(true);
      } else {
        onChange(v);
      }
    },
    [onChange, onAddCategory]
  );

  const handleSaveCategory = useCallback(
    (category: Omit<ExpenseCategory, "id">) => {
      if (!onAddCategory) return;
      const added = onAddCategory(category);
      onChange(added.id);
      setShowAddCategory(false);
    },
    [onAddCategory, onChange]
  );

  return (
    <>
      <div>
        <label htmlFor="entry-category" className={labelClass}>
          Categoria
        </label>
        <select
          id="entry-category"
          value={value}
          onChange={handleChange}
          className={inputClass}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          {onAddCategory ? <option value="__add__">➕ Adicionar categoria</option> : null}
        </select>
      </div>
      <AddCategoryModal
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onSave={handleSaveCategory}
      />
    </>
  );
}
