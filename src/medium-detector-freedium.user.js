// ==UserScript==
// @name         Medium Detector - Freedium Redirect
// @description  Detect Medium articles and show dialog to redirect to Freedium
// @version      1.2
// @license      MIT
// @author       mangogan-git
// @website      https://github.com/mangogan-git/tampermonkey-scripts
// @source       https://github.com/mangogan-git/tampermonkey-scripts/raw/master/src/medium-detector-freedium.user.js
// @namespace    https://github.com/mangogan-git/tampermonkey-scripts/raw/master/src/medium-detector-freedium.user.js
// @match        https://*/*
// @exclude      *://localhost*
// @exclude      *://127.0.0.1*
// @exclude      *://*.google.com/*
// @exclude      *://google.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=medium.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let dialog = null;

    function isMediumArticle() {
        // Skip if already on freedium.cfd
        if (window.location.href.includes('freedium.cfd')) {
            return false;
        }
        
        // Skip if URL has #bypass hash, it means user navigation back from Freedium
        if (window.location.hash === '#bypass') {
            return false;
        }
        
        // First check if URL contains medium.com
        const urlContainsMedium = window.location.href.includes('medium.com');
        
        if (urlContainsMedium) {
            return true;
        }
        
        // If URL check fails, check head elements that might contain "Medium" in their content
        const contentCheckSelectors = [
            'meta[property="og:site_name"]',
            'meta[name="twitter:app:name:iphone"]',
            'meta[property="al:ios:app_name"]',
            'meta[property="al:android:app_name"]',
        ];
        
        for (const selector of contentCheckSelectors) {
            const elements = document.head.querySelectorAll(selector);
            for (const element of elements) {
                const content = (element.textContent || element.getAttribute('content') || '');
                if(content === 'Medium'){
                    return true;
                }
            }
        }

        // Check common medium-related elements
        const directMediumSelectors = [
            'link[href*="medium.com" i]',
            'meta[content="com.medium.reader"]',
            'meta[content*="medium.com" i]',
            'meta[content^="medium://" i]',
            'meta[content="Medium"]',
        ];
        
        // Check selectors that directly contain "medium" - if found, it's a match
        for (const selector of directMediumSelectors) {
            if (document.head.querySelector(selector)) {
                return true;
            }
        }

        
        return false;
    }

    function createDialog() {
        // Avoid creating duplicate dialogs
        if (dialog && document.body.contains(dialog)) {
            return;
        }

        function createContainer() {
            const container = document.createElement('div');
            container.id = 'medium-freedium-container';
            container.style.position = 'fixed';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.zIndex = '10000';
            container.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            return container;
        }

        function createMessage() {
            const message = document.createElement('p');
            message.textContent = 'Medium detected. Redirect to Freedium?';
            message.style.marginBottom = '20px';
            message.style.fontSize = '16px';
            return message;
        }

        function createButton(text, backgroundColor, clickHandler) {
            const button = document.createElement('button');
            button.textContent = text;
            button.style.padding = '10px 20px';
            button.style.backgroundColor = backgroundColor;
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.borderRadius = '4px';
            button.style.cursor = 'pointer';
            button.style.fontSize = '14px';
            button.addEventListener('click', clickHandler);
            return button;
        }

        function createButtonContainer() {
            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.justifyContent = 'center';
            buttonContainer.style.gap = '10px';
            
            const confirmButton = createButton('Confirm', '#4CAF50', handleConfirm);
            const cancelButton = createButton('Cancel', '#f44336', handleCancel);
            
            buttonContainer.appendChild(confirmButton);
            buttonContainer.appendChild(cancelButton);
            return buttonContainer;
        }

        function createKbdElement(text) {
            const kbd = document.createElement('kbd');
            kbd.textContent = text;
            kbd.style.backgroundColor = '#f5f5f5';
            kbd.style.border = '1px solid #ccc';
            kbd.style.borderRadius = '3px';
            kbd.style.padding = '2px 6px';
            kbd.style.fontSize = '11px';
            kbd.style.fontFamily = 'monospace';
            return kbd;
        }

        function createKeyboardHint() {
            const keyboardHint = document.createElement('div');
            keyboardHint.style.marginTop = '15px';
            keyboardHint.style.fontSize = '12px';
            keyboardHint.style.color = '#666';
            keyboardHint.style.textAlign = 'center';
            
            const enterKbd = createKbdElement('Enter');
            const escKbd = createKbdElement('Esc');
            
            keyboardHint.appendChild(enterKbd);
            keyboardHint.appendChild(document.createTextNode(' or '));
            keyboardHint.appendChild(escKbd);
            return keyboardHint;
        }

        function createDialogContent() {
            const content = document.createElement('div');
            content.style.padding = '20px';
            content.style.textAlign = 'center';
            content.style.fontFamily = 'Arial, sans-serif';
            
            content.appendChild(createMessage());
            content.appendChild(createButtonContainer());
            content.appendChild(createKeyboardHint());
            return content;
        }

        function createDialogElement() {
            dialog = document.createElement('dialog');
            dialog.id = 'medium-freedium-dialog';
            dialog.style.position = 'relative';
            dialog.style.backgroundColor = 'white';
            dialog.style.border = '2px solid #ccc';
            dialog.style.borderRadius = '8px';
            dialog.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
            dialog.style.minWidth = '300px';
            dialog.style.maxWidth = '500px';
            
            dialog.appendChild(createDialogContent());
            return dialog;
        }

        // Create and assemble the dialog
        const container = createContainer();
        createDialogElement();
        container.appendChild(dialog);
        
        // Add keyboard event listener
        document.addEventListener('keydown', handleKeydown);
        
        // Add container to page and show dialog
        document.body.appendChild(container);
        dialog.showModal();
    }

    function handleConfirm() {
        const currentUrl = window.location.href;
        const freediumUrl = 'https://freedium.cfd/' + currentUrl;
        window.location.href = freediumUrl;
    }

    function handleCancel() {
        closeDialog();
    }

    function handleKeydown(event) {
        if (!dialog || !document.body.contains(dialog)) {
            return;
        }
        
        if (event.key === 'Escape') {
            closeDialog();
        } else if (event.key === 'Enter') {
            handleConfirm();
        }
    }

    function closeDialog() {
        const container = document.getElementById('medium-freedium-container');
        if (container && document.body.contains(container)) {
            dialog.close();
            document.body.removeChild(container);
            dialog = null;
            document.removeEventListener('keydown', handleKeydown);
        }
    }

    function init() {
        // Wait for page to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkAndShowDialog);
        } else {
            checkAndShowDialog();
        }
    }

    function checkAndShowDialog() {
        // Delay a bit to ensure page is fully loaded
        setTimeout(() => {
            if (isMediumArticle()) {
                createDialog();
            }
        }, 1000);
    }

    // Initialize script
    init();
})();
