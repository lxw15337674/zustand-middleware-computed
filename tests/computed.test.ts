import React from 'react'
import { create, useStore } from 'zustand'
import { renderHook } from '@testing-library/react-hooks'
import computed from '../src/index'

type Store = {
    firstName: string
    lastName: string
    age: number
    incrementAge: () => void
}

type ComputedStore = {
    fullName: string
    nameLen: number
}

const makeStore = (nameLenStub = () => {}, fullNameStub = () => {}) =>
    create(
        computed<Store, ComputedStore>(
            (set, get) => ({
                firstName: 'Zhang',
                lastName: 'San',
                age: 10,
                incrementAge: () => {
                    set((state) => ({ age: state.age + 1 }))
                },
            }),
            {
                nameLen: (state) => {
                    nameLenStub()
                    return state.fullName.length
                },
                fullName: (state) => {
                    fullNameStub()
                    return state.firstName + state.lastName
                },
            }
        )
    )

beforeEach(() => {
    jest.clearAllMocks()
})

describe('basic', () => {
    test('update', () => {
        const store = makeStore()
        store.getState().incrementAge()
        expect(store.getState().age).toEqual(11)
        store.getState().incrementAge()
        store.getState().incrementAge()
        expect(store.getState().age).toEqual(13)
        expect(store.getState().fullName).toEqual('ZhangSan')
        expect(store.getState().nameLen).toEqual(8)
        store.setState({ firstName: 'Li' })
        store.setState({ lastName: 'Si' })
        expect(store.getState().fullName).toEqual('LiSi')
        expect(store.getState().nameLen).toEqual(4)
    })

    test('subscribe', () => {
        const store = makeStore()
        store.subscribe((state, prevState) => {
            expect(state.fullName).toEqual('LiSan')
            expect(state.nameLen).toEqual(5)
            expect(prevState.fullName).toEqual('ZhangSan')
            expect(prevState.nameLen).toEqual(8)
        })
        store.setState({ firstName: 'Li' })
    })

    test('useStore', () => {
        const store = makeStore()
        const { result, rerender } = renderHook(() => {
            const state = useStore(store)
            return state
        })
        result.current.incrementAge()
        rerender()
        expect(result.current.age).toBe(11)
        result.current.incrementAge()
        rerender()
        expect(result.current.age).toBe(12)
    })
})

describe('lazy & memo', () => {
    it('should lazy init until first read value', () => {
        /**
         * computed 在首次被访问时才会首次计算
         */
        const fn = jest.fn()
        const store = makeStore(fn)
        expect(fn).toBeCalledTimes(0)
        const a = store.getState().nameLen
        expect(fn).toBeCalledTimes(1)
    })

    it('should get from memo when state not change', () => {
        /**
         * computed 在被计算后，若依赖未发生变化，不会重新计算
         */
        const fn = jest.fn()
        const store = makeStore(fn)
        expect(fn).toBeCalledTimes(0)
        const a = store.getState().nameLen
        expect(fn).toBeCalledTimes(1)
        // 依赖未发生变化，不会重新计算
        const b = store.getState().nameLen
        expect(fn).toBeCalledTimes(1)
        // 更新不相关的依赖，不会重新计算
        store.setState({ age: 20 })
        const c = store.getState().nameLen
        expect(fn).toBeCalledTimes(1)
        // 更新所依赖的状态
        store.setState({ firstName: 'Li', lastName: 'Si' })
        // 再次访问触发重新计算
        const d = store.getState().nameLen
        expect(fn).toBeCalledTimes(2)
        expect(d).toEqual(4)
    })
})
