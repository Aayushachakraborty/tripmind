import { create } from "zustand";

type AuthUser = {
  id: string;
  email?: string;
};

type AuthState = {
  session: unknown | null;
  user: AuthUser | null;
  loading: boolean;
  setSession: (session: unknown | null, user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: false,
  setSession: (session, user) => set({ session, user }),
  setLoading: (loading) => set({ loading })
}));
