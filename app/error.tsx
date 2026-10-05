"use client";
// Instead of a blank "this page couldn't load": say what broke, so it can be reported and fixed.
import { useEffect } from "react";

export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[office-town]", error); }, [error]);
  const detail = [error.message, ...(error.stack ?? "").split("\n").slice(1, 7)].join("\n");
  return <main className="page-error" role="alert">
    <h1>The town hit an error</h1>
    <p>Copy this when you report it:</p>
    <pre>{detail}{error.digest ? `\ndigest ${error.digest}` : ""}</pre>
    <div><button className="ink-button" onClick={() => reset()}>Try again</button> <button className="text-button" onClick={() => window.location.reload()}>Reload</button> <button className="text-button" onClick={() => void navigator.clipboard?.writeText(detail)}>Copy</button></div>
  </main>;
}
