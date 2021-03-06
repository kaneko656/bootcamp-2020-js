// ここで全部typeを定義すれば、全て行き渡る
/**
 * Dispatcher
 */
class Dispatcher extends EventTarget {
    dispatch() {
        this.dispatchEvent(new CustomEvent("event"));
    }
    subscribe(subscriber) {
        this.addEventListener("event", subscriber);
    }
}
/**
 * Action Creator and Action Types
 */
const FETCH_TODO_ACTION_TYPE = "Fetch todo list from server";
export const createFetchTodoListAction = () => ({
    type: FETCH_TODO_ACTION_TYPE,
    payload: undefined,
});
const ADD_TODO_ACTION_TYPE = "A todo addition to store";
export const createAddTodoAction = (todo) => ({
    type: ADD_TODO_ACTION_TYPE,
    payload: todo,
});
const REMOVE_TODO_ACTION_TYPE = "remove todo from server";
export const removeTodoAction = (todoId) => ({
    type: REMOVE_TODO_ACTION_TYPE,
    payload: todoId
});
const PATCH_TODO_ACTION_TYPE = "patch todo from server";
export const patchTodoAction = (todo) => ({
    type: PATCH_TODO_ACTION_TYPE,
    payload: todo
});
const CLEAR_ERROR = "Clear error from state";
export const clearError = () => ({
    type: CLEAR_ERROR,
    payload: undefined,
});
const api = "http://localhost:3000/todo";
const defaultState = {
    todoList: [],
    error: undefined,
};
const headers = {
    "Content-Type": "application/json; charset=utf-8",
};
const reducer = async (prevState, action) => {
    switch (action.type) {
        case FETCH_TODO_ACTION_TYPE: {
            try {
                const resp = await fetch(api).then((d) => d.json());
                return { todoList: resp.todoList, error: null };
            }
            catch (err) {
                return { ...prevState, error: err };
            }
        }
        case ADD_TODO_ACTION_TYPE: {
            const body = JSON.stringify(action.payload);
            const config = { method: "POST", body, headers };
            try {
                const resp = await fetch(api, config).then((d) => d.json());
                return { todoList: [...prevState.todoList, resp], error: null };
            }
            catch (err) {
                return { ...prevState, error: err };
            }
        }
        case REMOVE_TODO_ACTION_TYPE: {
            const id = action.payload;
            const url = api + '/' + action.payload;
            try {
                const resp = await fetch(url, { method: 'DELETE' }).then((d) => d.json());
                const index = prevState.todoList.findIndex(todo => todo.id === id);
                if (index === -1)
                    return prevState;
                const nextTodoList = [...prevState.todoList];
                nextTodoList.splice(index, 1);
                return { todoList: nextTodoList, error: null };
            }
            catch (err) {
                return { ...prevState, error: err };
            }
        }
        case PATCH_TODO_ACTION_TYPE: {
            const { id, ...body } = action.payload;
            action.payload.done = !action.payload.done;
            try {
                const resp = await fetch(`${api}/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(action.payload),
                    headers
                }).then((d) => d.json());
                const idx = prevState.todoList.findIndex(todo => todo.id === id);
                if (idx === -1)
                    return prevState;
                const nextTodoList = prevState.todoList.concat();
                nextTodoList[idx] = resp;
                return { todoList: nextTodoList, error: null };
            }
            catch (err) {
                return { ...prevState, error: err };
            }
        }
        case CLEAR_ERROR: {
            return { ...prevState, error: null };
        }
        default: {
            throw new Error("unexpected action type: %o");
        }
    }
};
export function createStore(initialState = defaultState) {
    const dispatcher = new Dispatcher();
    let state = initialState;
    const dispatch = async (action) => {
        console.group(action.type);
        console.log("prev", state);
        state = await reducer(state, action);
        console.log("next", state);
        console.groupEnd();
        dispatcher.dispatch();
    };
    const subscribe = (subscriber) => {
        dispatcher.subscribe(() => subscriber(state));
    };
    return {
        dispatch,
        subscribe,
    };
}
