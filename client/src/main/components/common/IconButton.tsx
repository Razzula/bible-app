import React from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';

import '../../styles/common.scss';

type IconButtonProps = {
    iconName: string;
    text?: string;
    handleClick: (event: React.MouseEvent) => void;
}

function IconButton({ iconName, text, handleClick }: IconButtonProps): JSX.Element {

    return (
        <Tooltip>
            <TooltipTrigger>
                <button onClick={handleClick}>
                    <img src={`/bible-app/icons/${iconName}.svg`} alt={text ?? iconName} />
                </button>
            </TooltipTrigger>
            <TooltipContent>{text ?? null}</TooltipContent>
        </Tooltip>
    );
}

export default IconButton;
