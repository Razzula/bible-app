import { ACTIVATE_PASSAGE, DEACTIVATE_PASSAGE } from './actions';

export interface PassageUIState {
    activateRef: any;
    activeEditor: any;
}

const initialState: PassageUIState = {
    activateRef: null,
    activeEditor: null
};

const passageUIReducer = (state = initialState, action: any): PassageUIState => {
    switch (action.type) {
        case ACTIVATE_PASSAGE:
            return {
                ...state,
                activateRef: action.payload.ref,
                activeEditor: action.payload.editor
            };
        case DEACTIVATE_PASSAGE:
            return {
                ...state,
                activateRef: null,
                activeEditor: null
            };
        default:
            return state;
    }
};

export default passageUIReducer;
