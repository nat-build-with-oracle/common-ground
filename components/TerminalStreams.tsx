"use client";
import { useEffect } from "react";
import type { TerminalSnapshot } from "@/lib/terminal-types";
import { setOffice, useOffice } from "./store";
import { loadClouds } from "./source/source";

/** Read-only snapshots, not a PTY/input channel. One bounded batch per 2 seconds. */
export default function TerminalStreams() {
  const bots = useOffice(s => s.bots), selected = useOffice(s => s.selected), hovered = useOffice(s => s.hovered);
  const enabled = useOffice(s => s.terminalEnabled), preview = useOffice(s => s.preview);
  const ids = [...new Set([selected, hovered, ...bots.filter(bot => bot.working).map(bot => bot.id)])]
    .filter((id): id is string => !!id && bots.some(bot => bot.id === id && bot.status !== "offline")).slice(0, 4);
  const key = JSON.stringify(ids);
  useEffect(() => {
    let disposed = false, timer: ReturnType<typeof setTimeout>, controller: AbortController | undefined;
    setOffice({ terminals: {} });
    if (!enabled || preview || !ids.length) return;
    async function poll() {
      if (!document.hidden) {
        controller = new AbortController();
        try {
          const snapshots = await loadClouds(ids, useOffice.getState().bots, controller.signal);
          if (!disposed) setOffice({ terminals: Object.fromEntries(snapshots.map(snapshot => [snapshot.botId, snapshot])) });
        } catch {
          if (!disposed) setOffice({ terminals: Object.fromEntries(ids.map(botId => [botId, { botId, content: "", capturedAt: Date.now(), status: "unavailable", error: "Terminal connection lost" }])) });
        }
      }
      if (!disposed) timer = setTimeout(poll, 2000);
    }
    void poll();
    return () => { disposed = true; clearTimeout(timer); controller?.abort(); };
  }, [key, enabled, preview]); // ids are represented by the stable key
  return null;
}
