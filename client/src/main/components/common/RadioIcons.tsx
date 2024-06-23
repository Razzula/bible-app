import React, { useEffect, useState } from 'react';

import '../../styles/common.scss';
import CheckIcon from './CheckIcon';
import { IconButtonProps } from './IconButton';

type RadioIconsProps = {
    selected: string;
    states: IconButtonProps[];
    handleClick: (id: string) => void;
};

function RadioIcons({ states, selected, handleClick }: RadioIconsProps): JSX.Element {

    function handleButtonClick(id?: string): void {
        if (id) {
            handleClick(id);
        }
    }

    return (
        <span>
            {states.map((state, index) => {
                return <CheckIcon
                    key={index}
                    iconName={state.iconName}
                    text={state.text}
                    handleClick={() => handleButtonClick(state.id)}
                    disabled={state.disabled}
                    stateDriver={selected === state.id}
                />
            })}
        </span>
    );
}

export default RadioIcons;
