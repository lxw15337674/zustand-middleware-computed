`zustand-middleware-computed`: A Zustand middleware for adding computed state

## Features 

-   Computed state will only be recalculated when the properties they depend on are updated.
-   Computed state support referencing other computed state (in accordance with some rule).

## Usage 

```bash
yarn add zustand-middleware-computed
```

## Example

```typescript
import create from 'zustand'
import computed  from 'zustand-middleware-computed'

interface ComputedState {
  threeBears: number;
  threeCats: number;
  animalsCount:number;
}
const useBearStore = create(
  computed<Store, ComputedState>((
    (set) => ({
      bears: 0,
      cats: 0,
      addOneBear: () => set(state => ({ bears: state.bears + 1 })),
      addOneCat: () => set(state => ({ cats: state.cats + 1 })),
    })),
    {
      threeBears: (state) => {
        console.log('threeBears recomputed');
        return state.bears * 3 + 1
      },
      threeCats: (state) => {
        console.log('threeCats recomputed');
        return state.cats * 3
      },
    }
  ));
```

## License 

[MIT](./LICENSE)

