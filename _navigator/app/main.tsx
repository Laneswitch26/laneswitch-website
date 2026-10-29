import React from 'react';
import {createRoot} from 'react-dom/client';
import Navigator from './navigator/Navigator';
import Admin from './navigator/Admin';
import Register from './navigator/Register';
import './navigator/navigator.css';
const route=location.pathname.replace(/\/$/,'').split('/').pop();
createRoot(document.getElementById('root')!).render(route==='demo'?<Navigator demo/>:route==='admin'?<Admin/>:route==='registrierung'?<Register/>:<Navigator publicSchool={route==='zugang'?undefined:route}/>);
