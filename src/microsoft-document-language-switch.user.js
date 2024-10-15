// ==UserScript==
// @name         MS DOC LANGUAGE-CHANGE
// @description  Add keyBinding "keyT" to switch language between browser language and "en-us"
// @version      0.2
// @license      MIT
// @author       mangogan-git
// @website     https://github.com/mangogan-git/tempermonkey-scripts
// @source       https://github.com/mangogan-git/tampermonkey-scripts/raw/master/src/microsoft-document-language-switch.user.js
// @namespace    https://github.com/mangogan-git/tampermonkey-scripts/raw/master/src/microsoft-document-language-switch.user.js
// @match        https://docs.microsoft.com/*
// @match        https://learn.microsoft.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=microsoft.com
// @grant        none
// @run-at       document-ready
// ==/UserScript==

(function () {
    'use strict';

    const defaultLang = 'en-us';

    function toggleLanguage() {
        // get browser language
        const mainLang = (navigator.language || navigator.userLanguage).toLowerCase();

        // get current page language
        // 'https://host/en-us/...' => 'en-us'
        const currentLang = window.location.href.split('/')[3]

        const targetLang = currentLang === mainLang ? defaultLang : mainLang;
        window.location.href = window.location.href.replace(currentLang, targetLang);
    }

    // keyboard "T" listener
    document.addEventListener('keyup', function (e) {
        if (e.code === 'KeyT') {
            toggleLanguage();
        }
    });
})();
