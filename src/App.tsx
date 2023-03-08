import React from 'react';

type Test = {
    title: string
}

export const App = ({ title }: Test) => <aside>
    <p>{ title }</p>
</aside>