import { memoize } from 'proxy-memoize'
import { StateCreator } from 'zustand'

export type Computed<S extends Record<string, any>, C extends Record<string, any>> = {
    [K in keyof C as K extends keyof S ? never : K]: (state: S & C) => C[K]
}

function shallowClone<T extends Record<string, any>>(obj: T): T {
    return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj))
}

export const computed = <T extends object, A extends object>(
    f: StateCreator<T>,
    compute: Computed<T, A>
): StateCreator<T & A, [], []> => {
    return (set, get, api) => {
        const computedState = Object.entries(compute).reduce((acc, [key, value]) => {
            const memoizeComputeFn = memoize(value as (state: T) => A[keyof A])
            Object.defineProperty(acc, key, {
                get() {
                    return memoizeComputeFn(this)
                },
            })
            return acc
        }, {} as T & A)
        const withComputed = (state: T) => Object.assign(shallowClone(computedState), state)
        let lastState: T & A
        let isChanged = true
        api.getState = () => {
            if (!isChanged) {
                return lastState
            }
            lastState = withComputed(get())
            isChanged = false
            return lastState
        }
        api.setState = (state, replace) => {
            isChanged = true
            set(state, replace)
        }
        const { subscribe } = api
        api.subscribe = (listener) => {
            return subscribe((state, prevState) => {
                listener(
                    withComputed(state),
                    // TODO 可以缓存 prevState
                    withComputed(prevState)
                )
            })
        }
        // 由于需要覆盖 set， 在 middleware pipeline 中，该 middleware 需要放在最后，确保 set 被正确覆盖
        const st = f(api.setState, get, api)
        return st as T & A
    }
}

export default computed
