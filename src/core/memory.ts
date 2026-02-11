/**
 * Memory System — The brain of the agents.
 *
 * Three tiers of memory give agents continuity and intelligence:
 *
 * 1. Working Memory — scratch-pad for the current task execution
 * 2. Episodic Memory — logs of past actions, decisions, and outcomes
 * 3. Semantic Memory — persistent knowledge that survives across runs
 *
 * The MemoryManager coordinates all three and provides a unified
 * retrieval interface with relevance scoring.
 */

import type { AgentRole, Artifact } from "./types";

// ─── Memory Entry Types ───────────────────────────────────────────────

export interface MemoryEntry {
  id: string;
  timestamp: number;
  agentRole: AgentRole;
  type: MemoryType;
  content: string;
  metadata: Record<string, unknown>;
  tags: string[];
  relevance: number; // 0-1 score, used for retrieval ranking
  ttl?: number; // time-to-live in ms; undefined = permanent
}

export type MemoryType =
  | "fact" // learned fact
  | "decision" // architectural/design decision
  | "action" // action taken
  | "outcome" // result of an action
  | "error" // error encountered
  | "preference" // user/project preference
  | "pattern" // recognized pattern
  | "context" // contextual information
  | "artifact-ref"; // reference to a produced artifact

export interface MemoryQuery {
  text?: string;
  tags?: string[];
  types?: MemoryType[];
  agentRole?: AgentRole;
  minRelevance?: number;
  limit?: number;
  since?: number; // timestamp
}

// ─── Working Memory ───────────────────────────────────────────────────

/**
 * Fast, ephemeral scratch-pad for a single task execution.
 * Cleared after each task completes. Think of it as L1 cache.
 */
export class WorkingMemory {
  private store = new Map<string, unknown>();
  private notes: string[] = [];

  set(key: string, value: unknown): void {
    this.store.set(key, value);
  }

  get<T = unknown>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /** Append a free-form note (like a thought/reasoning step) */
  addNote(note: string): void {
    this.notes.push(note);
  }

  /** Get all notes in order */
  getNotes(): string[] {
    return [...this.notes];
  }

  /** Get all key-value pairs */
  entries(): Array<[string, unknown]> {
    return Array.from(this.store.entries());
  }

  /** Total items stored */
  size(): number {
    return this.store.size + this.notes.length;
  }

  /** Wipe everything for the next task */
  clear(): void {
    this.store.clear();
    this.notes = [];
  }

  /** Snapshot the working memory state */
  snapshot(): { store: Record<string, unknown>; notes: string[] } {
    const store: Record<string, unknown> = {};
    this.store.forEach((v, k) => (store[k] = v));
    return { store, notes: [...this.notes] };
  }
}

// ─── Episodic Memory ──────────────────────────────────────────────────

/**
 * Timeline of actions, decisions, and outcomes.
 * Persists within a project run. Enables agents to learn from
 * what happened earlier in the same session.
 */
export class EpisodicMemory {
  private timeline: MemoryEntry[] = [];

  /** Record an event */
  record(entry: Omit<MemoryEntry, "id" | "timestamp" | "relevance">): MemoryEntry {
    const full: MemoryEntry = {
      ...entry,
      id: `ep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      relevance: 1.0,
    };
    this.timeline.push(full);
    return full;
  }

  /** Query past events */
  recall(query: MemoryQuery): MemoryEntry[] {
    let results = [...this.timeline];

    if (query.agentRole) {
      results = results.filter((e) => e.agentRole === query.agentRole);
    }
    if (query.types?.length) {
      results = results.filter((e) => query.types!.includes(e.type));
    }
    if (query.tags?.length) {
      results = results.filter((e) =>
        query.tags!.some((tag) => e.tags.includes(tag))
      );
    }
    if (query.since) {
      results = results.filter((e) => e.timestamp >= query.since!);
    }
    if (query.text) {
      const lower = query.text.toLowerCase();
      results = results.map((e) => ({
        ...e,
        relevance: computeRelevance(e.content, e.tags, lower),
      }));
      results = results.filter(
        (e) => e.relevance >= (query.minRelevance ?? 0.1)
      );
    }

    results.sort((a, b) => b.relevance - a.relevance || b.timestamp - a.timestamp);
    return results.slice(0, query.limit ?? 50);
  }

  /** Get the full timeline */
  getTimeline(): MemoryEntry[] {
    return [...this.timeline];
  }

  /** Get the last N entries */
  recent(n: number): MemoryEntry[] {
    return this.timeline.slice(-n);
  }

  /** Count entries */
  size(): number {
    return this.timeline.length;
  }

  /** Export for persistence */
  export(): MemoryEntry[] {
    return [...this.timeline];
  }

  /** Import from a previous session */
  import(entries: MemoryEntry[]): void {
    this.timeline.push(...entries);
    this.timeline.sort((a, b) => a.timestamp - b.timestamp);
  }
}

// ─── Semantic Memory ──────────────────────────────────────────────────

/**
 * Persistent knowledge store. Facts, patterns, preferences that
 * survive across tasks and project phases. Think of it as the
 * agent's long-term knowledge base.
 */
export class SemanticMemory {
  private knowledge = new Map<string, MemoryEntry>();
  private tagIndex = new Map<string, Set<string>>(); // tag -> entry IDs

  /** Store a fact or piece of knowledge */
  store(entry: Omit<MemoryEntry, "id" | "timestamp" | "relevance">): MemoryEntry {
    const full: MemoryEntry = {
      ...entry,
      id: `sem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      relevance: 1.0,
    };
    this.knowledge.set(full.id, full);

