// Scene events and squads. Read-only: nothing here sends a prompt to an agent or controls one.

/** Citizens who work together. When they have just talked, they meet in Parliament. */
export type GroupView = { id: string; name: string; /** citizen ids */ members: string[] };
/** One observed event for a citizen: a line in the journal and a sound in the town. */
export type Activity = { botId: string; groupId?: string; at: number; kind: "start" | "tool" | "say" | "ask" | "done" | "fail"; emoji: string; label: string; detail?: string };
