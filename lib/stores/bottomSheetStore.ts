// lib/stores/bottomSheetStore.ts
import { create } from 'zustand';

interface BottomSheetState {
  open: (options?: any) => void;
  close: () => void;
}

export const useBottomSheetStore = create<BottomSheetState>((set) => ({
  open: () => {},
  close: () => {},
}));