    // Index by tags
    for (const tag of full.tags) {
      const ids = this.tagIndex.get(tag) ?? new Set();
      ids.add(full.id);
      this.tagIndex.set(tag, ids);
    }

    return full;
  }

  /** Update an existing memory entry */
  update(id: string, updates: Partial<Pick<MemoryEntry, "content" | "metadata" | "tags">>): MemoryEntry | null {
    const entry = this.knowledge.get(id);
    if (!entry) return null;
    if (updates.content !== undefined) entry.content = updates.content;
    if (updates.metadata !== undefined) entry.metadata = { ...entry.metadata, ...updates.metadata };
    if (updates.tags !== undefined) {
      // Reindex tags
      for (const tag of entry.tags) {
        this.tagIndex.get(tag)?.delete(id);
      }
      entry.tags = updates.tags;
      for (const tag of entry.tags) {
        const ids = this.tagIndex.get(tag) ?? new Set();
        ids.add(id);
        this.tagIndex.set(tag, ids);
      }
    }
    return entry;
  }

  /** Query the knowledge base */
  query(q: MemoryQuery): MemoryEntry[] {
    let candidates: MemoryEntry[];

    // Fast path: tag-based lookup
    if (q.tags?.length) {
      const ids = new Set<string>();
      for (const tag of q.tags) {
        const tagIds = this.tagIndex.get(tag);
        if (tagIds) tagIds.forEach((id) => ids.add(id));
      }
      candidates = Array.from(ids)
        .map((id) => this.knowledge.get(id)!)
        .filter(Boolean);
    } else {
      candidates = Array.from(this.knowledge.values());
    }

    if (q.agentRole) {
      candidates = candidates.filter((e) => e.agentRole === q.agentRole);
    }
    if (q.types?.length) {
      candidates = candidates.filter((e) => q.types!.includes(e.type));
    }

    // Text relevance scoring
    if (q.text) {
      const lower = q.text.toLowerCase();
      candidates = candidates.map((e) => ({
        ...e,
        relevance: computeRelevance(e.content, e.tags, lower),
      }));
      candidates = candidates.filter(
        (e) => e.relevance >= (q.minRelevance ?? 0.1)
      );
    }

    // Expire entries with TTL
    const now = Date.now();
    candidates = candidates.filter(
      (e) => !e.ttl || e.timestamp + e.ttl > now
    );

    candidates.sort((a, b) => b.relevance - a.relevance);
    return candidates.slice(0, q.limit ?? 50);
  }

  /** Get a specific entry by ID */
  get(id: string): MemoryEntry | undefined {
    return this.knowledge.get(id);
  }

  /** Remove an entry */
  forget(id: string): boolean {
    const entry = this.knowledge.get(id);
    if (!entry) return false;
    for (const tag of entry.tags) {
      this.tagIndex.get(tag)?.delete(id);
    }
    return this.knowledge.delete(id);
  }

  /** All entries for an agent */
  getAgentKnowledge(role: AgentRole): MemoryEntry[] {
    return Array.from(this.knowledge.values()).filter(
      (e) => e.agentRole === role
    );
  }

  /** Total entries */
  size(): number {
    return this.knowledge.size;
  }

  /** Export for persistence */
  export(): MemoryEntry[] {
    return Array.from(this.knowledge.values());
  }

  /** Import from external store */
  import(entries: MemoryEntry[]): void {
    for (const entry of entries) {
      this.knowledge.set(entry.id, entry);
      for (const tag of entry.tags) {
        const ids = this.tagIndex.get(tag) ?? new Set();
        ids.add(entry.id);
        this.tagIndex.set(tag, ids);
      }
    }
  }
}

