import React from 'react';
import { applyMiddleware, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { Provider } from 'react-redux';
import { createRoot } from 'react-dom/client';
import { Store, setup } from 'sidenotes';
import rootReducer from './utils/reducers';


import 'bootstrap/dist/css/bootstrap.min.css';
import './index.scss';

import App from "./components/App";

const store: Store = createStore(rootReducer, applyMiddleware(thunkMiddleware));
setup(store, { padding: 10 });

const container = document.getElementById('root');
const root = createRoot(container!); // createRoot(container!) if you use TypeScript
root.render(
  <Provider store={store}>
    <React.StrictMode>

      <App />

    </React.StrictMode>
  </Provider>
);
