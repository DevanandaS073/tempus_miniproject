import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useSettingsStore = create()(
  persist(
    (set) => ({
      aiProvider: "openai",
      apiKey: "",
      setAiProvider: (provider) => set({ aiProvider: provider }),
      setApiKey: (key) => set({ apiKey: key }),
    }),
    {
      name: "certigen-settings", // key in localStorage
    },
  ),
);
