import { create } from "zustand";

type ChildrenState = {
  childComponentRefs: React.RefObject<any>[] | [];
  setRef: (ref: React.RefObject<any>) => void;
};

const useChildrenStore = create<ChildrenState>((set) => ({
  childComponentRefs: [],
  setRef: (childComponentRef) =>
    set((state) => ({
      childComponentRefs: Array.isArray(state.childComponentRefs)
        ? [...state.childComponentRefs, childComponentRef]
        : [childComponentRef],
    })),
}));
export default useChildrenStore;
