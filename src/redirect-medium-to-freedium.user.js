// ==UserScript==
// @name         Redirect Medium to FreeMedium
// @description  Redirect medium.com to freedium.cfd so you can read without login
// @version      0.2
// @license      MIT
// @website      https://github.com/mangogan-git/tempermonkey-scripts
// @source       https://github.com/mangogan-git/tampermonkey-scripts/raw/master/src/redirect-medium-to-freedium.user.js
// @namespace    https://github.com/mangogan-git/tampermonkey-scripts/raw/master/src/redirect-medium-to-freedium.user.js
// @match        https://medium.com/*
// @match        https://*.medium.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=medium.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const oldHref = location.href;
    // handle "Go to the original"
    if (oldHref.endsWith('#bypass')) return;

    const newHref = 'https://freedium.cfd/medium.com' + location.pathname + location.search;
    location.href = newHref;
})();
