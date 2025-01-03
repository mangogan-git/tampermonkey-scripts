// ==UserScript==
// @name         Redirect Medium to FreeMedium
// @description  Redirect medium.com to freedium.cfd so you can read without login
// @version      0.4
// @license      MIT
// @website      https://github.com/mangogan-git/tampermonkey-scripts
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

    let ensureModalTimeout;

    function createModal() {
        // Create modal elements
        const modal = document.createElement('div');
        modal.id = 'modal-freedium';
        const freeButton = document.createElement('button');
        const closeButton = document.createElement('button');

        // Style the modal
        modal.style.position = 'fixed';
        modal.style.top = '20%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -20%)';
        modal.style.padding = '20px';
        modal.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        modal.style.border = '2px solid black';
        modal.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        modal.style.zIndex = '1000';

        // Style the buttons
        freeButton.textContent = 'GO Freedium';
        freeButton.style.marginRight = '10px';
        freeButton.style.padding = '10px';
        freeButton.style.backgroundColor = '#4CAF50';
        freeButton.style.color = 'white';
        freeButton.style.border = 'none';
        freeButton.style.cursor = 'pointer';

        closeButton.textContent = 'X';
        closeButton.style.padding = '10px';
        closeButton.style.backgroundColor = '#f44336';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.cursor = 'pointer';

        // Append buttons to modal
        modal.appendChild(freeButton);
        modal.appendChild(closeButton);
        document.body.appendChild(modal);

        // Add event listeners
        freeButton.addEventListener('click', () => {
            const newHref = 'https://freedium.cfd/medium.com' + document.location.pathname + document.location.search;
            document.location.href = newHref;
        });

        closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
            clearTimeout(ensureModalTimeout);
        });
    }

    function ensureModal() {
        ensureModalTimeout = setTimeout(() => {
            if (!document.querySelector('#modal-freedium')) {
                createModal();
            }
        }, 3000);
    }

    window.addEventListener('load', createModal);
    ensureModal();
})();
