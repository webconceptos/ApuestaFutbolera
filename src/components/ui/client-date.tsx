"use client";

import { useEffect, useState } from "react";
import { PERU_TIMEZONE } from "@/lib/date-peru";

export function ClientDate({
  iso,
  options,
}: {
  iso: string;
  options?: Intl.DateTimeFormatOptions;
}) {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    setFormatted(
      new Intl.DateTimeFormat("es-PE", {
        timeZone: PERU_TIMEZONE,
        ...options,
      }).format(new Date(iso))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso]);

  return <>{formatted ?? "—"}</>;
}