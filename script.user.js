// ==UserScript==
// @name            AnimeStars Club Booster
// @name:en         AnimeStars Club Booster
// @name:ru         AnimeStars Club Booster
// @namespace       http://tampermonkey.net/
// @version         2025-06-07.3
// @description     Скрипт для автоматизации внесения вкладов карт в клубы AnimeStars.org
// @description:ru  Скрипт для автоматизации внесения вкладов карт в клубы AnimeStars.org
// @description:en  The script for automating card boosting in clubs AnimeStars.org
// @author          Anton Zelinsky
// @match           https://animestars.org/clubs/boost/?id=*
// @match           https://astars.club/clubs/boost/?id=*
// @match           https://asstars.club/clubs/boost/?id=*
// @match           https://asstars1.astars.club/clubs/boost/?id=*
// @match           https://as1.astars.club/clubs/boost/?id=*
// @match           https://asstars.tv/clubs/boost/?id=*
// @match           https://ass.astars.club/clubs/boost/?id=*
// @run-at          document-idle
// @license         MIT
// @icon            https://www.google.com/s2/favicons?sz=64&domain=animestars.org
// @grant           none
// @homepageURL     https://github.com/AntonZelinsky/AnimeStars_Club_Booster
// @updateURL       https://github.com/AntonZelinsky/AnimeStars_Club_Booster/blob/master/script.user.js
// @downloadURL     https://github.com/AntonZelinsky/AnimeStars_Club_Booster/blob/master/script.user.js
// ==/UserScript==


const DELAY_MS = 1000; // 1 секунда = 1000 миллисекунд

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

  function isTimeExpired() {
    const moscowTime = getMoscowTime()
    if (moscowTime.getHours() > 22) {
      console.info('🏁 Время пожертвования карт закончилось.')
      return true;
    }
    return false;
  }

  function sleep(seconds) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  function reloadPageAfter5min() {
    // Необходима перезагрузка страницы, так как счётчик внесённых карт автоматически не обновляется
    console.log(`Страница перезагрузится через 5 минут.`)
    setTimeout(() => {
      location.reload();
    }, 5 * 60 * 1000); // 5 минут
  }

  function isBoostLimitReached() {
    const limitCounter = document.querySelector(".boost-limit").innerText
    return limitCounter == 300
  }

  function handleBoost() {
    console.log(`Внесение вкладов начато.`)
    const intervalId = setInterval(() => {
      const refreshBtn = document.querySelector(".button.button--primary.club__boost__refresh-btn")
      if (refreshBtn) {
        refreshBtn.click()
        console.log(`🌀 Обновлена карта.`)
        return
      }

      const contributeBtn = document.querySelector(".button.button--primary.club__boost-btn")
      if (contributeBtn) {
        contributeBtn.click()
        console.info(`💳 Внесена карта: ${new Date().toLocaleTimeString()}.`)
        return
      }

      if (isTimeExpired(intervalId)) {
        clearInterval(intervalId);
        return
      }

      console.log("⏳ Кнопки не найдены, жду...", new Date().toLocaleTimeString())
    }, DELAY_MS);
  }

  async function run() {
    console.log("Начало работы ...")
    reloadPageAfter5min()

    const secondsLeft = getSecondsUntil2101Moscow()
    if (secondsLeft > 0) {
      console.log(`До 21:01 Мск осталось ${secondsLeft} секунд.`)
      await sleep(secondsLeft + 1)
      location.reload()
      return
    }

    if(isBoostLimitReached()) {
      console.info(`💳 Лимит карт исчерпан: ${new Date().toLocaleTimeString()}.`)
      return
    }
    if (isTimeExpired()) {
      return
    }

    handleBoost()
    console.log(`🏁 Внесение вкладов завершено.`)
  }

  run()
})()
