import React from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';

import '../../styles/common.scss';

export type IconButtonProps = {
    iconName: string;
    text?: string;
    handleClick?: (event: React.MouseEvent) => void;
    disabled?: boolean;
    id?: string;
}

function IconButton({ iconName, text, handleClick, disabled=false }: IconButtonProps): JSX.Element {

    return (
        <Tooltip>
            <TooltipTrigger>
                <span className='butn'>
                    <button onClick={handleClick} disabled={disabled}>
                        <img src={`/bible-app/icons/${iconName}.svg`} alt={text ?? iconName} />
                    </button>
                </span>
            </TooltipTrigger>
            <TooltipContent>{text ?? null}</TooltipContent>
        </Tooltip>
    );
}

export default IconButton;
