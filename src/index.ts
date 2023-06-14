import { memoize } from 'proxy-memoize';
import { StateCreator } from 'zustand';

type ComputeObj<T, A> = Record<keyof A, (state: T & A) => A[keyof A]>;

const computed = <T extends object, A extends object>(
  f: StateCreator<T, [], []>,
  compute: ComputeObj<T, A>,
): StateCreator<T & A, [], [], T & A> => {
  return (set, get, api) => {
    type T = ReturnType<typeof f>;
    type A = { [K in keyof T]: ReturnType<ComputeObj<T, A>[K]> };
    const newComputed = Object.entries(compute).map(([key, value]) => {
      return [key, memoize(value as (state: T) => A[keyof A])] as [
        keyof A,
        (state: T) => A[keyof A],
      ];
    });
    const cachedSelector = {} as A;
    const computeAndMerge = (state: T): T & A => {
      const newState = { ...state };
      newComputed.forEach(([key, value]) => {
        const computedValue = value({ ...state, ...cachedSelector });
        cachedSelector[key] = computedValue;
      });
      return { ...newState, ...cachedSelector };
    };
    const setWithComputed = (
      update: T | ((state: T) => T),
      replace?: boolean,
    ) => {
      set((state: T): T & A => {
        const updated = typeof update === 'function' ? update(state) : update;
        return computeAndMerge({
          ...state,
          ...updated,
        });
      }, replace);
    };
    api.setState = setWithComputed;
    const st = f(setWithComputed, get, api);
    return computeAndMerge(st) as any;
  };
};

export default computed;
