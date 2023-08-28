import { memoize } from 'proxy-memoize';
import { StateCreator } from 'zustand';

type ComputeObj<T, A> = {
  [K in keyof A]: (state: T & A) => A[K];
};

function shallowClone<T extends Record<string, any>>(obj: T): T {
  return Object.create(
    Object.getPrototypeOf(obj),
    Object.getOwnPropertyDescriptors(obj),
  );
}

const computed = <T extends object, A extends object>(
  f: StateCreator<T>,
  compute: ComputeObj<T, A>,
): StateCreator<T & A, [], []> => {
  return (set, get, api) => {
    const computedState = Object.entries(compute).reduce(
      (acc, [key, value]) => {
        const memoizeComputeFn = memoize(value as (state: T) => A[keyof A]);
        Object.defineProperty(acc, key, {
          get() {
            return memoizeComputeFn(this);
          },
        });
        return acc;
      },
      {} as T & A,
    );

    let lastState: T & A;
    let isChanged = true;
    api.getState = () => {
      if (!isChanged) {
        return lastState;
      }
      lastState = Object.assign(shallowClone(computedState), get());
      isChanged = false;
      return lastState;
    };
    api.setState = (state, replace) => {
      set(state, replace);
      isChanged = true;
    };
    const st = f(api.setState, get, api);
    return st as T & A;
  };
};


export default computed
