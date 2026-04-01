// ==UserScript==
// @name         Awiacja Question Copy Button
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Помогает тренировать билеты к теоритическому экзамену на пилота для лицензии PPL в Польше. Добавляет кнопку копирования к вопросу на awiacja.edu.pl, которая копирует вопрос и ответы на его.
// @author       Anton Zelinsky
// @match        https://awiacja.edu.pl/groups/*
// @run-at       document-idle
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
    'use strict';

    const injectCopyButton = () => {

        const ol = document.querySelector('ol.question');
        if (!ol) return;

        const toolbox = ol.querySelector('.question-toolbox');
        if (!toolbox || toolbox.querySelector('.fa-copy')) return;

        const icon = document.createElement('i');
        icon.className = 'far fa-copy medium';
        icon.style.cssText = 'cursor: pointer; font-size: 1.5em;';
        icon.title = 'Kopiuj pytanie i odpowiedzi';

        icon.addEventListener('click', () => {
            const questionSpan = ol.querySelector('h3 span');
            const answerItems = [...ol.querySelectorAll('li.answer')];

            const question = questionSpan?.innerText?.trim() || '';
            const answers = answerItems.map(li => li.innerText.trim() + '.');
            const fullText = [question, ...answers].join('\n\n');
            GM_setClipboard(fullText);
            console.log('✅ Skopiowano pytanie:', question);

            // ===== ВИЗУАЛЬНОЕ ВЫДЕЛЕНИЕ =====
            const selection = window.getSelection();
            selection.removeAllRanges();

            const range = document.createRange();
            range.setStartBefore(questionSpan);
            range.setEndAfter(answerItems[answerItems.length - 1]);

            selection.addRange(range);
            // =================================

            icon.style.opacity = '0.4';
            icon.style.cursor = 'default';
            icon.style.pointerEvents = 'none';

            setTimeout(() => {
                icon.style.opacity = '1.0';
                icon.style.cursor = 'pointer';
                icon.style.pointerEvents = 'auto';
            }, 1500);
        });

        const lightbulb = toolbox.querySelector('.fa-lightbulb');
        if (lightbulb) {
            lightbulb.parentElement.insertBefore(icon, lightbulb.nextSibling);
        }
    };

    const observer = new MutationObserver(() => injectCopyButton());
    observer.observe(document.body, { childList: true, subtree: true });

    injectCopyButton();
})();
