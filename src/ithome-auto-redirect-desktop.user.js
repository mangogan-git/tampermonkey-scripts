// ==UserScript==
// @name         IThome Auto Redirect Desktop
// @description  Auto redirect ithome from mobile site to desktop site, for annoying google search mobile first indexing
// @version      0.4
// @license      MIT
// @author       mangogan-git
// @website     https://github.com/mangogan-git/tampermonkey-scripts
// @source       https://github.com/mangogan-git/tampermonkey-scripts/raw/master/src/ithome-auto-redirect-desktop.user.js
// @namespace    https://github.com/mangogan-git/tampermonkey-scripts/raw/master/src/ithome-auto-redirect-desktop.user.js
// @match        https://ithelp.ithome.com.tw/m/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ithome.com.tw
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const oldHref = location.href;
    const newHref = oldHref.replace('/m/', '/');
    location.href = newHref;
})();
