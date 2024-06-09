import { ACTIVATE_EDITOR, DEACTIVATE_EDITOR, ACTIVATE_TOKEN, DEACTIVATE_TOKEN } from './actions';

export interface PassageUIState {
    activeRef: any;
    activeEditor: any;
    activeToken: string | null;
}

const initialState: PassageUIState = {
    activeRef: null,
    activeEditor: null,
    activeToken: null
};

const passageUIReducer = (state = initialState, action: any): PassageUIState => {

    switch (action.type) {

        case ACTIVATE_EDITOR:
            return {
                ...state,
                activeRef: action.payload.ref,
                activeEditor: action.payload.editor
            };
        case DEACTIVATE_EDITOR:
            return {
                ...state,
                activeRef: null,
                activeEditor: null
            };

        case ACTIVATE_TOKEN:
            return {
                ...state,
                activeToken: action.payload.token
            };
        case DEACTIVATE_TOKEN:
            return {
                ...state,
                activeToken: null
            };

        default:
            return state;
    }
};

export default passageUIReducer;
