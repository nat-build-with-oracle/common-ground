import { setOffice, useOffice } from "../store";

/** Opening a terminal only grants input for an explicit typing shortcut. */
export function openTerminal(id: string, { select = true, input = false } = {}) {
  const state = useOffice.getState();
  const live = state.bots.some(bot => bot.id === id && bot.status !== "offline");
  if (state.preview || !live) return false;
  setOffice({ terminalFull: id, terminalInput: input ? id : null, ...(select ? { selected: id } : {}) });
  return true;
}

/** Upgrade the currently visible read-only terminal after the named button is pressed. */
export function enableTerminalInput(id: string) {
  const state = useOffice.getState();
  if (state.preview || state.terminalFull !== id || !state.bots.some(bot => bot.id === id && bot.status !== "offline")) return false;
  setOffice({ terminalInput: id });
  return true;
}

export function closeTerminal() {
  setOffice({ terminalFull: null, terminalInput: null });
}
