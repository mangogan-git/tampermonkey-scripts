// ==UserScript==
// @name         GCP Project Environment Banner Manager
// @namespace    https://github.com/mangogan-git/tampermonkey-scripts
// @version      1.0.0
// @description  GCP Console 專案環境顏色標記與管理 UI
// @author       mangogan-git
// @license      MIT
// @website      https://github.com/mangogan-git/tampermonkey-scripts
// @source       https://github.com/mangogan-git/tampermonkey-scripts/raw/master/src/gcp-environment-banner.user.js
// @match        https://console.cloud.google.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  /**
   * ============================================================
   * Logger
   * ============================================================
   */

  const LOG_PREFIX = '[GCP-ENV-BANNER]';
  const INJECT_PROJECT_BADGE = false; // Set to true to enable project badge display

  const LOGGER = {
    enabled: false, // Set to true to enable debug logging

    debug(...args) {
      if (!this.enabled) {
        return;
      }

      console.debug(
        `%c${LOG_PREFIX}`,
        'color:#999',
        ...args
      );
    },

    info(...args) {
      if (!this.enabled) {
        return;
      }

      console.info(
        `%c${LOG_PREFIX}`,
        'color:#42a5f5;font-weight:bold',
        ...args
      );
    },

    warn(...args) {
      if (!this.enabled) {
        return;
      }

      console.warn(
        `%c${LOG_PREFIX}`,
        'color:#ffb300;font-weight:bold',
        ...args
      );
    },

    error(...args) {
      if (!this.enabled) {
        return;
      }

      console.error(
        `%c${LOG_PREFIX}`,
        'color:#ef5350;font-weight:bold',
        ...args
      );
    },
  };

  /**
   * ============================================================
   * Storage
   * ============================================================
   */

  const STORAGE_KEY = 'gcp-project-env-config-v4';

  const DEFAULT_CONFIG = {
    rulesText: [
      '# Exact match: project-id: category',
      '# Regex match: /pattern/flags: category  (top rule wins)',
      'example-dev-project: dev',
      'example-stage-project: stage',
      'example-prod-project: prod',
      '/-dev$/: dev',
      '/-staging$/: stage',
      '/-prod$/: prod',
      '/.*/: default', // Default rule (catch-all)
    ].join('\n'),
    categoriesText: [
      'dev: #C8E6C9',
      'stage: #FFF59D',
      'prod: #F44336',
    ].join('\n'),
  };

  function loadConfig() {
    try {
      const raw = GM_getValue(STORAGE_KEY);

      if (!raw) {
        LOGGER.info(
          'config not found, create default config'
        );

        GM_setValue(STORAGE_KEY, DEFAULT_CONFIG);

        return structuredClone(DEFAULT_CONFIG);
      }

      LOGGER.debug('config loaded', raw);

      return {
        ...structuredClone(DEFAULT_CONFIG),
        ...raw,
      };
    } catch (err) {
      LOGGER.error('loadConfig failed', err);

      return structuredClone(DEFAULT_CONFIG);
    }
  }

  function saveConfig(cfg) {
    try {
      GM_setValue(STORAGE_KEY, cfg);

      LOGGER.info('config saved', cfg);
    } catch (err) {
      LOGGER.error('saveConfig failed', err);
    }
  }

  let config = loadConfig();

  /**
   * ============================================================
   * Parsers
   * ============================================================
   */

  /**
   * Parse the rules text into an ordered array of rule objects.
   * Format per line: "pattern: category"
   * - Exact match: "my-project: dev"
   * - Regex match: "/pattern/flags: category"
   * Lines starting with # are treated as comments and ignored.
   */
  function parseRules(rulesText) {
    return (rulesText || '')
      .split('\n')
      .map(function (line) { return line.trim(); })
      .filter(function (line) { return line && !line.startsWith('#'); })
      .map(function (line) {
        // Use lastIndexOf to avoid being misled by colons inside regex patterns
        // e.g. /(?:dev|stage)/: category  or  /pattern/:category (no space)
        const sepIdx = line.lastIndexOf(':');

        if (sepIdx === -1) {
          return null;
        }

        const pattern = line.slice(0, sepIdx).trim();
        const category = line.slice(sepIdx + 1).trim();

        if (!pattern || !category) {
          return null;
        }

        const lastSlash = pattern.lastIndexOf('/');
        const isRegex =
          pattern.startsWith('/') && lastSlash > 0;

        return { pattern, isRegex, category };
      })
      .filter(Boolean);
  }

  /**
   * Parse the categories text into a {name: color} object.
   * Format per line: "name: #hexcolor"
   * Lines starting with # are treated as comments and ignored.
   */
  function parseCategories(categoriesText) {
    const result = {};

    (categoriesText || '')
      .split('\n')
      .map(function (line) { return line.trim(); })
      .filter(function (line) { return line && !line.startsWith('#'); })
      .forEach(function (line) {
        const sepIdx = line.indexOf(':');

        if (sepIdx === -1) {
          return;
        }

        const name = line.slice(0, sepIdx).trim();
        const color = line.slice(sepIdx + 1).trim();

        if (name && color) {
          result[name] = color;
        }
      });

    return result;
  }

  /**
   * ============================================================
   * Utils
   * ============================================================
   */

  function getProjectId() {
    try {
      const url = new URL(window.location.href);
      const projectId = url.searchParams.get('project');

      if (!projectId) {
        LOGGER.debug(
          'project id not found in url',
          window.location.href
        );
      }

      LOGGER.info('current project id', projectId);

      return projectId;
    } catch (err) {
      LOGGER.error('getProjectId failed', err);

      return null;
    }
  }

  function getProjectCategory(projectId) {
    const rules = parseRules(config.rulesText);

    for (const rule of rules) {
      if (rule.isRegex) {
        const lastSlash = rule.pattern.lastIndexOf('/');
        const regexBody = rule.pattern.slice(1, lastSlash);
        const flags = rule.pattern.slice(lastSlash + 1);

        try {
          if (new RegExp(regexBody, flags).test(projectId)) {
            return rule.category;
          }
        } catch (e) {
          LOGGER.warn(
            'invalid regex rule, skipping',
            rule.pattern,
            e
          );
        }
      } else {
        if (rule.pattern === projectId) {
          return rule.category;
        }
      }
    }

    return null;
  }

  function getCategoryColor(category) {
    return parseCategories(config.categoriesText)[category] || null;
  }

  function getBanner() {
    return document.querySelector(
      'div[role="banner"]'
    );
  }

  function getInsertTarget() {
    return document.querySelector(
      'div[role="banner"] .cfc-platform-bar-left'
    );
  }

  /**
   * ============================================================
   * Banner
   * ============================================================
   */

  function clearBannerColor() {
    try {
      const banner = getBanner();

      if (!banner) {
        return;
      }

      banner.style.background = '';
      banner.style.backgroundImage = '';

      const badge = document.getElementById(
        'tm-gcp-project-badge'
      );

      if (badge) {
        badge.remove();
      }

      LOGGER.debug('banner color cleared');
    } catch (err) {
      LOGGER.error('clearBannerColor failed', err);
    }
  }

  function injectProjectBadge(projectId, category, color) {
    try {
      const BADGE_ID = 'tm-gcp-project-badge';

      let badge = document.getElementById(BADGE_ID);

      if (!badge) {
        badge = document.createElement('div');
        badge.id = BADGE_ID;
        document.body.appendChild(badge);
      }

      badge.textContent =
        `${category.toUpperCase()} | ${projectId}`;

      Object.assign(badge.style, {
        position: 'fixed',
        top: '14px',
        right: '72px',
        zIndex: '999999',
        padding: '6px 12px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: '700',
        color: '#fff',
        background: color,
        pointerEvents: 'none',
        fontFamily: 'Roboto, sans-serif',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      });
    } catch (err) {
      LOGGER.error('injectProjectBadge failed', err);
    }
  }

  function applyBannerColor() {
    try {
      const projectId = getProjectId();

      if (!projectId) {
        LOGGER.debug('skip apply color, no project id');

        return;
      }

      const category = getProjectCategory(projectId);

      if (!category) {
        LOGGER.warn('project category not found', projectId);

        clearBannerColor();

        return;
      }

      const color = getCategoryColor(category);

      if (!color) {
        LOGGER.info('category color empty, skip', {
          projectId,
          category,
        });

        clearBannerColor();

        return;
      }

      const banner = getBanner();

      if (!banner) {
        LOGGER.warn('banner element not found');

        return;
      }

      banner.style.background = color;
      banner.style.backgroundImage = 'none';
      banner.style.transition = 'background-color 0.2s ease';

      if (INJECT_PROJECT_BADGE) {
        injectProjectBadge(projectId, category, color);
      }

      LOGGER.info('banner color applied', {
        projectId,
        category,
        color,
      });
    } catch (err) {
      LOGGER.error('applyBannerColor failed', err);
    }
  }

  /**
   * ============================================================
   * UI
   * ============================================================
   */

  function injectControlButton() {
    try {
      if (document.getElementById('tm-gcp-config-btn')) {
        return;
      }

      const target = getInsertTarget();

      if (!target) {
        LOGGER.warn(
          'inject target not found (.cfc-platform-bar-left)'
        );

        return;
      }

      const btn = document.createElement('button');

      btn.id = 'tm-gcp-config-btn';
      btn.textContent = '🎨';
      btn.title = 'GCP Environment Color Config';

      Object.assign(btn.style, {
        marginLeft: '12px',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.08)',
        cursor: 'pointer',
        fontSize: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      });

      btn.addEventListener('click', openConfigModal);

      target.appendChild(btn);

      LOGGER.info('config button injected');
    } catch (err) {
      LOGGER.error('injectControlButton failed', err);
    }
  }

  function closeConfigModal() {
    try {
      const modal = document.getElementById('tm-gcp-config-modal');

      if (modal) {
        modal.remove();
      }
    } catch (err) {
      LOGGER.error('closeConfigModal failed', err);
    }
  }

  function createHint(text) {
    const hint = document.createElement('div');

    hint.className = 'tm-hint';
    hint.textContent = text;

    return hint;
  }

  function openConfigModal() {
    try {
      closeConfigModal();

      const modal = document.createElement('div');

      modal.id = 'tm-gcp-config-modal';

      /**
       * backdrop
       */

      const backdrop = document.createElement('div');

      backdrop.className = 'tm-modal-backdrop';

      /**
       * panel
       */

      const panel = document.createElement('div');

      panel.className = 'tm-modal-panel';

      /**
       * header
       */

      const header = document.createElement('div');

      header.className = 'tm-header';

      const headerTitle = document.createElement('div');
      const headerStrong = document.createElement('strong');

      headerStrong.textContent = 'GCP Environment Config';
      headerTitle.appendChild(headerStrong);

      const closeBtn = document.createElement('button');

      closeBtn.id = 'tm-close-btn';
      closeBtn.textContent = '✕';

      header.appendChild(headerTitle);
      header.appendChild(closeBtn);

      /**
       * body
       */

      const body = document.createElement('div');

      body.className = 'tm-body';

      /**
       * current project
       */

      const currentSection = document.createElement('div');

      currentSection.className = 'tm-section';

      const currentTitle = document.createElement('div');

      currentTitle.className = 'tm-section-title';
      currentTitle.textContent = 'Current Project';

      const currentProject = document.createElement('div');

      currentProject.className = 'tm-current-project';
      currentProject.textContent = getProjectId() || '-';

      currentSection.appendChild(currentTitle);
      currentSection.appendChild(currentProject);

      /**
       * project rules
       */

      const mappingSection = document.createElement('div');

      mappingSection.className = 'tm-section';

      const mappingTitle = document.createElement('div');

      mappingTitle.className = 'tm-section-title';
      mappingTitle.textContent = 'Project Rules';

      const mappingTextarea = document.createElement('textarea');

      mappingTextarea.id = 'tm-project-mapping';
      mappingTextarea.spellcheck = false;
      mappingTextarea.value = config.rulesText;

      mappingSection.appendChild(mappingTitle);
      mappingSection.appendChild(mappingTextarea);
      mappingSection.appendChild(
        createHint(
          'One rule per line: rule: category  \u00b7  Regex: /pattern/flags: category  \u00b7  Top rule wins  \u00b7  Lines starting with # are ignored'
        )
      );

      /**
       * categories
       */

      const categorySection = document.createElement('div');

      categorySection.className = 'tm-section';

      const categoryTitle = document.createElement('div');

      categoryTitle.className = 'tm-section-title';
      categoryTitle.textContent = 'Categories';

      const categoryTextarea = document.createElement('textarea');

      categoryTextarea.id = 'tm-category-config';
      categoryTextarea.spellcheck = false;
      categoryTextarea.value = config.categoriesText;

      categorySection.appendChild(categoryTitle);
      categorySection.appendChild(categoryTextarea);
      categorySection.appendChild(
        createHint('One per line: name: #hexcolor  \u00b7  Leave color empty (name:) to skip coloring that category')
      );

      /**
       * footer
       */

      const footer = document.createElement('div');

      footer.className = 'tm-footer';

      const saveBtn = document.createElement('button');

      saveBtn.id = 'tm-save-btn';
      saveBtn.textContent = 'Save';

      footer.appendChild(saveBtn);

      /**
       * assemble
       */

      body.appendChild(currentSection);
      body.appendChild(mappingSection);
      body.appendChild(categorySection);
      body.appendChild(footer);

      panel.appendChild(header);
      panel.appendChild(body);

      modal.appendChild(backdrop);
      modal.appendChild(panel);

      document.body.appendChild(modal);

      /**
       * events
       */

      closeBtn.addEventListener('click', closeConfigModal);
      backdrop.addEventListener('click', closeConfigModal);
      saveBtn.addEventListener('click', saveModalConfig);

      LOGGER.info('config modal opened');
    } catch (err) {
      LOGGER.error('openConfigModal failed', err);
    }
  }

  function saveModalConfig() {
    try {
      const rulesText = document.getElementById(
        'tm-project-mapping'
      ).value;

      const categoriesText = document.getElementById(
        'tm-category-config'
      ).value;

      config = { rulesText, categoriesText };

      saveConfig(config);

      applyBannerColor();

      closeConfigModal();

      LOGGER.info('modal config saved successfully');

      alert('Saved');
    } catch (err) {
      LOGGER.error('saveModalConfig failed', err);

      alert(`Error\n\n${err.message}`);
    }
  }

  /**
   * ============================================================
   * Styles
   * ============================================================
   */

  GM_addStyle(`
    #tm-gcp-config-modal {
      position: fixed;
      inset: 0;
      z-index: 99999999;
    }

    #tm-gcp-config-modal * {
      box-sizing: border-box;
    }

    .tm-modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(2px);
    }

    .tm-modal-panel {
      position: absolute;

      top: 50%;
      left: 50%;

      transform: translate(-50%, -50%);

      width: 900px;
      max-width: 95vw;
      max-height: 90vh;

      overflow: auto;

      background: #202124;
      color: #fff;

      border-radius: 12px;

      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    }

    .tm-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      padding: 16px 20px;

      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    #tm-close-btn {
      border: none;
      background: transparent;
      color: #fff;
      font-size: 18px;
      cursor: pointer;
    }

    .tm-body {
      padding: 20px;
    }

    .tm-section {
      margin-bottom: 20px;
    }

    .tm-section-title {
      font-weight: 700;
      margin-bottom: 8px;
    }

    .tm-current-project {
      padding: 10px 12px;

      border-radius: 8px;

      background: rgba(255,255,255,0.08);

      font-family: monospace;
    }

    #tm-project-mapping,
    #tm-category-config {
      width: 100%;
      min-height: 220px;

      border: 1px solid rgba(255,255,255,0.15);

      border-radius: 8px;

      background: #111;
      color: #fff;

      padding: 12px;

      resize: vertical;

      font-family: monospace;
      font-size: 13px;
      line-height: 1.5;
    }

    .tm-hint {
      margin-top: 6px;
      font-size: 11px;
      opacity: 0.65;
    }

    .tm-footer {
      margin-top: 20px;

      display: flex;
      justify-content: flex-end;
    }

    #tm-save-btn {
      border: none;

      border-radius: 8px;

      padding: 10px 18px;

      cursor: pointer;

      background: #1a73e8;
      color: #fff;

      font-weight: 700;
    }

    #tm-save-btn:hover {
      filter: brightness(1.1);
    }
  `);

  /**
   * ============================================================
   * SPA Route Detection
   * ============================================================
   */

  let lastUrl = location.href;

  const observer = new MutationObserver(function () {
    if (location.href !== lastUrl) {
      LOGGER.debug('route changed', location.href);

      lastUrl = location.href;

      setTimeout(function () {
        injectControlButton();
        applyBannerColor();
      }, 300);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  /**
   * ============================================================
   * Boot
   * ============================================================
   */

  function boot() {
    try {
      LOGGER.info('boot start');

      injectControlButton();

      applyBannerColor();

      LOGGER.info('boot completed');
    } catch (err) {
      LOGGER.error('boot failed', err);
    }
  }

  setTimeout(boot, 1000);
})();
