import { create } from 'zustand';

type PlannerState = {
  selectedSprint: string;
  requiredDoctors: number;
  setSelectedSprint: (value: string) => void;
  setRequiredDoctors: (value: number) => void;
};

export const usePlannerStore = create<PlannerState>((set) => ({
  selectedSprint: 'Sprint 1',
  requiredDoctors: 1,
  setSelectedSprint: (value) => set({ selectedSprint: value }),
  setRequiredDoctors: (value) => set({ requiredDoctors: Math.max(1, value) }),
}));
