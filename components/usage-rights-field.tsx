"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  USAGE_RIGHTS_BASES,
  USAGE_RIGHTS_BASIS_LABELS,
  type UsageRightsBasis,
} from "@/lib/types";

// The one bit of client interactivity on the deal forms (extends D-016): a
// checkbox that reveals the usage-rights price fields when ticked. The inputs
// are plain form fields (name=…) so the server action reads them normally; the
// action also nulls them out if the box is unticked, so the reveal is purely
// cosmetic and correctness stays server-side.
export function UsageRightsField({
  defaultChecked,
  defaultAmount,
  defaultBasis,
  currency,
}: {
  defaultChecked: boolean;
  defaultAmount: string;
  defaultBasis: UsageRightsBasis | null;
  currency: string;
}) {
  const [on, setOn] = useState(defaultChecked);

  return (
    <div className="sm:col-span-2 rounded-lg border border-[var(--cl-line)] p-3">
      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
        <input
          type="checkbox"
          name="usage_rights"
          defaultChecked={defaultChecked}
          onChange={(e) => setOn(e.target.checked)}
          className="h-4 w-4 rounded border-input accent-[var(--cl-accent)]"
        />
        Usage rights
        <span className="font-normal text-muted-foreground">
          — licensed separately from the retainer
        </span>
      </label>

      {on ? (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="usage_rights_amount" className="mb-1.5">
              Usage rights amount ({currency})
            </Label>
            <Input
              id="usage_rights_amount"
              name="usage_rights_amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={defaultAmount}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="usage_rights_basis" className="mb-1.5">
              Basis
            </Label>
            <NativeSelect
              id="usage_rights_basis"
              name="usage_rights_basis"
              defaultValue={defaultBasis ?? "per_video"}
            >
              {USAGE_RIGHTS_BASES.map((v) => (
                <option key={v} value={v}>
                  {USAGE_RIGHTS_BASIS_LABELS[v]}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
      ) : null}
    </div>
  );
}
