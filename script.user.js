// ==UserScript==
// @name            AnimeStars Club Booster
// @name:en         AnimeStars Club Booster
// @name:ru         AnimeStars Club Booster
// @namespace       http://tampermonkey.net/
// @version         2025-07-12
// @description     Скрипт для автоматизации внесения вкладов карт в клубы AnimeStars.org. На странице с колодами карт добавляется кнопка "Добавить недостающие в список" для быстрого пополнения недостающих карт.
// @description:ru  Скрипт для автоматизации внесения вкладов карт в клубы AnimeStars.org. На странице с колодами карт добавляется кнопка "Добавить недостающие в список" для быстрого пополнения недостающих карт.
// @description:en  The script for automating card boosting in clubs AnimeStars.org. Adds a button "Add missing to list" on the card decks page for quick addition of missing cards.
// @author          Anton Zelinsky
// @match           https://animestars.org/clubs/boost/?id=*
// @match           https://asstars.tv/clubs/boost/?id=*
// @match           https://*.asstars.tv/clubs/boost/?id=*
// @match           https://astars.club/clubs/boost/?id=*
// @match           https://*.astars.club/clubs/boost/?id=*
// @match           https://animestars.org/user/*/cards_progress/*
// @match           https://asstars.tv/user/*/cards_progress/*
// @match           https://*.asstars.tv/user/*/cards_progress/*
// @match           https://astars.club/user/*/cards_progress/*
// @match           https://*.astars.club/user/*/cards_progress/*
// @run-at          document-idle
// @license         MIT
// @icon            https://www.google.com/s2/favicons?sz=64&domain=animestars.org
// @grant           none
// @homepageURL     https://github.com/AntonZelinsky/AnimeStars_Club_Booster
// @downloadURL https://update.greasyfork.org/scripts/538709/AnimeStars%20Club%20Booster.user.js
// @updateURL https://update.greasyfork.org/scripts/538709/AnimeStars%20Club%20Booster.meta.js
// ==/UserScript==


const DELAY_SEC = 2;

(function () {
  "use strict"

  let limitCounter = 600;

  function getMinskTime() {
    const minskTimeString = new Date().toLocaleString("en-US", {
      timeZone: "Europe/Minsk",
      hour12: false,
    })
    return new Date(minskTimeString)
  }

  function getTarget2101MinskTime(nowMinskTime) {
    const targetTime = new Date(nowMinskTime)
    targetTime.setHours(21, 1, 0, 0)
    return targetTime
  }

  function getUntil2101MinskSeconds() {
    const nowMinskTime = getMinskTime()
    const targetTime = getTarget2101MinskTime(nowMinskTime)
    const diffMs = targetTime - nowMinskTime
    return diffMs > 0 ? Math.floor(diffMs / 1000) : 0
  }

  function sleep(seconds) {
    return new Promise(resolve => setTimeout(() => resolve(true), seconds * 1000));
  }

  function reloadPageAfter5min() {
    // Перезагрузка страницы, для обновления общей статистики вкладов
    console.log('Страница перезагрузится через 5 минут.')
    setTimeout(() => {
      location.reload();
    }, 5 * 60 * 1000); // 5 минут
  }

  function isBoostLimitReached() {
    const limitCounter = document.querySelector('.boost-limit').innerText
    if (limitCounter == limitCounter) {
      console.info(`💳 Лимит карт исчерпан: ${new Date().toLocaleTimeString()}.`)
      return true
    }
    return false
  }

  function formatTimeLeft(seconds) {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    const parts = []
    if (hrs > 0) parts.push(`${hrs} ч`)
    if (mins > 0) parts.push(`${mins} мин`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs} сек`)
    
    return parts.join(' ')
  }

  async function handleBoost() {
    console.log('Внесение вкладов начато.')
    do {
      const refreshBtn = document.querySelector('.button.button--primary.club__boost__refresh-btn')
      if (refreshBtn) {
        refreshBtn.click()
        console.log(`🌀 Обновлена карта: ${refreshBtn.dataset.cardId}.`)
        await sleep(0.2)
      }

      const contributeBtn = document.querySelector('.button.button--primary.club__boost-btn')
      if (contributeBtn) {
        contributeBtn.click()
        console.info(`💳 Внесена карта: ${contributeBtn.dataset.cardId}. ${new Date().toLocaleTimeString()}.`)
        await sleep(DELAY_SEC)
      }

      if (isBoostLimitReached()) {
        break
      }

    } while(await sleep(DELAY_SEC))
  }

  async function runBoost() {
    console.log(`Начало работы автовкладов. ${new Date().toLocaleTimeString()}.`)

    reloadPageAfter5min()

    limitCounter = document.querySelector('.boost-limit').nextSibling.substringData(1, 3)

    const secondsLeft = getUntil2101MinskSeconds()
    if (isBoostLimitReached() && secondsLeft > 0) {
      console.log(`До 21:01 по Мінску осталось ${formatTimeLeft(secondsLeft)}.`)
      await sleep(secondsLeft)
      location.reload()
      return
    }

    await handleBoost()
    console.log('🏁 Внесение вкладов завершено.')
  }

  function injectCardsProgressButtons() {
    const userAnimeDivs = document.querySelectorAll('div.user-anime');

    userAnimeDivs.forEach(div => {
      const progressDiv = div.querySelector('div.user-anime__progress');
      const button = div.querySelector('button.update-my-progress');
      const animeId = button?.getAttribute('onclick')?.match(/UpdateMyProgress\('(\d+)'\)/)?.[1] || '000000';

      progressDiv?.insertAdjacentHTML('afterend', `
        <div class="cards-progress card-anime-list__add-btn" data-anime="${animeId}" style="display:block">
          <i class="ass-cards"></i> Добавить недостающие в список желаний
        </div>
      `);
    });
  }

  if (/\/user\/[^\/]+\/cards_progress\//.test(window.location.pathname)) {
    injectCardsProgressButtons();
  }

  if (/\/clubs\/boost\//.test(window.location.pathname)) {
    runBoost();
  }
})()
