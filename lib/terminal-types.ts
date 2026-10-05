export type TerminalSnapshot = {
  botId: string; content: string; capturedAt: number;
  status: "live" | "unavailable"; error?: string;
};
