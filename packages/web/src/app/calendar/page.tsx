"use client";

import { trpc } from "@/lib/trpc";
import { CalendarView } from "@/components/calendar-view";
import { CalendarSidebar } from "@/components/calendar-sidebar";

export default function CalendarPage() {
  const { data: user } = trpc.user.getOrCreate.useQuery();
  const userId = user?.id ?? "";

  if (!userId) return <div className="text-[var(--muted)]">Loading...</div>;

  return (
    <div
      className="px-4 py-2"
      style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}
    >
      <div className="flex gap-4 h-[calc(100vh-5rem)]">
        <div className="w-52 flex-shrink-0 overflow-y-auto">
          <CalendarSidebar userId={userId} />
        </div>
        <div className="flex-1 min-w-0">
          <CalendarView userId={userId} />
        </div>
      </div>
    </div>
  );
}
