// actionTypes
export const ACTIVATE_EDITOR = 'ACTIVATE_EDITOR';
export const DEACTIVATE_EDITOR = 'DEACTIVATE_EDITOR';

export const ACTIVATE_TOKEN = 'ACTIVATE_TOKEN';
export const DEACTIVATE_TOKEN = 'DEACTIVATE_TOKEN';

// actionCreators
export const setActiveEditor = (ref: any, editor: any) => ({
    type: ACTIVATE_EDITOR,
    payload: { ref, editor }
});

export const setNoActiveEditor = () => ({
    type: DEACTIVATE_EDITOR
});

export const setActiveToken = (token: string) => ({
    type: ACTIVATE_TOKEN,
    payload: { token }
});

export const setNoActiveToken = () => ({
    type: DEACTIVATE_TOKEN
});