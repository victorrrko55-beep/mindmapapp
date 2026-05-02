"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type MindMapNode = {
  id: string;
  label: string;
  parentId: string | null;
  x?: number;
  y?: number;
};

type MindMapDocument = {
  title: string;
  nodes: MindMapNode[];
};

type PositionedNode = MindMapNode & {
  x: number;
  y: number;
};

type CloudMapSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

const HORIZONTAL_GAP = 260;
const VERTICAL_GAP = 112;
const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;
const STORAGE_KEY = "building-mind-map.v2";
const PROFILE_KEY = "building-mind-map.profile";
const INITIAL_DOCUMENT: MindMapDocument = {
  title: "Building Mind Map",
  nodes: [
    { id: "root", label: "Building Mind Map", parentId: null },
    { id: "ideas", label: "Core Ideas", parentId: "root" },
    { id: "ux", label: "User Experience", parentId: "root" },
    { id: "features", label: "Features", parentId: "root" },
    { id: "capture", label: "Quick capture", parentId: "ideas" },
    { id: "organize", label: "Organize thoughts", parentId: "ideas" },
    { id: "drag", label: "Drag nodes", parentId: "ux" },
    { id: "focus", label: "Focus mode", parentId: "ux" },
    { id: "share", label: "Share maps", parentId: "features" },
    { id: "export", label: "Export JSON", parentId: "features" },
  ],
};

function createId() {
  return `node-${Math.random().toString(36).slice(2, 9)}`;
}

function isValidNodes(value: unknown): value is MindMapNode[] {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }

  return value.every((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const candidate = item as Partial<MindMapNode>;

    return (
      typeof candidate.id === "string" &&
      typeof candidate.label === "string" &&
      (typeof candidate.parentId === "string" || candidate.parentId === null) &&
      (typeof candidate.x === "number" || typeof candidate.x === "undefined") &&
      (typeof candidate.y === "number" || typeof candidate.y === "undefined")
    );
  });
}

function normalizeNodes(value: unknown) {
  if (!isValidNodes(value)) {
    return null;
  }

  const ids = new Set(value.map((node) => node.id));
  const normalized = value.map((node) => ({
    ...node,
    label: node.label.trim() || "Untitled idea",
    parentId: node.parentId && ids.has(node.parentId) ? node.parentId : null,
    x: typeof node.x === "number" ? node.x : undefined,
    y: typeof node.y === "number" ? node.y : undefined,
  }));

  if (!normalized.some((node) => node.parentId === null)) {
    normalized[0] = { ...normalized[0], parentId: null };
  }

  return normalized;
}

