// ==UserScript==
// @name         TalentLMS Transcript Copy Button
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Добавляет кнопку Копирования транскрипции слайдов с сайта изучения теории для лицензии пилота. https://www.evionica.com/
// @author       Anton Zelinsky
// @match        https://*.talentlms.com/*
// @grant        GM_setClipboard
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const waitForElement = (selector, timeout = 10000) => new Promise((resolve, reject) => {
        const interval = 100;
        let elapsed = 0;
        const check = () => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);
            elapsed += interval;
            if (elapsed >= timeout) return reject('Timeout waiting for ' + selector);
            setTimeout(check, interval);
        };
        check();
    });

    waitForElement('#transcript-link').then(transcriptBtn => {
        const container = document.querySelector('#links-right');
        if (!container) return console.warn('❌ #links-right not found');

        if (document.querySelector('#copy-transcript-btn')) return;

        const copyBtn = document.createElement('button');
        copyBtn.id = 'copy-transcript-btn';
        copyBtn.className = 'cs-topmenu-item cs-tabs top-tab panel-link';
        copyBtn.style = `
            position: absolute;
            left: 0px;
            top: 20px;
            overflow: hidden;
            transform-origin: center center;
            z-index: 3;
            cursor: pointer;
            width: 40px;
            height: 23px;
            transform: translate(379px, 0px);
            border: 1px solid rgba(0, 0, 0, 0);`;

        copyBtn.innerHTML = `
            <div class="view-content" tabindex="-1">
                <span class="cs-tab" title="Kopiuj">📋</span>
            </div>`;

        copyBtn.addEventListener('click', () => {
            const content = document.querySelector('div[data-ref="content"]');
            if (!content) return console.warn('❌ Transcript content not found');
            const text = content.innerText.trim();
            if (!text) return console.log('ℹ️ Nothing to copy');

            GM_setClipboard(text + '\n\n\n');

            copyBtn.style.opacity = '0.4';
            copyBtn.style.cursor = 'default';
            copyBtn.style.pointerEvents = 'none';

            setTimeout(() => {
                copyBtn.style.opacity = '1.0';
                copyBtn.style.cursor = 'pointer';
                copyBtn.style.pointerEvents = 'auto';
            }, 1500);
        });

        container.insertBefore(copyBtn, transcriptBtn);
        console.log('🆗 Copy button added');
    }).catch(err => console.error('⏳ Wait failed:', err));
})();
