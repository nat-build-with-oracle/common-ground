"use client";
import { useMemo } from "react";
import { lifeDestination, type LifeDestination } from "@/lib/life";
import { useOffice } from "../store";
import { Icon } from "../Icons";
import { Book, visitZone } from "./hud.shared";

type Ministry = { id: string; name: string; icon: "parliament" | "globe" | "work" | "home" | "community" | "waiting" | "coffee" | "beer" | "garden"; line: string; count?: number };

/** Where every citizen is right now, by ministry, plus every federation machine's link. */
export function Cabinet() {
  const bots = useOffice(s => s.bots), nodes = useOffice(s => s.nodes), sections = useOffice(s => s.sections), routines = useOffice(s => s.routinesEnabled), preview = useOffice(s => s.preview);
  const at = useMemo(() => {
    const tally: Record<LifeDestination, number> = { desk: 0, waiting: 0, home: 0, community: 0, drinks: 0, garden: 0, parliament: 0 };
    for (const bot of bots) tally[lifeDestination(bot.status, bot.id, routines ? Date.now() : 0)] += 1;
    return tally;
  }, [bots, routines]);
  const linked = nodes.filter(node => node.ok).length;
  const ministries: Ministry[] = [
    { id: "meeting", name: "Parliament", icon: "parliament", line: "Members sit for 15 minutes every hour (simulated)", count: at.parliament },
    { id: "federation", name: "Ministry of Federation", icon: "globe", line: nodes.length ? `${linked} of ${nodes.length} machines linked` : "No federation node on this machine", count: nodes.reduce((sum, node) => sum + node.agents, 0) },
    { id: sections[0]?.id ?? "campus", name: "Ministry of Work", icon: "work", line: "At their desks, working", count: at.desk },
    { id: "neighborhood", name: "Ministry of Home", icon: "home", line: "At home: townhouse, stilt house, villa, cottage or condo", count: at.home },
    { id: "plaza", name: "Ministry of Community", icon: "community", line: "Out in the square", count: at.community },
    { id: "commons", name: "Petition office", icon: "waiting", line: "Waiting for a human's input", count: at.waiting },
    { id: "brewery", name: "Café & brewery", icon: "beer", line: "At the bar or in the beer garden", count: at.drinks },
    { id: "garden", name: "Town garden", icon: "garden", line: "Taking a breath", count: at.garden },
  ];
  return <Book title="The cabinet" index="05">
    <p className="book-intro">{preview ? "Synthetic nation. " : ""}Where every citizen is right now. Status is observed; the civic life around it is simulated.</p>
    <div className="cabinet-list">{ministries.map(ministry => <button key={ministry.name} className="cabinet-row" onClick={() => visitZone(ministry.id)}><Icon name={ministry.icon} /><span><b>{ministry.name}</b><small>{ministry.line}</small></span>{ministry.count !== undefined && <strong>{String(ministry.count).padStart(2, "0")}</strong>}</button>)}</div>
    <h3 className="section-label">Federation · machines</h3>
    {nodes.length ? <ul className="node-list">{nodes.map(node => <li key={node.name} className={node.ok ? "" : "down"}><i aria-hidden="true" /><b>{node.self ? "★ " : ""}{node.name}</b><span>{node.ok ? `${node.agents} agent${node.agents === 1 ? "" : "s"}${node.via ? ` · via ${node.via}` : ""}` : "link down"}</span></li>)}</ul>
      : <p className="book-intro">Run <code>bunx herdr-federation</code> on this machine and join a peer to see every machine here.</p>}
  </Book>;
}
