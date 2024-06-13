import { create } from "zustand";

type ChildrenState = {
  ref: React.RefObject<any> | null;
  setRef: (ref: React.RefObject<any>) => void;
};

const useChildrenStore = create<ChildrenState>((set) => ({
  ref: null,
  setRef: (ref) => set({ ref }),
}));

export default useChildrenStore;
