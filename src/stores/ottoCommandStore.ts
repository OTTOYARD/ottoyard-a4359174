// src/stores/ottoCommandStore.ts

// OttoCommand AI — Persistent Conversation & Proactive Intelligence Store
// Zustand store managing chat sessions, alert queue, and command context

import { create } from "zustand";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type MessageRole = "user" | "assistant" | "system";
export type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";
export type CommandMode = "av" | "ev";
export type PanelView = "chat" | "context" | "alerts";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  toolCalls?: ToolCallRecord[];
  isStreaming?: boolean;
  metadata?: {
    intent?: string;
    confidence?: number;
    executionTimeMs?: number;
    toolsUsed?: string[];
  };
}

export interface ToolCallRecord {
  toolName: string;
  input: Record<string, unknown>;
  output?: unknown;
  status: "pending" | "success" | "error";
  executionTimeMs?: number;
}

export interface ProactiveAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  suggestedAction?: string;
  suggestedPrompt?: string;
  source: "charging" | "maintenance" | "incident" | "depot" | "anomaly" | "schedule";
  timestamp: string;
  dismissed: boolean;
  expiresAt?: string;
  relatedEntityId?: string;
  relatedEntityType?: "vehicle" | "depot" | "incident" | "job";
}

export interface ConversationSession {
  id: string;
  mode: CommandMode;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  title?: string;
  messageCount: number;
}

export interface OttoCommandState {
  // Active session
  activeSessionId: string | null;
  sessions: Record<string, ConversationSession>;
  currentMode: CommandMode;

  // UI state
  isOpen: boolean;
  isLoading: boolean;
  panelView: PanelView;
  isContextPanelOpen: boolean;
  inputDraft: string;

  // Proactive alerts
  alerts: ProactiveAlert[];
  unreadAlertCount: number;

  // Session actions
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  setMode: (mode: CommandMode) => void;
  setPanelView: (view: PanelView) => void;
  toggleContextPanel: () => void;
  setInputDraft: (draft: string) => void;

  // Message actions
  addUserMessage: (content: string) => string;
  addAssistantMessage: (content: string, metadata?: ChatMessage["metadata"]) => string;
  updateAssistantMessage: (messageId: string, content: string) => void;
  setStreamingMessage: (messageId: string, isStreaming: boolean) => void;
  setLoading: (loading: boolean) => void;

  // Session management
  createSession: (mode: CommandMode) => string;
  switchSession: (sessionId: string) => void;
  clearCurrentSession: () => void;
  deleteSession: (sessionId: string) => void;
  getActiveSession: () => ConversationSession | null;
  getConversationHistory: (limit?: number) => ChatMessage[];

