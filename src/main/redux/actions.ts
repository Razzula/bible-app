// actionTypes
export const ACTIVATE_PASSAGE = 'ACTIVATE_PASSAGE';
export const DEACTIVATE_PASSAGE = 'DEACTIVATE_PASSAGE';

// actionCreators
export const activatePassage = (ref: any, editor: any) => ({
    type: ACTIVATE_PASSAGE,
    payload: { ref, editor }
});

export const deactivatePassage = () => ({
    type: DEACTIVATE_PASSAGE
});