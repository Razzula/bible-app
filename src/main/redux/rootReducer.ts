import { combineReducers } from 'redux';
import { State, SidenotesUIActions, Reducer, reducer } from 'sidenotes';
import passageUIReducer, { PassageUIState } from './passageUIReducer';
import { UIState } from 'sidenotes/dist/src/store/ui/types';

export interface RootSate {
    sidenotes: UIState;
    passage: PassageUIState;
}

const combinedReducers: Reducer = combineReducers({
    sidenotes: reducer,
    passage: passageUIReducer,
}) as Reducer;

function rootReducer(state: State | undefined, action: SidenotesUIActions): State {
    return combinedReducers(state, action);
}

export default rootReducer;
