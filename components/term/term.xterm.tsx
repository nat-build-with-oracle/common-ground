"use client";
// xterm.js for one citizen, same look as maw-ui's god view (Catppuccin Mocha).
// live: hosted page with a token — a real PTY over herdr serve /ws/pty; what you type reaches the agent.
// otherwise read-only: the full screen polled once a second, repainted only when it changes.
import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { useOffice } from "../store";
import { loadFull, openPty } from "../source/source";

const THEME = {
  background: "#0a0a0f", foreground: "#cdd6f4", cursor: "#0a0a0f", cursorAccent: "#0a0a0f", selectionBackground: "#585b7066",
  black: "#0a0a0f", red: "#f38ba8", green: "#a6e3a1", yellow: "#f9e2af", blue: "#89b4fa", magenta: "#cba6f7", cyan: "#94e2d5", white: "#cdd6f4",
  brightBlack: "#585b70", brightRed: "#f38ba8", brightGreen: "#a6e3a1", brightYellow: "#f9e2af", brightBlue: "#89b4fa", brightMagenta: "#cba6f7", brightCyan: "#94e2d5", brightWhite: "#ffffff",
};
type Full = { text: string; status: "live" | "unavailable"; error?: string; capturedAt: number };

export default function XTerm({ id, live, onStatus }: { id: string; live: boolean; onStatus: (status: { live: boolean; at: number; error?: string }) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const status = useRef(onStatus); status.current = onStatus;

  useEffect(() => {
    const container = box.current;
    if (!container) return;
    const term = new Terminal({ theme: THEME, fontFamily: "Monaco, 'Cascadia Code', 'Fira Code', monospace", fontSize: 13, lineHeight: 1.35, disableStdin: !live, cursorBlink: live, cursorStyle: live ? "bar" : "underline", scrollback: 2000, convertEol: !live, ...(live ? { theme: { ...THEME, cursor: "#22d3ee" } } : {}) });
    const fit = new FitAddon();
    term.loadAddon(fit);
    let disposed = false, last = "", timer = 0, controller: AbortController | undefined;
    let socket: WebSocket | undefined;
    const observer = new ResizeObserver(() => { try { fit.fit(); if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows })); } catch { /* not laid out yet */ } });
    const attach = async () => {
      const bot = useOffice.getState().bots.find(candidate => candidate.id === id);
      try {
        if (!bot) throw new Error("Agent not in the connected fleet");
        controller = new AbortController();
        socket = await openPty(bot, controller.signal);
        if (disposed) { socket.close(); return; }
        const encoder = new TextEncoder();
        socket.onopen = () => socket?.send(JSON.stringify({ type: "attach", target: bot.pane, cols: term.cols, rows: term.rows }));
        socket.onmessage = event => {
          if (typeof event.data !== "string") { term.write(new Uint8Array(event.data as ArrayBuffer)); return; }
          try { const message = JSON.parse(event.data) as { type?: string }; if (message.type === "attached") { status.current({ live: true, at: Date.now() }); term.focus(); } if (message.type === "detached") term.write("\r\n\x1b[33m[session detached]\x1b[0m\r\n"); } catch { /* not a control message */ }
        };
        socket.onclose = () => { if (!disposed) { term.write("\r\n\x1b[31m[connection closed]\x1b[0m\r\n"); status.current({ live: false, at: Date.now(), error: "Connection closed" }); } };
        term.onData(data => { if (socket?.readyState === WebSocket.OPEN) socket.send(encoder.encode(data)); });
        term.onBinary(data => { if (socket?.readyState === WebSocket.OPEN) socket.send(Uint8Array.from(data, char => char.charCodeAt(0))); });
      } catch (error) { if (!disposed) status.current({ live: false, at: Date.now(), error: error instanceof Error ? error.message : "Terminal unavailable" }); }
    };
    // Alt+←/→ and Alt+1–9 belong to the popup; everything else goes to the agent.
    term.attachCustomKeyEventHandler(event => !(live && event.altKey && (/^Arrow(Left|Right)$/.test(event.key) || /^[1-9]$/.test(event.key))));
    // Wait one tick for the container to have a size (xterm crashes measuring a 0×0 box).
    const open = window.setTimeout(() => {
      try { term.open(container); fit.fit(); } catch { return; }
      observer.observe(container); setReady(true);
      if (live) { void attach(); return; }
      const poll = async () => {
        if (disposed) return;
        if (!document.hidden) {
          controller = new AbortController();
          try {
            const data: Full = await loadFull(id, useOffice.getState().bots, controller.signal);
            if (disposed) return;
            status.current({ live: data.status === "live", at: data.capturedAt, error: data.error });
            if (data.status === "live" && data.text !== last) {
              last = data.text;
              term.write("\x1b[2J\x1b[3J\x1b[H" + data.text, () => term.scrollToBottom());
            }
          } catch { if (!disposed) status.current({ live: false, at: Date.now(), error: "Terminal connection lost" }); }
        }
        if (!disposed) timer = window.setTimeout(poll, 1000);
      };
      void poll();
    }, 30);
    return () => { disposed = true; window.clearTimeout(open); window.clearTimeout(timer); controller?.abort(); socket?.close(); observer.disconnect(); term.dispose(); };
  }, [id, live]);

  return <div className="xterm-box" ref={box}>{!ready && <p className="xterm-wait">Opening terminal…</p>}</div>;
}
