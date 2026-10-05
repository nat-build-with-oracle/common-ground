import type { OracleBot, OracleStatus } from './fleet-types';

export type ResidentFilter = 'all' | 'working' | 'resting' | 'blocked' | 'unknown' | 'offline';
export type HudPanel = 'residents' | 'journal' | 'settings' | 'cabinet' | null;
export const STATUS_LABEL: Record<OracleStatus, string> = {
  working: 'Working', idle: 'Idle', blocked: 'Needs input', done: 'Done', unknown: 'Unknown', offline: 'Offline',
};
export function townCounts(bots: OracleBot[]) {
  const counts = { total: bots.length, working: 0, resting: 0, blocked: 0, unknown: 0, offline: 0 };
  for (const bot of bots) {
    if (bot.status === 'idle' || bot.status === 'done') counts.resting++;
    else counts[bot.status]++;
  }
  return counts;
}
export function filterResidents(bots: OracleBot[], filter: ResidentFilter, query: string) {
  const needle = query.trim().toLocaleLowerCase();
  return bots.filter(bot => {
    if (filter === 'resting' ? !['idle', 'done'].includes(bot.status) : filter !== 'all' && bot.status !== filter) return false;
    return !needle || [bot.name, bot.title, bot.project, bot.host, bot.runtime, bot.source].some(value => value?.toLocaleLowerCase().includes(needle));
  });
}
export function nextAttention(bots: OracleBot[], selected: string | null) {
  const waiting = bots.filter(bot => bot.status === 'blocked');
  return waiting[(waiting.findIndex(bot => bot.id === selected) + 1) % waiting.length] ?? null;
}
type KeyInput = { key: string; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean; shiftKey?: boolean; repeat?: boolean; target?: { tagName?: string; isContentEditable?: boolean } | null };
export function hudShortcut(event: KeyInput): string | null {
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.repeat) return null;
  if (event.key === 'Escape') return 'close';
  if (event.target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(event.target?.tagName ?? '')) return null;
  const key = event.key.toLowerCase();
  if (/^[0-9]$/.test(key)) return `district:${(Number(key) + 9) % 10}`;
  return ({ r: 'residents', j: 'journal', m: 'map', t: 'terminal', c: 'cabinet', h: 'walk', b: 'music', g: 'football' } as Record<string, string>)[key] ?? null;
}

/** What a citizen says when the human walks up and says hi. Built only from observed status (+ the simulated place). */
export function greeting(bot: Pick<OracleBot, 'status' | 'project'>, doing?: string): string {
  switch (bot.status) {
    case 'working': return `Busy right now, working on ${bot.project || 'my task'}. Talk soon!`;
    case 'blocked': return 'I am waiting for a human. Could you look at my terminal?';
    case 'offline': return '…zzz (offline)';
    case 'done': return `Just finished my task! ${doing ? `${doing}.` : 'Taking a break.'}`;
    case 'idle': return `Hi! ${doing ? `${doing}.` : 'Taking it easy.'}`;
    default: return 'Hello. My status is not reported right now.';
  }
}