  // Alert actions
  pushAlert: (alert: Omit<ProactiveAlert, "id" | "timestamp" | "dismissed">) => void;
  dismissAlert: (alertId: string) => void;
  dismissAllAlerts: () => void;
  getActiveAlerts: () => ProactiveAlert[];
  actOnAlert: (alertId: string) => string | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const MAX_SESSIONS = 20;
const MAX_MESSAGES_PER_SESSION = 200;

function createWelcomeMessage(mode: CommandMode): ChatMessage {
  const evWelcome = `Hello! I'm **OttoCommand** — your personal EV concierge.\n\nI can help with:\n• **Vehicle Status** — SOC, health, charging ETA, diagnostics\n• **Book Amenities** — Sim golf, cowork tables, privacy pods\n• **Schedule Services** — Detailing, tire rotation, maintenance\n• **Depot Queue** — Stall position, wait times, service stages\n• **Account & Billing** — Membership, charges, reservations\n\nWhat can I do for you?`;

  const avWelcome = `Hello! I'm **OttoCommand AI** — your fleet operations intelligence system.\n\nI can help with:\n• **Fleet Intelligence** — Real-time vehicle & depot status\n• **Predictive Analytics** — Charging needs, maintenance risks\n• **OTTO-Q Automation** — Smart queuing & scheduling\n• **Incident Triage** — OTTOW dispatch & escalation\n• **Analytics & Reporting** — Performance, utilization, comparisons\n\nWhat would you like to know?`;

  return {
    id: generateId(),
    role: "assistant",
    content: mode === "ev" ? evWelcome : avWelcome,
    timestamp: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════════

export const useOttoCommandStore = create<OttoCommandState>((set, get) => ({
  // Initial state
  activeSessionId: null,
  sessions: {},
  currentMode: "av",
  isOpen: false,
  isLoading: false,
  panelView: "chat",
  isContextPanelOpen: false,
  inputDraft: "",
  alerts: [],
  unreadAlertCount: 0,

  // ─────────────────────────────────────────────────────────────────────────────
  // UI ACTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  openPanel: () => {
    const state = get();
    if (!state.activeSessionId) {
      const sessionId = get().createSession(state.currentMode);
      set({ isOpen: true, activeSessionId: sessionId });
    } else {
      set({ isOpen: true });
    }
  },

  closePanel: () => set({ isOpen: false }),

  togglePanel: () => {
    const state = get();
    if (state.isOpen) {
      get().closePanel();
    } else {
      get().openPanel();
    }
  },

  setMode: (mode) => {
    const state = get();
    if (mode !== state.currentMode) {
      const sessionId = get().createSession(mode);
      set({ currentMode: mode, activeSessionId: sessionId });
    }
  },

  setPanelView: (view) => set({ panelView: view }),

  toggleContextPanel: () => set((s) => ({ isContextPanelOpen: !s.isContextPanelOpen })),

  setInputDraft: (draft) => set({ inputDraft: draft }),

  // ─────────────────────────────────────────────────────────────────────────────
  // MESSAGE ACTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  addUserMessage: (content) => {
    const state = get();
    let sessionId = state.activeSessionId;
    if (!sessionId) {
      sessionId = get().createSession(state.currentMode);
    }

    const messageId = generateId();
    const message: ChatMessage = {
      id: messageId,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    set((s) => {
      const session = s.sessions[sessionId!];
      if (!session) return s;

      const messages = [...session.messages, message].slice(-MAX_MESSAGES_PER_SESSION);
      return {
        sessions: {
          ...s.sessions,
          [sessionId!]: {
            ...session,
            messages,
            updatedAt: new Date().toISOString(),
            messageCount: messages.length,
            title: session.title || content.slice(0, 60) + (content.length > 60 ? "…" : ""),
          },
        },
        inputDraft: "",
      };
    });

    return messageId;
  },

  addAssistantMessage: (content, metadata) => {
    const state = get();
    const sessionId = state.activeSessionId;
    if (!sessionId) return "";

    const messageId = generateId();
    const message: ChatMessage = {
      id: messageId,
      role: "assistant",
      content,
      timestamp: new Date().toISOString(),
      metadata,
    };

    set((s) => {
      const session = s.sessions[sessionId];
      if (!session) return s;

      const messages = [...session.messages, message].slice(-MAX_MESSAGES_PER_SESSION);
      return {
        sessions: {
          ...s.sessions,
          [sessionId]: {
            ...session,
            messages,
            updatedAt: new Date().toISOString(),
            messageCount: messages.length,
          },
        },
      };
    });

    return messageId;
  },

  updateAssistantMessage: (messageId, content) => {
    const state = get();
    const sessionId = state.activeSessionId;
    if (!sessionId) return;

    set((s) => {
      const session = s.sessions[sessionId];
      if (!session) return s;

      return {
        sessions: {
          ...s.sessions,
          [sessionId]: {
            ...session,
            messages: session.messages.map((m) =>
              m.id === messageId ? { ...m, content } : m
            ),
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  },

  setStreamingMessage: (messageId, isStreaming) => {
    const state = get();
    const sessionId = state.activeSessionId;
    if (!sessionId) return;

    set((s) => {
      const session = s.sessions[sessionId];
      if (!session) return s;

      return {
        sessions: {
          ...s.sessions,
          [sessionId]: {
            ...session,
            messages: session.messages.map((m) =>
              m.id === messageId ? { ...m, isStreaming } : m
            ),
          },
        },
      };
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  // ─────────────────────────────────────────────────────────────────────────────
  // SESSION MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  createSession: (mode) => {
    const sessionId = generateId();
    const welcomeMessage = createWelcomeMessage(mode);

    const session: ConversationSession = {
      id: sessionId,
      mode,
      messages: [welcomeMessage],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 1,
    };

    set((s) => {
      const sessions = { ...s.sessions, [sessionId]: session };

      // Prune oldest sessions if over limit
      const sessionIds = Object.keys(sessions).sort(
        (a, b) =>
          new Date(sessions[b].updatedAt).getTime() -
          new Date(sessions[a].updatedAt).getTime()
      );

      if (sessionIds.length > MAX_SESSIONS) {
        for (const oldId of sessionIds.slice(MAX_SESSIONS)) {
          delete sessions[oldId];
        }
      }

      return { sessions, activeSessionId: sessionId };
    });

    return sessionId;
  },

  switchSession: (sessionId) => {
    const state = get();
    if (state.sessions[sessionId]) {
      set({
        activeSessionId: sessionId,
        currentMode: state.sessions[sessionId].mode,
      });
    }
  },

  clearCurrentSession: () => {
    const state = get();
    if (state.activeSessionId && state.sessions[state.activeSessionId]) {
      const mode = state.sessions[state.activeSessionId].mode;
      const newSessionId = get().createSession(mode);
      set({ activeSessionId: newSessionId });
    }
  },

  deleteSession: (sessionId) => {
    set((s) => {
      const sessions = { ...s.sessions };
      delete sessions[sessionId];

      const newActiveId =
        s.activeSessionId === sessionId
          ? Object.keys(sessions).sort(
              (a, b) =>
                new Date(sessions[b].updatedAt).getTime() -
                new Date(sessions[a].updatedAt).getTime()
            )[0] || null
          : s.activeSessionId;

      return { sessions, activeSessionId: newActiveId };
    });
  },

  getActiveSession: () => {
    const state = get();
    if (!state.activeSessionId) return null;
    return state.sessions[state.activeSessionId] || null;
  },

  getConversationHistory: (limit = 10) => {
    const session = get().getActiveSession();
    if (!session) return [];
    return session.messages.slice(-limit);
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ALERT ACTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  pushAlert: (alertData) => {
    const alert: ProactiveAlert = {
      ...alertData,
      id: generateId(),
      timestamp: new Date().toISOString(),
      dismissed: false,
    };

    set((s) => {
      // Deduplicate by source + relatedEntityId
      const isDuplicate = s.alerts.some(
        (a) =>
          !a.dismissed &&
          a.source === alert.source &&
          a.relatedEntityId === alert.relatedEntityId &&
          a.title === alert.title
      );

      if (isDuplicate) return s;

      const alerts = [alert, ...s.alerts].slice(0, 50);
      return {
        alerts,
        unreadAlertCount: alerts.filter((a) => !a.dismissed).length,
      };
    });
  },

  dismissAlert: (alertId) => {
    set((s) => {
      const alerts = s.alerts.map((a) =>
        a.id === alertId ? { ...a, dismissed: true } : a
      );
      return {
        alerts,
        unreadAlertCount: alerts.filter((a) => !a.dismissed).length,
      };
    });
  },

  dismissAllAlerts: () => {
    set((s) => ({
      alerts: s.alerts.map((a) => ({ ...a, dismissed: true })),
      unreadAlertCount: 0,
    }));
  },

  getActiveAlerts: () => {
    const state = get();
    const now = new Date().getTime();
    return state.alerts.filter(
      (a) => !a.dismissed && (!a.expiresAt || new Date(a.expiresAt).getTime() > now)
    );
  },

  actOnAlert: (alertId) => {
    const state = get();
    const alert = state.alerts.find((a) => a.id === alertId);
    if (!alert?.suggestedPrompt) return null;

    get().dismissAlert(alertId);
    return alert.suggestedPrompt;
  },
}));

export default useOttoCommandStore;
