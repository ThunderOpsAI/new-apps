"use client";

import React from "react";

interface EditableListProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

export function EditableList({ items, onChange, placeholder }: EditableListProps) {
  const handleItemChange = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const handleAddItem = () => {
    onChange([...items, ""]);
  };

  const handleRemoveItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="editable-list">
      <div className="section-stack">
        {items.map((item, index) => (
          <div key={index} className="field" style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start" }}>
            <textarea
              className="input"
              value={item}
              onChange={(e) => handleItemChange(index, e.target.value)}
              placeholder={placeholder || "Add item..."}
              rows={1}
              style={{ flex: 1, minHeight: "unset", resize: "vertical" }}
            />
            <button
              type="button"
              className="button button--ghost"
              onClick={() => handleRemoveItem(index)}
              aria-label="Remove item"
              style={{ padding: "var(--space-1) var(--space-2)" }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="button button--ghost"
        onClick={handleAddItem}
        style={{ marginTop: "var(--space-2)", width: "100%", borderStyle: "dashed" }}
      >
        + Add Item
      </button>
    </div>
  );
}
