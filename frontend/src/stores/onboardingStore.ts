import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Occupation, OccupationSkill } from '@/types';

interface SkillRating {
  skillId: string;
  skillName: string;
  proficiency: 1 | 2 | 3;
}

interface OnboardingState {
  // Current step
  step: number;

  // Role selection
  currentOccupation: Occupation | null;
  targetOccupation: Occupation | null;

  // Skills from target occupation
  availableSkills: OccupationSkill[];

  // User's skill ratings
  skillRatings: SkillRating[];

  // Optional info
  industry: string;

  // Actions
  setStep: (step: number) => void;
  setCurrentOccupation: (occupation: Occupation | null) => void;
  setTargetOccupation: (occupation: Occupation | null) => void;
  setAvailableSkills: (skills: OccupationSkill[]) => void;
  setSkillRating: (skillId: string, skillName: string, proficiency: 1 | 2 | 3) => void;
  removeSkillRating: (skillId: string) => void;
  setIndustry: (industry: string) => void;
  reset: () => void;
  getProgress: () => { rated: number; total: number };
}

const initialState = {
  step: 1,
  currentOccupation: null,
  targetOccupation: null,
  availableSkills: [],
  skillRatings: [],
  industry: '',
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ step }),

      setCurrentOccupation: (occupation) => set({ currentOccupation: occupation }),

      setTargetOccupation: (occupation) => set({ targetOccupation: occupation }),

      setAvailableSkills: (skills) => set({ availableSkills: skills }),

      setSkillRating: (skillId, skillName, proficiency) => {
        const { skillRatings } = get();
        const existing = skillRatings.findIndex((r) => r.skillId === skillId);

        if (existing >= 0) {
          const updated = [...skillRatings];
          updated[existing] = { skillId, skillName, proficiency };
          set({ skillRatings: updated });
        } else {
          set({ skillRatings: [...skillRatings, { skillId, skillName, proficiency }] });
        }
      },

      removeSkillRating: (skillId) => {
        const { skillRatings } = get();
        set({ skillRatings: skillRatings.filter((r) => r.skillId !== skillId) });
      },

      setIndustry: (industry) => set({ industry }),

      reset: () => set(initialState),

      getProgress: () => {
        const { availableSkills, skillRatings } = get();
        return {
          rated: skillRatings.length,
          total: availableSkills.length,
        };
      },
    }),
    {
      name: 'cubicleally-onboarding',
    }
  )
);
