import { Reducer, Store } from "redux";
import { ActionsObservable, Epic, StateObservable } from "redux-observable";
import { Observable, Subject } from "rxjs";
import { AnyAction, BatchDispatch, createBatchDispatch } from "./action";
import { NYAX_NOTHING } from "./common";
import { ContainerImpl, createGetContainer } from "./container";
import { LazyModel, Model } from "./model";
import { createRootReducer } from "./reducer";
import { createGetState, GetState } from "./state";
import { Nyax, NyaxOptions } from "./store";

export interface NyaxContext {
  nyax: Nyax;

  store: Store;
  options: NyaxOptions;

  rootAction$: ActionsObservable<AnyAction>;
  rootState$: StateObservable<unknown>;

  getContainer: <TModel extends Model>(
    modelOrModelNamespace: TModel | LazyModel<TModel> | string,
    containerKey?: string
  ) => ContainerImpl<TModel>;
  getState: GetState;
  batchDispatch: BatchDispatch;

  rootReducer: Reducer;

  addEpic$: Subject<Epic>;
  switchEpic$: Subject<void>;

  cachedRootState: unknown | typeof NYAX_NOTHING;

  modelContextByModel: Map<Model, ModelContext>;
  modelContextByModelNamespace: Map<string, ModelContext>;

  containerByNamespace: Map<string, ContainerImpl>;
  dispatchDeferredByAction: Map<
    AnyAction,
    {
      resolve(value: unknown): void;
      reject(error: unknown): void;
    }
  >;

  batchCommitTime: number | null;
  batchCommitTimeoutId: number | null;
  batchCommitActions: AnyAction[];
  batchCommitCallbacks: (() => void)[];
  batchCollectedActions: AnyAction[] | null;

  dependencies: unknown;
  onUnhandledEffectError: (
    error: unknown,
    promise: Promise<unknown> | undefined
  ) => void;
  onUnhandledEpicError: (
    error: unknown,
    caught: Observable<AnyAction>
  ) => Observable<AnyAction>;

  getRootState: () => unknown;
}

export interface ModelContext {
  model: Model;
  modelNamespace: string;
  modelPath: string;

  containerByContainerKey: Map<string | undefined, ContainerImpl>;
  stopEpicEmitterByContainerKey: Map<string | undefined, () => void>;
}

export function createNyaxContext(): NyaxContext {
  const nyaxContext: NyaxContext = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    nyax: undefined!,

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    store: undefined!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    options: undefined!,

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    rootAction$: undefined!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    rootState$: undefined!,

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    getContainer: undefined!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    getState: undefined!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    batchDispatch: undefined!,

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    rootReducer: undefined!,

    addEpic$: new Subject(),
    switchEpic$: new Subject(),

    cachedRootState: NYAX_NOTHING,

    modelContextByModel: new Map(),
    modelContextByModelNamespace: new Map(),

    containerByNamespace: new Map(),
    dispatchDeferredByAction: new Map(),

    batchCommitTime: null,
    batchCommitTimeoutId: null,
    batchCommitActions: [],
    batchCommitCallbacks: [],
    batchCollectedActions: null,

    get dependencies() {
      return nyaxContext.options.dependencies;
    },
    onUnhandledEffectError: (error, promise) => {
      if (nyaxContext.options.onUnhandledEffectError) {
        return nyaxContext.options.onUnhandledEffectError(error, promise);
      } else {
        if (promise) {
          promise.then(undefined, () => {
            // noop
          });
        }
        console.error(error);
      }
    },
    onUnhandledEpicError: (error, caught) => {
      if (nyaxContext.options.onUnhandledEpicError) {
        return nyaxContext.options.onUnhandledEpicError(error, caught);
      } else {
        console.error(error);
        return caught;
      }
    },

    getRootState: () =>
      nyaxContext.cachedRootState !== NYAX_NOTHING
        ? nyaxContext.cachedRootState
        : nyaxContext.store.getState(),
  };

  nyaxContext.getContainer = createGetContainer(
    nyaxContext
  ) as NyaxContext["getContainer"];
  nyaxContext.getState = createGetState(nyaxContext);
  nyaxContext.batchDispatch = createBatchDispatch(nyaxContext);

  nyaxContext.rootReducer = createRootReducer(nyaxContext);

  return nyaxContext;
}
