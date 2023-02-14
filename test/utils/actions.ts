// TODO this should be provided by contract-test-helper

interface Action<T> {
    apply(state: T): T;
}

export function applyActions<T>(actions: Action<T>[], init: T): T {
    return actions.reduce((state, action) => action.apply(state), init);
}

export function applyActionThatMightFail<T>(action: Action<T>, state: T): T {
    try {
        return action.apply(state);
    } catch {
        return state;
    }
}
