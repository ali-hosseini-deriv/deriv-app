"use strict";(self.webpackChunk=self.webpackChunk||[]).push([[2871],{39692:(e,t,r)=>{r.r(t),r.d(t,{default:()=>p});var n=r(32735),a=r(90258),i=r(75672),o=r(65597),l=r(20374),s=r(17502);function u(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){var r=null==e?null:"undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(null==r)return;var n,a,i=[],o=!0,l=!1;try{for(r=r.call(e);!(o=(n=r.next()).done)&&(i.push(n.value),!t||i.length!==t);o=!0);}catch(e){l=!0,a=e}finally{try{o||null==r.return||r.return()}finally{if(l)throw a}}return i}(e,t)||function(e,t){if(!e)return;if("string"==typeof e)return c(e,t);var r=Object.prototype.toString.call(e).slice(8,-1);"Object"===r&&e.constructor&&(r=e.constructor.name);if("Map"===r||"Set"===r)return Array.from(e);if("Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))return c(e,t)}(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function c(e,t){(null==t||t>e.length)&&(t=e.length);for(var r=0,n=new Array(t);r<t;r++)n[r]=e[r];return n}var d=function(e){switch(e.header){case"password_changed":return n.createElement(o.Text,{as:"p",weight:"bold",className:"reset-password__heading"},n.createElement(l.Localize,{i18n_default_text:"Your password has been changed"}));default:return""}};const p=(0,i.$j)((function(e){var t=e.client,r=e.ui;return{disableApp:r.disableApp,enableApp:r.enableApp,is_loading:r.is_loading,is_logged_in:t.is_logged_in,logout:t.logout}}))((function(e){var t=e.is_logged_in,r=e.logout,i=e.disableApp,c=e.enableApp,p=e.is_loading,f=u(n.useState(!1),2),g=f[0],h=f[1],b=new URLSearchParams((0,a.useLocation)().search).get("header"),_=function(){h(!0),"true"!==window.localStorage.getItem("is_redirecting")&&(0,s.redirectToLogin)(!1,(0,l.getLanguage)(),!1,3e3)};return n.useEffect((function(){t?r().then((function(){return _()})):_()}),[t,r]),n.createElement(o.Dialog,{is_visible:g,disableApp:i,enableApp:c,is_loading:p},n.createElement("div",{className:"reset-password__password-selection"},n.createElement(d,{header:b}),n.createElement(o.Text,{align:"center",as:"p",size:"xxs",className:"reset-password__subtext"},n.createElement(l.Localize,{i18n_default_text:"We will now redirect you to the login page."}))))}))}}]);