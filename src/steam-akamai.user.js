// ==UserScript==
// @name         Steam Store Auto Akamai CDN
// @namespace    https://github.com/mangogan-git/tampermonkey-scripts/raw/master/src/steam-akamai.user.js
// @version      1.0.0
// @description  Add _cdn=akamai and reload the Steam Store while preserving existing parameters and the URL fragment.
// @license      MIT
// @author       mangogan-git
// @website      https://github.com/mangogan-git/tampermonkey-scripts
// @source       https://github.com/mangogan-git/tampermonkey-scripts/raw/master/src/steam-akamai.user.js
// @match        *://store.steampowered.com/*
// @run-at       document-start
// @noframes
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const url = new URL(window.location.href);
    const cdnValues = url.searchParams.getAll('_cdn');

    // Skip the redirect when Akamai is already selected to prevent reload loops.
    if (cdnValues.length === 1 && cdnValues[0] === 'akamai') return;

    url.searchParams.set('_cdn', 'akamai');
    window.location.replace(url.href);
})();
