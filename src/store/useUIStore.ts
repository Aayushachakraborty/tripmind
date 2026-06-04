import { create } from "zustand";
import type { RealtimeSignal } from "../lib/schemas";

type UIState = {
  activeScreen: "Plan" | "Trips" | "Alerts";
  alerts: RealtimeSignal[];
  notifications: string[];
  setActiveScreen: (activeScreen: UIState["activeScreen"]) => void;
  setAlerts: (alerts: RealtimeSignal[]) => void;
  pushNotification: (message: string) => void;
  clearNotification: (message: string) => void;
};

export const useUIStore = create<UIState>((set) => ({
  activeScreen: "Plan",
  alerts: [],
  notifications: [],
  setActiveScreen: (activeScreen) => set({ activeScreen }),
  setAlerts: (alerts) => set({ alerts }),
  pushNotification: (message) => set((state) => ({ notifications: [...state.notifications, message] })),
  clearNotification: (message) => set((state) => ({ notifications: state.notifications.filter((item) => item !== message) }))
}));
