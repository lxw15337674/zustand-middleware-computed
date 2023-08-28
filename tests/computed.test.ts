import computed from '../src';
import { create } from 'zustand';

type Store = {
  firstName: string;
  lastName: string;
  age: number;
};

type ComputedStore = {
  fullName: string;
  nameLen: number;
};

describe('default config', () => {
  const makeStore = () =>
    create(
      computed<Store, ComputedStore>(
        () => ({
          firstName: 'Zhang',
          lastName: 'San',
          age: 10,
        }),
        {
          nameLen: (state) => {
            return state.fullName.length;
          },
          fullName: (state) => {
            return state.firstName + state.lastName;
          },
        },
      ),
    );
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('update state', () => {
    const useStore = makeStore();
    expect(useStore.getState().fullName).toEqual('ZhangSan');
    expect(useStore.getState().nameLen).toEqual(8);
    useStore.setState({ firstName: 'Li' });
    useStore.setState({ lastName: 'Si' });
    expect(useStore.getState().fullName).toEqual('LiSi');
    expect(useStore.getState().nameLen).toEqual(4);
  });

  test('subscribe', () => {
    const useStore = makeStore();
    useStore.subscribe(() => {
      expect(useStore.getState().fullName).toEqual('LiSan');
      expect(useStore.getState().nameLen).toEqual(5);
    });
    useStore.setState({ firstName: 'Li' });
  });
});

describe('lazy & memo', () => {
  it('should be lazy', () => {
    /**
     * computed 在首次被访问时才会首次计算
     */
    const fn = jest.fn();
    const useStore = create(
      computed<{ count: number }, { double: number }>(
        () => ({
          count: 0,
        }),
        {
          double: (state) => {
            fn();
            return state.count * 2;
          },
        },
      ),
    );
    expect(fn).toBeCalledTimes(0);
    const a = useStore.getState().double;
    expect(fn).toBeCalledTimes(1);
  });

  it('should be memo', () => {
    /**
     * computed 在被计算后，若依赖未发生变化，不会重新计算
     */
    const fn = jest.fn();
    const useStore = create(
      computed<{ count: number }, { double: number }>(
        () => ({
          count: 0,
        }),
        {
          double: (state) => {
            fn();
            return state.count * 2;
          },
        },
      ),
    );
    expect(fn).toBeCalledTimes(0);
    const a = useStore.getState().double;
    expect(fn).toBeCalledTimes(1);
    // 依赖未发生变化，不会重新计算
    const b = useStore.getState().double;
    expect(fn).toBeCalledTimes(1);
    // 更新依赖
    useStore.setState({ count: 1 });
    // 再次访问触发重新计算
    const c = useStore.getState().double;
    expect(fn).toBeCalledTimes(2);
    expect(c).toEqual(2);
  });
});
