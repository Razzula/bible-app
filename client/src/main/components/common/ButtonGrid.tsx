import React from 'react';

import '../../styles/common.scss';

interface ButtonGridProps {
    gridData: any[];
    handleClick: (event: React.MouseEvent, data?: string) => void;
    disabled?: boolean;
}

function ButtonGrid({ gridData, handleClick, disabled=false }: ButtonGridProps): JSX.Element {

    return (
        <div className='button-grid'>
            {gridData.map((data, index) => {
                return (
                    <span key={index} className='butn'>
                        <button onClick={(event) => handleClick(event, data)} disabled={disabled}>
                            {data?.title ?? data}
                        </button>
                    </span>
                );
            })}
        </div>
    );
};

export default ButtonGrid;