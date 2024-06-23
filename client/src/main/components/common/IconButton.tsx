import React from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';

import '../../styles/common.scss';

type IconButtonProps = {
    iconName: string;
    text?: string;
    handleClick: (event: React.MouseEvent) => void;
    disabled?: boolean;
}

function IconButton({ iconName, text, handleClick, disabled=false }: IconButtonProps): JSX.Element {

    return (
        <Tooltip>
            <TooltipTrigger>
                <button onClick={handleClick} disabled={disabled}>
                    <img src={`/bible-app/icons/${iconName}.svg`} alt={text ?? iconName} />
                </button>
            </TooltipTrigger>
            <TooltipContent>{text ?? null}</TooltipContent>
        </Tooltip>
    );
}

export default IconButton;
