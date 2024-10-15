// ==UserScript==
// @name         Azure DevOps: toggle TOC float
// @version      1.0
// @description  Make the TOC of Azure Wikis float for easier reading, toggle with "keyT"
// @license      MIT
// @author       mangogan-git
// @website     https://github.com/mangogan-git/tempermonkey-scripts
// @source       https://github.com/mangogan-git/tampermonkey-scripts/raw/master/src/azure-devops-wiki-float-toc.user.js
// @namespace    https://github.com/mangogan-git/tampermonkey-scripts/raw/master/src/azure-devops-wiki-float-toc.user.js
// @match        *://dev.azure.com/*
// @run-at       document-idle
// ==/UserScript==


(function () {
  'use strict';

  const styleTag = document.createElement("style");
  const cssRules = document.createTextNode(`
    .toc-container, .top-container {
      a {
        max-width: inherit;
      }
    }

    .markdown-content.float {
      padding-right: 300px;
    }

    .toc-container {
      position: relative;
      pointer-events: auto;

      .toggle-button {
        display: none;
      }

      &.collapsed.float {
        transform: translateX(100%);
      }

      &.float {
        position: fixed;
        top: 10%;
        right: 30px;
        width: 300px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        border-radius: 5px 0 0 5px;
        transition: transform 0.3s ease-in-out;
        z-index: 1000;

        ul {
          overflow-y: auto;
          max-height: 80vh;
          scrollbar-width: none;  /* Firefox */
          &::-webkit-scrollbar {
            display: none;  /* Safari and Chrome */
          }
        }

        .toggle-button {
          display: inherit;
        }
      }
    }

    .toc-container .btn {
        position: absolute;
        width: 30px;
        height: 30px;
        background-color: rgba(0, 0, 0, 0.7);
        cursor: pointer;
        border-radius: 5px 0 0 5px;
        text-align: center;
        line-height: 30px;
        color: white;
    }

    .toc-container {
      .static-button {
         top: 10px;
         right: 5px;
      }

      .toggle-button {
        top: 10px;
        right: 100%;
      }
    }
    `);

  styleTag.appendChild(cssRules);
  styleTag.dataset.floattoc = "true";


  function initStyles() {
    if (!document.querySelector('style[data-floattoc]')) {
      document.head.appendChild(styleTag);
    }
  }

  function addButtonToTarget({ target, className, text, title, clickHandler }) {
    const button = document.createElement('div');
    button.className = className;
    button.textContent = text;
    button.title = title;
    button.addEventListener('click', clickHandler);
    target.appendChild(button);
  }

  function initButtons() {
    const tocContainer = document.querySelector('.toc-container');
    const hasBtn = !!document.querySelector('.toc-container .toggle-button');
    if (!hasBtn) {
      addButtonToTarget({
        target: tocContainer,
        className: 'toggle-button btn',
        text: '>',
        title: 'toggle TOC collapse',
        clickHandler: () => {
          tocContainer.classList.toggle('collapsed');
          document.querySelector('.toggle-button').textContent = tocContainer.classList.contains('collapsed') ? '<' : '>';
        }
      });

      addButtonToTarget({
        target: tocContainer,
        className: 'static-button btn',
        text: '✗',
        title: 'toggle TOC floatable',
        clickHandler: () => {
          tocContainer.classList.toggle('float');
          document.querySelector('.static-button').textContent = !tocContainer.classList.contains('float') ? '↗' : '✗';
        }
      });
    }
  }

  function toggleBtnContent() {
    const btnStatic = document.querySelector('.static-button');
    const isFloat = document.querySelector('.toc-container').classList.contains('float');
    btnStatic.textContent = isFloat ? '✗' : '↗';
  }

  function toggleFloat() {

    initButtons();

    const markdownContainer = document.querySelector('.markdown-content');
    if (markdownContainer) {
      markdownContainer.classList.toggle('float');
    }

    const tocContainer = document.querySelector('.toc-container');
    if (tocContainer) {
      tocContainer.classList.toggle('float');
    }

    toggleBtnContent();
  }

  function isEditing() {
    return location.href.includes('&_a=edit');
  }

  function injectKeyboardShortcut() {
    document.addEventListener('keyup', function (e) {
      if (e.code === 'KeyT' && !isEditing()) {
        toggleFloat();
      }
    });
  }

  (function () {
    'use strict';
    initStyles();
    injectKeyboardShortcut();
  })();

})();
