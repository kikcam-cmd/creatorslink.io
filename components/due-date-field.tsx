"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Optional due date for a deliverable: a deliverable has no deadline unless one
// was agreed, so the date input is gated behind a checkbox (extends D-016, same
// pattern as UsageRightsField). The server action nulls due_date whenever the
// box is unticked, so the reveal is purely cosmetic and correctness is
// server-side.
export function DueDateField({
  defaultChecked,
  defaultValue,
}: {
  defaultChecked: boolean;
  defaultValue: string;
}) {
  const [on, setOn] = useState(defaultChecked);

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer mb-1.5">
        <input
          type="checkbox"
          name="has_due_date"
          defaultChecked={defaultChecked}
          onChange={(e) => setOn(e.target.checked)}
          className="h-4 w-4 rounded border-input accent-[var(--cl-accent)]"
        />
        Set a due date
      </label>
      {on ? (
        <>
          <Label htmlFor="due_date" className="sr-only">
            Due date
          </Label>
          <Input
            id="due_date"
            name="due_date"
            type="date"
            defaultValue={defaultValue}
          />
        </>
      ) : null}
    </div>
  );
}
