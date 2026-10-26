import React from 'react';
import {createRoot} from 'react-dom/client';
import Navigator from './navigator/Navigator';
import './navigator/navigator.css';
const route=location.pathname.replace(/\/$/,'').split('/').pop();
createRoot(document.getElementById('root')!).render(<Navigator publicSchool={route==='zugang'?undefined:route}/>);
