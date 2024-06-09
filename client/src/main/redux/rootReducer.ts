import { combineReducers } from 'redux';
import { Reducer, SidenotesUIActions, State, reducer } from 'sidenotes';
import { UIState } from 'sidenotes/dist/src/store/ui/types';

import passageUIReducer, { PassageUIState } from './passageUIReducer';

export interface RootState {
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
