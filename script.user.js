// ==UserScript==
// @name            AnimeStars Club Booster
// @name:en         AnimeStars Club Booster
// @name:ru         AnimeStars Club Booster
// @namespace       http://tampermonkey.net/
// @version         2025-06-07.1
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

const DELAY_MS = 1000;

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

  function getSecondsUntil2101Moscow(nowMsk) {
    const target = getTarget2101Moscow(nowMsk)
    const diffMs = target - nowMsk
    return diffMs > 0 ? Math.floor(diffMs / 1000) : 0
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  function handleBoost() {
    console.log(`Внесение вкладов начато.`)
    const intervalId = setInterval(() => {
      const refreshBtn = document.querySelector(
        ".button.button--primary.club__boost__refresh-btn",
      )

      if (refreshBtn) {
        refreshBtn.click()
        console.log(`🌀 Обновлена карта.`)
        return
      }

      const contributeBtn = document.querySelector(
        ".button.button--primary.club__boost-btn",
      )

      if (contributeBtn) {
        contributeBtn.click()
        console.log(`💳 Внесена карта: ${new Date().toLocaleTimeString()}.`)
        return
      }

      const limitCounter = document.querySelector(".boost-limit").innerText
      if (limitCounter == "300") {
        console.log(
          `💳 Лимит карт исчерпан: ${new Date().toLocaleTimeString()}.`,
        )
        clearInterval(intervalId)
        return
      }

      const now = getMoscowTime()
      if (now.getUTCHours() > 22) {
        console.log('⌛ Время пожертвования карт закончилось.')
        clearInterval(intervalId)
        return
      }

      console.log(
        "⏳ Кнопки не найдены, жду...",
        new Date().toLocaleTimeString(),
      )
    }, DELAY_MS)
  }
  async function run() {
    console.log("Начало работы ...")

    const moscowTime = getMoscowTime()
    const secondsLeft = getSecondsUntil2101Moscow(moscowTime)

    console.log(secondsLeft)
    if (secondsLeft > 0) {
      console.log(`До 21:01 Мск осталось ${secondsLeft} секунд.`)
      console.log(`Начну работу в 21:01 Мск.`)
      await sleep((secondsLeft + 1) * 1000)
      console.log(`Прошло ${secondsLeft + 1} секунд. Перезагрузкаю`)
      location.reload()
    }

    handleBoost()
    console.log(`Внесение вкладов завершено.`)
  }

  run()
})()