// ─── Memory Manager ───────────────────────────────────────────────────

/**
 * Unified coordinator for all memory tiers.
 * Each agent gets its own WorkingMemory; Episodic and Semantic
 * are shared across the team (with per-agent filtering).
 */
export class MemoryManager {
  readonly working: Map<AgentRole, WorkingMemory> = new Map();
  readonly episodic = new EpisodicMemory();
  readonly semantic = new SemanticMemory();

  /** Get or create working memory for an agent */
  getWorkingMemory(role: AgentRole): WorkingMemory {
    let wm = this.working.get(role);
    if (!wm) {
      wm = new WorkingMemory();
      this.working.set(role, wm);
    }
    return wm;
  }

  /** Clear an agent's working memory (typically after a task completes) */
  clearWorkingMemory(role: AgentRole): void {
    this.working.get(role)?.clear();
  }

  /**
   * Unified retrieval — search across all memory tiers and return
   * merged, de-duplicated, relevance-ranked results.
   */
  recall(query: MemoryQuery): MemoryEntry[] {
    const episodic = this.episodic.recall(query);
    const semantic = this.semantic.query(query);

    // Merge and deduplicate by ID
    const seen = new Set<string>();
    const merged: MemoryEntry[] = [];
    for (const entry of [...semantic, ...episodic]) {
      if (!seen.has(entry.id)) {
        seen.add(entry.id);
        merged.push(entry);
      }
    }

    merged.sort((a, b) => b.relevance - a.relevance);
    return merged.slice(0, query.limit ?? 50);
  }

  /**
   * Quick helper: remember something. Stores in both episodic
   * (for timeline) and semantic (for retrieval).
   */
  remember(
    role: AgentRole,
    type: MemoryType,
    content: string,
    tags: string[],
    metadata: Record<string, unknown> = {}
  ): MemoryEntry {
    this.episodic.record({ agentRole: role, type, content, tags, metadata });
    return this.semantic.store({ agentRole: role, type, content, tags, metadata });
  }

  /** Record an artifact reference in memory */
  rememberArtifact(role: AgentRole, artifact: Artifact): MemoryEntry {
    return this.remember(
      role,
      "artifact-ref",
      `Produced artifact: ${artifact.filePath} — ${artifact.description}`,
      [artifact.type, artifact.filePath, artifact.createdBy],
      { artifactId: artifact.id, filePath: artifact.filePath, type: artifact.type }
    );
  }

  /** Record an error for future avoidance */
  rememberError(role: AgentRole, error: string, context: Record<string, unknown> = {}): MemoryEntry {
    return this.remember(role, "error", error, ["error", role], context);
  }

  /** Record a decision for traceability */
  rememberDecision(role: AgentRole, decision: string, reasoning: string): MemoryEntry {
    return this.remember(role, "decision", decision, ["decision", role], { reasoning });
  }

  /** Full export of all memory for serialization */
  export(): { episodic: MemoryEntry[]; semantic: MemoryEntry[] } {
    return {
      episodic: this.episodic.export(),
      semantic: this.semantic.export(),
    };
  }

  /** Import from a previous run */
  import(data: { episodic?: MemoryEntry[]; semantic?: MemoryEntry[] }): void {
    if (data.episodic) this.episodic.import(data.episodic);
    if (data.semantic) this.semantic.import(data.semantic);
  }

  /** Memory stats */
  stats(): { working: number; episodic: number; semantic: number } {
    let workingTotal = 0;
    this.working.forEach((wm) => (workingTotal += wm.size()));
    return {
      working: workingTotal,
      episodic: this.episodic.size(),
      semantic: this.semantic.size(),
    };
  }
}

// ─── Relevance Scoring ────────────────────────────────────────────────

function computeRelevance(content: string, tags: string[], queryLower: string): number {
  const contentLower = content.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter((t) => t.length > 1);

  if (queryTerms.length === 0) return 0.5;

  let hits = 0;
  let totalWeight = 0;

  for (const term of queryTerms) {
    const weight = term.length > 4 ? 1.5 : 1.0;
    totalWeight += weight;

    // Content match
    if (contentLower.includes(term)) {
      hits += weight;
    }

    // Tag match (higher value)
    if (tags.some((tag) => tag.toLowerCase().includes(term))) {
      hits += weight * 0.5;
      totalWeight += weight * 0.5;
    }
  }

  // Exact phrase bonus
  if (contentLower.includes(queryLower)) {
    hits += totalWeight * 0.3;
    totalWeight += totalWeight * 0.3;
  }

  return Math.min(1.0, hits / totalWeight);
}
