// Terminal text cleanup that runs in the browser as well as on the server: strip control
// sequences, mask common credentials (best effort, not a guarantee), and bound the size.
const ANSI = /[\u001b\u009b][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-ntqry=><~]))/g;

export function redactTerminal(content: string) {
  return content.replace(ANSI, "")
    .replace(/\r/g, "").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .replace(/((?:token|password|secret|api[_-]?key)\s*[=:]\s*)[^\s"']+/gi, "$1[redacted]")
    .replace(/(Bearer\s+)[\w.\-]+/gi, "$1[redacted]")
    .replace(/\b(?:sk-|ghp_|github_pat_)[\w-]{12,}/g, "[redacted]");
}

/** The last ten non-empty lines, for thought clouds. */
export function terminalExcerpt(content: string) {
  return redactTerminal(content)
    .split("\n").map(line => line.trimEnd()).filter(line => line.trim()).slice(-10)
    .map(line => line.slice(0, 180)).join("\n").slice(-1800);
}

/** The whole visible screen (up to 300 lines of 400 characters), for the full-screen terminal. */
export function fullScreen(content: string) {
  const lines = redactTerminal(content).split("\n").map(line => line.trimEnd().slice(0, 400));
  while (lines.length && !lines.at(-1)) lines.pop();
  return lines.slice(-300).join("\n");
}
