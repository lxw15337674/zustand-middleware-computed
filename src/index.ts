import { memoize } from 'proxy-memoize'
import { StateCreator } from 'zustand'

type ComputeObj<T, A> = Record<keyof A, (state: T & A) => A[keyof A]>
type Computed<T, A> = { [K in keyof A]: ReturnType<ComputeObj<T, A>[K]> }

const computed = <T extends object, A extends object>(
    f: StateCreator<T, [], []>,
    compute: ComputeObj<T, A>
): StateCreator<T & Computed<T, A>, [], []> => {
    return (set, get, api) => {
        type Store = ReturnType<typeof f>
        const computedList = Object.entries(compute).map(([key, value]) => {
            return [key, memoize(value as (state: T) => A[keyof A])] as [keyof A, (state: T) => A[keyof A]]
        })
        const computeAndMerge = (state: T) => {
            return computedList.reduce(
                (acc, [key, value]) => ({
                    ...acc,
                    [key]: value({ ...state, ...acc }),
                }),
                { ...state }
            ) as Store & Computed<T, A>
        }
        const setWithComputed = (update: T | ((state: T) => T), replace?: boolean) => {
            set((state: T) => {
                const updated = typeof update === 'function' ? update(state) : update
                return computeAndMerge({
                    ...state,
                    ...updated,
                })
            }, replace)
        }
        api.setState = setWithComputed
        const st = f(setWithComputed, get, api)
        return computeAndMerge(st)
    }
}

export default computed
