// ==UserScript==
// @name            AnimeStars Club Booster
// @name:en         AnimeStars Club Booster
// @name:ru         AnimeStars Club Booster
// @namespace       http://tampermonkey.net/
// @version         2025-06-17
// @description     Скрипт для автоматизации внесения вкладов карт в клубы AnimeStars.org
// @description:ru  Скрипт для автоматизации внесения вкладов карт в клубы AnimeStars.org
// @description:en  The script for automating card boosting in clubs AnimeStars.org
// @author          Anton Zelinsky
// @match           https://animestars.org/clubs/boost/?id=*
// @match           https://asstars.tv/clubs/boost/?id=*
// @match           https://astars.club/clubs/boost/?id=*
// @match           https://*.astars.club/clubs/boost/?id=*
// @run-at          document-idle
// @license         MIT
// @icon            https://www.google.com/s2/favicons?sz=64&domain=animestars.org
// @grant           none
// @homepageURL     https://github.com/AntonZelinsky/AnimeStars_Club_Booster
// @updateURL       https://github.com/AntonZelinsky/AnimeStars_Club_Booster/blob/master/script.user.js
// @downloadURL     https://github.com/AntonZelinsky/AnimeStars_Club_Booster/blob/master/script.user.js
// ==/UserScript==


const DELAY_SEC = 1.5;

(function () {
  "use strict"

  function getMoscowTime() {
    const mskString = new Date().toLocaleString("en-US", {
      timeZone: "Europe/Moscow",
    })
    return new Date(mskString)
  }

  function getTarget2101Moscow(nowMsk) {
    const target = new Date(nowMsk)
    target.setHours(21, 1, 0, 0)
    return target
  }

  function getSecondsUntil2101Moscow() {
    const nowMsk = getMoscowTime()
    const target = getTarget2101Moscow(nowMsk)
    const diffMs = target - nowMsk
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
    if (limitCounter == 300) {
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
        console.log('🌀 Обновлена карта.')
        await sleep(0.2)
      }

      const contributeBtn = document.querySelector('.button.button--primary.club__boost-btn')
      if (contributeBtn) {
        contributeBtn.click()
        console.info(`💳 Внесена карта: ${new Date().toLocaleTimeString()}.`)
        await sleep(DELAY_SEC)
      }

      if (isBoostLimitReached()) {
        return
      }

    } while(await sleep(DELAY_SEC))
  }

  async function run() {
    console.log('Начало работы скрипта автовкладов...')

    reloadPageAfter5min()

    const secondsLeft = getSecondsUntil2101Moscow()
    if (isBoostLimitReached() && secondsLeft > 0) {
      console.log(`До 21:01 Мск осталось ${formatTimeLeft(secondsLeft)}.`)
      await sleep(secondsLeft)
      location.reload()
      return
    }

    await handleBoost()
    console.log('🏁 Внесение вкладов завершено.')
  }

  run()
})()
