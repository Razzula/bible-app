import React, { useEffect, useState } from 'react';

import '../../styles/common.scss';
import IconButton, { IconButtonProps } from './IconButton';

export type CheckIconProps = {
    stateDriver: boolean;
    handleClick?: (event: React.MouseEvent, param: any) => void;
} & IconButtonProps;

function CheckIcon({ stateDriver, iconName, text, handleClick, disabled=false }: CheckIconProps): JSX.Element {

    return (
        <span className='butn-supplant' style={{
            display: 'inline-block',
            height: '100%',
            backgroundColor: stateDriver ? '#00ff0055' : '#ff000055',
        }}>
            <IconButton
                iconName={iconName}
                text={text}
                handleClick={(event) => {
                    if (handleClick) {
                        handleClick(event, !stateDriver);
                    }
                }}
                disabled={disabled}
            />
        </span>
    );
}

export default CheckIcon;
