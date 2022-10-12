import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import reportWebVitals from './reportWebVitals';

const root = document.getElementById('root');
const container = document.createElement('div');
container.id = 'amazon-chime-sdk-widget-container';
document.body.appendChild(container);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  root,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
