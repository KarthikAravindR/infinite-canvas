import { create } from "zustand";

type ChildrenState = {
  childComponentRef: React.RefObject<any> | null;
  setRef: (ref: React.RefObject<any>) => void;
};

const useChildrenStore = create<ChildrenState>((set) => ({
  childComponentRef: null,
  setRef: (childComponentRef) => set({ childComponentRef }),
}));

export default useChildrenStore;
