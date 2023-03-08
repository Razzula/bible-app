import React from 'react';
import { applyMiddleware, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom';
import { Store, setup } from 'sidenotes';
import rootReducer from './reducers';

import './index.scss';

import App from "./App";

const store: Store = createStore(rootReducer, applyMiddleware(thunkMiddleware));
setup(store, { padding: 10 });

ReactDOM.render(
  <Provider store={store}>
    <React.StrictMode>

        <App title="Hello world"/>

    </React.StrictMode>
  </Provider>,
  document.getElementById('root'),
);