function normalizeDocument(value: unknown): MindMapDocument | null {
  if (Array.isArray(value)) {
    const nodes = normalizeNodes(value);

    return nodes
      ? {
          title: nodes.find((node) => node.parentId === null)?.label ?? "My Mind Map",
          nodes,
        }
      : null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<MindMapDocument>;
  const nodes = normalizeNodes(candidate.nodes);

  if (!nodes) {
    return null;
  }

  return {
    title:
      typeof candidate.title === "string" && candidate.title.trim()
        ? candidate.title.trim()
        : nodes.find((node) => node.parentId === null)?.label ?? "My Mind Map",
    nodes,
  };
}

function buildLayout(nodes: MindMapNode[]) {
  const childrenMap = new Map<string | null, MindMapNode[]>();

  for (const node of nodes) {
    const siblings = childrenMap.get(node.parentId) ?? [];
    siblings.push(node);
    childrenMap.set(node.parentId, siblings);
  }

  const subtreeUnits = (nodeId: string): number => {
    const children = childrenMap.get(nodeId) ?? [];

    if (children.length === 0) {
      return 1;
    }

    return children.reduce((sum, child) => sum + subtreeUnits(child.id), 0);
  };

  const positioned = new Map<string, PositionedNode>();
  let cursor = 0;

  const placeNode = (node: MindMapNode, depth: number, start: number) => {
    const children = childrenMap.get(node.id) ?? [];
    const units = subtreeUnits(node.id);
    const center = start + units / 2;

    positioned.set(node.id, {
      ...node,
      x: typeof node.x === "number" ? node.x : depth * HORIZONTAL_GAP,
      y: typeof node.y === "number" ? node.y : center * VERTICAL_GAP,
    });

    let nextStart = start;

    for (const child of children) {
      const childUnits = subtreeUnits(child.id);
      placeNode(child, depth + 1, nextStart);
      nextStart += childUnits;
    }
  };

  for (const root of childrenMap.get(null) ?? []) {
    const rootUnits = subtreeUnits(root.id);
    placeNode(root, 0, cursor);
    cursor += rootUnits + 0.7;
  }

  const positionedNodes = nodes
    .map((node) => positioned.get(node.id))
    .filter((node): node is PositionedNode => Boolean(node));

  const maxX = positionedNodes.reduce((max, node) => Math.max(max, node.x), 0);
  const maxY = positionedNodes.reduce((max, node) => Math.max(max, node.y), 0);

  return {
    positionedNodes,
    width: maxX + NODE_WIDTH + 200,
    height: maxY + NODE_HEIGHT + 160,
  };
}

function collectDescendantIds(nodes: MindMapNode[], targetId: string) {
  const ids = new Set<string>([targetId]);
  let changed = true;

  while (changed) {
    changed = false;

    for (const node of nodes) {
      if (!ids.has(node.id) && node.parentId && ids.has(node.parentId)) {
        ids.add(node.id);
        changed = true;
      }
    }
  }

  return ids;
}

function upsertSummary(items: CloudMapSummary[], nextItem: CloudMapSummary) {
  const remaining = items.filter((item) => item.id !== nextItem.id);
  return [nextItem, ...remaining].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export default function HomePage() {
  const [title, setTitle] = useState(INITIAL_DOCUMENT.title);
  const [nodes, setNodes] = useState<MindMapNode[]>(INITIAL_DOCUMENT.nodes);
  const [selectedId, setSelectedId] = useState<string>("root");
  const [draftLabel, setDraftLabel] = useState(INITIAL_DOCUMENT.nodes[0]?.label ?? "");
  const [importValue, setImportValue] = useState("");
  const [statusMessage, setStatusMessage] = useState("Map autosaves in this browser.");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [cloudMaps, setCloudMaps] = useState<CloudMapSummary[]>([]);
  const [activeCloudMapId, setActiveCloudMapId] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState("Cloud sync is off.");

  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const skipCloudSaveRef = useRef(false);

  const layout = useMemo(() => buildLayout(nodes), [nodes]);
  const positionedById = useMemo(
    () => new Map(layout.positionedNodes.map((node) => [node.id, node])),
    [layout.positionedNodes]
  );
  const selectedNode = nodes.find((node) => node.id === selectedId) ?? null;
  const rootCount = nodes.filter((node) => node.parentId === null).length;
  const leafCount = nodes.filter((node) => !nodes.some((item) => item.parentId === node.id)).length;
  const manualPositionCount = nodes.filter(
    (node) => typeof node.x === "number" && typeof node.y === "number"
  ).length;
  const maxDepth = nodes.reduce((max, node) => {
    let depth = 0;
    let cursor = node.parentId;

    while (cursor) {
      const parent = nodes.find((item) => item.id === cursor);

      if (!parent) {
        break;
      }

      depth += 1;
      cursor = parent.parentId;
    }

    return Math.max(max, depth);
  }, 0);

  useEffect(() => {
    setDraftLabel(selectedNode?.label ?? "");
  }, [selectedNode]);

  useEffect(() => {
    const storedDocument = window.localStorage.getItem(STORAGE_KEY);
    const storedProfile = window.localStorage.getItem(PROFILE_KEY);

    if (storedDocument) {
      try {
        const parsed = JSON.parse(storedDocument);
        const normalized = normalizeDocument(parsed);

        if (normalized) {
          setTitle(normalized.title);
          setNodes(normalized.nodes);
          setSelectedId(normalized.nodes[0]?.id ?? "root");
          setStatusMessage("Loaded your saved local mind map.");
        }
      } catch {
        setStatusMessage("Saved local data could not be read, so the starter map was loaded.");
      }
    }

    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile) as {
          email?: string;
          name?: string;
          syncEnabled?: boolean;
          activeCloudMapId?: string | null;
        };

        setEmail(parsed.email ?? "");
        setName(parsed.name ?? "");
        setSyncEnabled(Boolean(parsed.syncEnabled && parsed.email));
        setActiveCloudMapId(parsed.activeCloudMapId ?? null);
      } catch {
        setCloudStatus("Saved account details could not be read.");
      }
    }

    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ title, nodes }));
    window.localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify({
        email,
        name,
        syncEnabled,
        activeCloudMapId,
      })
    );
  }, [activeCloudMapId, email, hasLoaded, name, nodes, syncEnabled, title]);

  async function authorizedFetch(input: string, init?: RequestInit) {
    const headers = new Headers(init?.headers);

    if (email.trim()) {
      headers.set("x-user-email", email.trim().toLowerCase());
      if (name.trim()) {
        headers.set("x-user-name", name.trim());
      }
    }

    return fetch(input, {
      ...init,
      headers,
    });
  }

  async function fetchCloudMaps() {
    if (!email.trim()) {
      return;
    }

    const response = await authorizedFetch("/api/mind-maps");
    const body = (await response.json()) as {
      items?: CloudMapSummary[];
      error?: string;
    };

    if (!response.ok) {
      throw new Error(body.error ?? "Could not load cloud maps.");
    }

    const items = body.items ?? [];
    setCloudMaps(items);

    if (!activeCloudMapId && items[0]) {
      setActiveCloudMapId(items[0].id);
    }

    setCloudStatus(items.length > 0 ? "Cloud maps loaded." : "Connected. No cloud maps yet.");
  }

  async function enableCloudSync() {
    if (!email.trim()) {
      setCloudStatus("Add an email address first.");
      return;
    }

    setSyncEnabled(true);
    setCloudStatus("Connecting to cloud sync...");

    try {
      await fetchCloudMaps();
    } catch (error) {
      setCloudStatus(error instanceof Error ? error.message : "Cloud sync failed.");
    }
  }

  async function saveCurrentMapToCloud(mapId?: string | null) {
    if (!email.trim()) {
      setCloudStatus("Add an email address before saving to the cloud.");
      return null;
    }

    const payload = {
      title: title.trim() || "My Mind Map",
      nodes,
    };

    const response = await authorizedFetch(mapId ? `/api/mind-maps/${mapId}` : "/api/mind-maps", {
      method: mapId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as {
      map?: { id: string; title: string; updatedAt: string; nodes: MindMapNode[] };
      error?: string;
    };

    if (!response.ok || !body.map) {
      throw new Error(body.error ?? "Cloud save failed.");
    }

    setActiveCloudMapId(body.map.id);
    setCloudMaps((current) =>
      upsertSummary(current, {
        id: body.map!.id,
        title: body.map!.title,
        updatedAt: body.map!.updatedAt,
      })
    );
    setCloudStatus(`Cloud saved at ${new Date(body.map.updatedAt).toLocaleString()}.`);
    return body.map.id;
  }

  async function loadCloudMap(mapId: string) {
    const response = await authorizedFetch(`/api/mind-maps/${mapId}`);
    const body = (await response.json()) as {
      map?: { id: string; title: string; nodes: unknown; updatedAt: string };
      error?: string;
    };

    if (!response.ok || !body.map) {
      throw new Error(body.error ?? "Could not load cloud map.");
    }

    const normalized = normalizeDocument({
      title: body.map.title,
      nodes: body.map.nodes,
    });

    if (!normalized) {
      throw new Error("Cloud map data was invalid.");
    }

    skipCloudSaveRef.current = true;
    setTitle(normalized.title);
    setNodes(normalized.nodes);
    setSelectedId(normalized.nodes[0]?.id ?? "root");
    setActiveCloudMapId(body.map.id);
    setCloudStatus(`Loaded cloud map updated ${new Date(body.map.updatedAt).toLocaleString()}.`);
  }

  async function deleteCloudMap(mapId: string) {
    const response = await authorizedFetch(`/api/mind-maps/${mapId}`, {
      method: "DELETE",
    });
    const body = (await response.json()) as {
      success?: boolean;
      error?: string;
    };

    if (!response.ok || !body.success) {
      throw new Error(body.error ?? "Could not delete cloud map.");
    }

    const remaining = cloudMaps.filter((item) => item.id !== mapId);
    setCloudMaps(remaining);
    setActiveCloudMapId(remaining[0]?.id ?? null);
    setCloudStatus("Deleted the cloud map.");
  }

  useEffect(() => {
    if (!hasLoaded || !syncEnabled || !email.trim() || !activeCloudMapId) {
      return;
    }

    if (skipCloudSaveRef.current) {
      skipCloudSaveRef.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      saveCurrentMapToCloud(activeCloudMapId).catch((error) => {
        setCloudStatus(error instanceof Error ? error.message : "Autosync failed.");
      });
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [activeCloudMapId, email, hasLoaded, nodes, syncEnabled, title]);

  useEffect(() => {
    if (!syncEnabled || !email.trim()) {
      return;
    }

    fetchCloudMaps().catch((error) => {
      setCloudStatus(error instanceof Error ? error.message : "Could not refresh cloud maps.");
    });
  }, [email, syncEnabled]);

  useEffect(() => {
    if (!draggedId) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const stage = stageRef.current;

      if (!stage) {
        return;
      }

      const rect = stage.getBoundingClientRect();
      const nextX = Math.max(0, event.clientX - rect.left - dragOffsetRef.current.x);
      const nextY = Math.max(0, event.clientY - rect.top - dragOffsetRef.current.y);

      setNodes((current) =>
        current.map((node) =>
          node.id === draggedId
            ? {
                ...node,
                x: Math.round(nextX),
                y: Math.round(nextY),
              }
            : node
        )
      );
    };

    const handlePointerUp = () => {
      setDraggedId(null);
      setStatusMessage("Moved node and saved its position.");
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggedId]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const tagName = (event.target as HTMLElement | null)?.tagName;

      if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && selectedNode) {
        event.preventDefault();
        deleteSelectedNode();
      }

      if (event.key.toLowerCase() === "n" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        addNode(selectedNode?.id ?? null);
      }

      if (event.key.toLowerCase() === "s" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (syncEnabled && email.trim()) {
          saveCurrentMapToCloud(activeCloudMapId).catch((error) => {
            setCloudStatus(error instanceof Error ? error.message : "Cloud save failed.");
          });
        } else {
          setStatusMessage("Saved locally in this browser.");
        }
      }
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, [activeCloudMapId, email, selectedNode, syncEnabled, title, nodes]);

  const addNode = (parentId: string | null) => {
    const newNode: MindMapNode = {
      id: createId(),
      label: "New idea",
      parentId,
    };

    setNodes((current) => [...current, newNode]);
    setSelectedId(newNode.id);
    setStatusMessage(parentId ? "Added a new branch." : "Added a new root idea.");
  };

  const updateSelectedLabel = (label: string) => {
    setNodes((current) =>
      current.map((node) => (node.id === selectedId ? { ...node, label } : node))
    );
  };

  const saveDraftLabel = () => {
    if (!selectedNode) {
      return;
    }

    const nextLabel = draftLabel.trim() || "Untitled idea";
    updateSelectedLabel(nextLabel);
    setDraftLabel(nextLabel);
    setStatusMessage(`Renamed node to "${nextLabel}".`);
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) {
      return;
    }

    const idsToDelete = collectDescendantIds(nodes, selectedNode.id);
    const fallback = selectedNode.parentId ?? nodes.find((node) => node.id !== selectedNode.id)?.id ?? "";

    setNodes((current) => current.filter((node) => !idsToDelete.has(node.id)));
    setSelectedId(fallback);
    setStatusMessage(`Removed "${selectedNode.label}" and its branch.`);
  };

  const resetDemo = () => {
    skipCloudSaveRef.current = true;
    setTitle(INITIAL_DOCUMENT.title);
    setNodes(INITIAL_DOCUMENT.nodes);
    setSelectedId("root");
    setImportValue("");
    setStatusMessage("Reset to the starter demo map.");
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ title, nodes }, null, 2));
      setStatusMessage("Copied map JSON to the clipboard.");
    } catch {
      setStatusMessage("Clipboard copy failed. You can still copy from the export box.");
    }
  };

  const importJson = () => {
    try {
      const parsed = JSON.parse(importValue);
      const normalized = normalizeDocument(parsed);

      if (!normalized) {
        setStatusMessage("Import failed. Please paste valid map JSON.");
        return;
      }

      skipCloudSaveRef.current = true;
      setTitle(normalized.title);
      setNodes(normalized.nodes);
      setSelectedId(normalized.nodes[0]?.id ?? "root");
      setStatusMessage("Imported a new map from JSON.");
    } catch {
      setStatusMessage("Import failed. The JSON could not be parsed.");
    }
  };

  const clearSavedMap = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setStatusMessage("Cleared saved browser data for this map.");
  };

  const resetDraggedPositions = () => {
    setNodes((current) =>
      current.map((node) => ({
        ...node,
        x: undefined,
        y: undefined,
      }))
    );
    setStatusMessage("Reset dragged nodes back to automatic layout.");
  };

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>, nodeId: string) => {
    const stage = stageRef.current;
    const position = positionedById.get(nodeId);

    if (!stage || !position) {
      return;
    }

    const rect = stage.getBoundingClientRect();

    dragOffsetRef.current = {
      x: event.clientX - rect.left - position.x,
      y: event.clientY - rect.top - position.y,
    };

    setSelectedId(nodeId);
    setDraggedId(nodeId);
    setStatusMessage("Dragging node...");
  };

  const renameFromNode = (nodeId: string) => {
    const current = nodes.find((node) => node.id === nodeId);

    if (!current) {
      return;
    }

    const nextLabel = window.prompt("Rename this node", current.label);

    if (nextLabel === null) {
      return;
    }

    const trimmed = nextLabel.trim() || "Untitled idea";

    setNodes((currentNodes) =>
      currentNodes.map((node) => (node.id === nodeId ? { ...node, label: trimmed } : node))
    );
    setSelectedId(nodeId);
    setDraftLabel(trimmed);
    setStatusMessage(`Renamed node to "${trimmed}".`);
  };

  const exportPayload = JSON.stringify({ title, nodes }, null, 2);

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Visual Thinking App</p>
          <h1>{title}</h1>
          <p className="hero-copy">
            Sketch ideas, branch into details, and sync them across devices once your database is
            connected.
          </p>
          <p className="status-pill">{statusMessage}</p>
          <p className="cloud-pill">{cloudStatus}</p>
        </div>

        <div className="stats-grid">
          <article>
            <strong>{nodes.length}</strong>
            <span>Nodes</span>
          </article>
          <article>
            <strong>{rootCount}</strong>
            <span>Root ideas</span>
          </article>
          <article>
            <strong>{maxDepth + 1}</strong>
            <span>Levels</span>
          </article>
          <article>
            <strong>{leafCount}</strong>
            <span>Leaf ideas</span>
          </article>
          <article>
            <strong>{manualPositionCount}</strong>
            <span>Dragged nodes</span>
          </article>
          <article>
            <strong>{cloudMaps.length}</strong>
            <span>Cloud maps</span>
          </article>
        </div>
      </section>

      <section className="workspace-grid">
        <aside className="panel">
          <h2>Cloud Sync</h2>

          <label className="field-label" htmlFor="account-email">
            Email
          </label>
          <input
            id="account-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />

          <label className="field-label" htmlFor="account-name">
            Name
          </label>
          <input
            id="account-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Victor"
          />

          <div className="button-row">
            <button onClick={enableCloudSync} type="button">
              Enable sync
            </button>
            <button
              className="ghost-button"
              onClick={() => saveCurrentMapToCloud(activeCloudMapId).catch((error) => {
                setCloudStatus(error instanceof Error ? error.message : "Cloud save failed.");
              })}
              type="button"
            >
              Save now
            </button>
          </div>

          <label className="field-label" htmlFor="cloud-map-title">
            Map title
          </label>
          <input
            id="cloud-map-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="My Mind Map"
          />

          <label className="field-label" htmlFor="cloud-map-select">
            Saved cloud maps
          </label>
          <select
            id="cloud-map-select"
            value={activeCloudMapId ?? ""}
            onChange={(event) => setActiveCloudMapId(event.target.value || null)}
          >
            <option value="">Choose a map</option>
            {cloudMaps.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>

          <div className="button-row">
            <button
              className="ghost-button"
              disabled={!activeCloudMapId}
              onClick={() => {
                if (!activeCloudMapId) {
                  return;
                }

                loadCloudMap(activeCloudMapId).catch((error) => {
                  setCloudStatus(error instanceof Error ? error.message : "Could not load cloud map.");
                });
              }}
              type="button"
            >
              Load map
            </button>
            <button
              className="ghost-button"
              onClick={() => saveCurrentMapToCloud(null).catch((error) => {
                setCloudStatus(error instanceof Error ? error.message : "Could not create cloud map.");
              })}
              type="button"
            >
              Save as new
            </button>
          </div>

          <button
            className="ghost-button full-width-button"
            disabled={!activeCloudMapId}
            onClick={() => {
              if (!activeCloudMapId) {
                return;
              }

              deleteCloudMap(activeCloudMapId).catch((error) => {
                setCloudStatus(error instanceof Error ? error.message : "Could not delete cloud map.");
              });
            }}
            type="button"
          >
            Delete selected cloud map
          </button>

          <p className="helper-text">
            Use the same email on your laptop and phone. Once `DATABASE_URL` is configured in
            production, this page can save the map into Postgres and load it on other devices.
          </p>

          <div className="ideas-list">
            <h3>Editor</h3>

            <div className="button-row">
              <button onClick={() => addNode(selectedNode?.id ?? null)} type="button">
                Add child
              </button>
              <button onClick={() => addNode(selectedNode?.parentId ?? null)} type="button">
                Add sibling
              </button>
            </div>

            <div className="button-row">
              <button className="ghost-button" onClick={() => addNode(null)} type="button">
                New root
              </button>
              <button className="ghost-button" onClick={resetDemo} type="button">
                Reset demo
              </button>
            </div>

            <label className="field-label" htmlFor="node-label">
              Selected node
            </label>
            <input
              id="node-label"
              value={draftLabel}
              onChange={(event) => setDraftLabel(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  saveDraftLabel();
                }
              }}
              placeholder="Select a node"
            />

            <div className="button-row">
              <button onClick={saveDraftLabel} type="button">
                Save name
              </button>
              <button
                className="ghost-button"
                onClick={() => setDraftLabel(selectedNode?.label ?? "")}
                type="button"
              >
                Revert text
              </button>
            </div>

            <button
              className="danger-button"
              disabled={!selectedNode}
              onClick={deleteSelectedNode}
              type="button"
            >
              Delete branch
            </button>

            <button className="ghost-button full-width-button" onClick={resetDraggedPositions} type="button">
              Reset node positions
            </button>
          </div>
        </aside>

        <section className="canvas-card">
          <div className="canvas-toolbar">
            <span>Mind map canvas</span>
            <div className="mini-actions">
              <button className="ghost-button" onClick={copyJson} type="button">
                Copy JSON
              </button>
              <button className="ghost-button" onClick={resetDraggedPositions} type="button">
                Auto layout
              </button>
              <button className="ghost-button" onClick={clearSavedMap} type="button">
                Clear local
              </button>
            </div>
          </div>

          <div className="canvas-scroll">
            <div
              className="canvas-stage"
              ref={stageRef}
              style={{ width: `${layout.width}px`, height: `${layout.height}px` }}
            >
              <svg className="connection-layer" viewBox={`0 0 ${layout.width} ${layout.height}`}>
                {layout.positionedNodes.map((node) => {
                  if (!node.parentId) {
                    return null;
                  }

                  const parent = positionedById.get(node.parentId);

                  if (!parent) {
                    return null;
                  }

                  return (
                    <path
                      key={`${parent.id}-${node.id}`}
                      d={`M ${parent.x + NODE_WIDTH} ${parent.y + NODE_HEIGHT / 2} C ${
                        parent.x + NODE_WIDTH + 40
                      } ${parent.y + NODE_HEIGHT / 2}, ${node.x - 50} ${node.y + NODE_HEIGHT / 2}, ${
                        node.x
                      } ${node.y + NODE_HEIGHT / 2}`}
                    />
                  );
                })}
              </svg>

              {layout.positionedNodes.map((node) => (
                <button
                  key={node.id}
                  className={`mind-node ${node.id === selectedId ? "selected" : ""} ${
                    node.id === draggedId ? "dragging" : ""
                  }`}
                  onClick={() => setSelectedId(node.id)}
                  onDoubleClick={() => renameFromNode(node.id)}
                  onPointerDown={(event) => startDrag(event, node.id)}
                  style={{ left: `${node.x}px`, top: `${node.y}px` }}
                  type="button"
                >
                  <span>{node.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="panel export-panel">
          <h2>Data</h2>
          <p className="helper-text">
            Export and import full map documents. This stays useful even after cloud sync is set up.
          </p>

          <label className="field-label" htmlFor="export-json">
            Export JSON
          </label>
          <textarea id="export-json" readOnly value={exportPayload} />

          <label className="field-label" htmlFor="import-json">
            Import JSON
          </label>
          <textarea
            id="import-json"
            value={importValue}
            onChange={(event) => setImportValue(event.target.value)}
            placeholder='Paste {"title":"My Map","nodes":[...]} or a node array'
          />

          <div className="button-row">
            <button onClick={importJson} type="button">
              Import map
            </button>
            <button className="ghost-button" onClick={() => setImportValue("")} type="button">
              Clear box
            </button>
          </div>
        </aside>
      </section>

      <style jsx>{`
        :global(body) {
          margin: 0;
          font-family: "Avenir Next", "Segoe UI", sans-serif;
          background:
            radial-gradient(circle at top left, rgba(255, 204, 112, 0.35), transparent 28%),
            radial-gradient(circle at top right, rgba(75, 145, 255, 0.22), transparent 24%),
            linear-gradient(180deg, #f8f4ec 0%, #efe7db 100%);
          color: #1f2937;
        }

        * {
          box-sizing: border-box;
        }

        .page-shell {
          min-height: 100vh;
          padding: 32px;
        }

        .hero-card,
        .panel,
        .canvas-card {
          border: 1px solid rgba(31, 41, 55, 0.08);
          background: rgba(255, 252, 247, 0.88);
          box-shadow: 0 24px 60px rgba(119, 95, 61, 0.12);
          backdrop-filter: blur(16px);
        }

        .hero-card {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          padding: 28px 30px;
          border-radius: 28px;
          margin-bottom: 24px;
        }

        .eyebrow {
          margin: 0 0 8px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-size: 12px;
          color: #b0631f;
          font-weight: 700;
        }

        h1 {
          margin: 0;
          font-size: clamp(2.1rem, 4vw, 3.8rem);
          line-height: 0.95;
          max-width: 10ch;
        }

        .hero-copy {
          max-width: 54ch;
          margin: 14px 0 0;
          color: #4b5563;
          font-size: 1rem;
        }

        .status-pill,
        .cloud-pill {
          display: inline-flex;
          margin: 18px 12px 0 0;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.8);
          font-size: 0.92rem;
          font-weight: 600;
        }

        .status-pill {
          color: #8b4b12;
        }

        .cloud-pill {
          color: #174da8;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(120px, 1fr));
          gap: 12px;
          min-width: min(420px, 100%);
        }

        .stats-grid article {
          border-radius: 20px;
          padding: 18px;
          background: linear-gradient(180deg, #fff 0%, #f9efe0 100%);
        }

        .stats-grid strong {
          display: block;
          font-size: 2rem;
          margin-bottom: 6px;
        }

        .stats-grid span,
        .helper-text,
        .ideas-list li {
          color: #6b7280;
        }

        .workspace-grid {
          display: grid;
          grid-template-columns: 320px minmax(0, 1fr) 320px;
          gap: 20px;
          align-items: start;
        }

        .panel,
        .canvas-card {
          border-radius: 24px;
        }

        .panel {
          padding: 22px;
        }

        .canvas-card {
          padding: 18px;
          min-height: 760px;
        }

        h2,
        h3 {
          margin-top: 0;
        }

        .button-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }

        .full-width-button {
          width: 100%;
          margin-top: 12px;
        }

        button,
        input,
        textarea,
        select {
          font: inherit;
        }

        button {
          border: none;
          border-radius: 16px;
          padding: 12px 14px;
          background: linear-gradient(180deg, #1f4fd1 0%, #163ca2 100%);
          color: white;
          cursor: pointer;
          transition:
            transform 120ms ease,
            box-shadow 120ms ease,
            opacity 120ms ease;
        }

        button:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 24px rgba(22, 60, 162, 0.18);
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.45;
          transform: none;
          box-shadow: none;
        }

        .ghost-button {
          background: #e9eefb;
          color: #1f4fd1;
        }

        .danger-button {
          width: 100%;
          margin-top: 12px;
          background: linear-gradient(180deg, #d85748 0%, #b53529 100%);
        }

        .field-label {
          display: block;
          margin: 18px 0 8px;
          font-weight: 700;
        }

        input,
        textarea,
        select {
          width: 100%;
          border: 1px solid rgba(31, 41, 55, 0.12);
          border-radius: 18px;
          padding: 13px 14px;
          background: rgba(255, 255, 255, 0.8);
          color: #1f2937;
        }

        textarea {
          min-height: 240px;
          resize: vertical;
          line-height: 1.45;
        }

        .ideas-list {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid rgba(31, 41, 55, 0.08);
        }

        .canvas-toolbar {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          margin-bottom: 14px;
          font-weight: 700;
        }

        .mini-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .mini-actions button {
          padding: 10px 12px;
        }

        .canvas-scroll {
          overflow: auto;
          border-radius: 18px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(247, 240, 229, 0.95)),
            repeating-linear-gradient(
              0deg,
              rgba(66, 76, 94, 0.06),
              rgba(66, 76, 94, 0.06) 1px,
              transparent 1px,
              transparent 56px
            ),
            repeating-linear-gradient(
              90deg,
              rgba(66, 76, 94, 0.06),
              rgba(66, 76, 94, 0.06) 1px,
              transparent 1px,
              transparent 56px
            );
        }

        .canvas-stage {
          position: relative;
          user-select: none;
        }

        .connection-layer {
          position: absolute;
          inset: 0;
          overflow: visible;
        }

        .connection-layer path {
          fill: none;
          stroke: rgba(28, 52, 117, 0.3);
          stroke-width: 4;
          stroke-linecap: round;
        }

        .mind-node {
          position: absolute;
          width: ${NODE_WIDTH}px;
          min-height: ${NODE_HEIGHT}px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 12px;
          border-radius: 22px;
          background: linear-gradient(180deg, #fff8ea 0%, #ffe5b8 100%);
          color: #31210f;
          box-shadow: 0 16px 35px rgba(129, 95, 27, 0.15);
          touch-action: none;
        }

        .mind-node.selected {
          background: linear-gradient(180deg, #ffe4cf 0%, #ffb679 100%);
          box-shadow: 0 20px 40px rgba(186, 93, 28, 0.28);
        }

        .mind-node.dragging {
          cursor: grabbing;
          transform: scale(1.03);
        }

        .export-panel {
          min-height: 760px;
        }

        @media (max-width: 1200px) {
          .workspace-grid {
            grid-template-columns: 1fr;
          }

          .canvas-card,
          .export-panel {
            min-height: 0;
          }

          textarea {
            min-height: 220px;
          }
        }

        @media (max-width: 720px) {
          .page-shell {
            padding: 18px;
          }

          .hero-card,
          .canvas-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .stats-grid,
          .button-row {
            grid-template-columns: 1fr;
          }

          .mini-actions {
            width: 100%;
          }

          .mini-actions button {
            flex: 1;
          }
        }
      `}</style>
    </main>
  );
}
