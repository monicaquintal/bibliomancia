"use client";

import { useRef } from "react";
import { updateStatus } from "@/actions/reading";

export function StatusSelect({
  entryId,
  statusId,
  statuses,
}: {
  entryId: string;
  statusId: string;
  statuses: { id: string; label: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={updateStatus} className="inline-block">
      <input type="hidden" name="entryId" value={entryId} />
      <select
        name="statusId"
        aria-label="Status na estante"
        defaultValue={statusId}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-lg border border-dust-line bg-paper-raised px-2 py-1 text-sm font-medium text-ink focus:border-cover focus:outline-none"
      >
        {statuses.map((status) => (
          <option key={status.id} value={status.id}>
            {status.label}
          </option>
        ))}
      </select>
    </form>
  );
}
