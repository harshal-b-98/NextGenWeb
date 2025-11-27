import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workspace, WorkspaceMember, UserRole } from '@/types';

interface WorkspaceState {
  // Current workspace
  currentWorkspace: Workspace | null;
  currentRole: UserRole | null;

  // All workspaces user is a member of
  workspaces: Workspace[];
  memberships: WorkspaceMember[];

  // Loading states
  loading: boolean;
  error: string | null;

  // Actions
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setCurrentRole: (role: UserRole | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setMemberships: (memberships: WorkspaceMember[]) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  removeWorkspace: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  currentWorkspace: null,
  currentRole: null,
  workspaces: [],
  memberships: [],
  loading: false,
  error: null,
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      ...initialState,

      setCurrentWorkspace: (workspace) =>
        set({ currentWorkspace: workspace }),

      setCurrentRole: (role) =>
        set({ currentRole: role }),

      setWorkspaces: (workspaces) =>
        set({ workspaces }),

      setMemberships: (memberships) =>
        set({ memberships }),

      addWorkspace: (workspace) =>
        set((state) => ({
          workspaces: [...state.workspaces, workspace],
        })),

      updateWorkspace: (id, updates) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
          currentWorkspace:
            state.currentWorkspace?.id === id
              ? { ...state.currentWorkspace, ...updates }
              : state.currentWorkspace,
        })),

      removeWorkspace: (id) =>
        set((state) => ({
          workspaces: state.workspaces.filter((w) => w.id !== id),
          currentWorkspace:
            state.currentWorkspace?.id === id ? null : state.currentWorkspace,
        })),

      setLoading: (loading) =>
        set({ loading }),

      setError: (error) =>
        set({ error }),

      reset: () => set(initialState),
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        currentWorkspace: state.currentWorkspace,
      }),
    }
  )
);

// Selector hooks for better performance
export const useCurrentWorkspace = () =>
  useWorkspaceStore((state) => state.currentWorkspace);

export const useCurrentRole = () =>
  useWorkspaceStore((state) => state.currentRole);

export const useWorkspaces = () =>
  useWorkspaceStore((state) => state.workspaces);

export const useWorkspaceLoading = () =>
  useWorkspaceStore((state) => state.loading);

// Permission check helpers
export const canEdit = (role: UserRole | null): boolean =>
  role !== null && ['owner', 'admin', 'editor'].includes(role);

export const canAdmin = (role: UserRole | null): boolean =>
  role !== null && ['owner', 'admin'].includes(role);

export const isOwner = (role: UserRole | null): boolean =>
  role === 'owner';
