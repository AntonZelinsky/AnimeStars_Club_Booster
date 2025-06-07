// ==UserScript==
// @name         AnimeStars Club Booster
// @namespace    http://tampermonkey.net/
// @version      2025-06-07
// @description  Помогает делать вклады карт в клубы AnimeStars.org
// @author       Anton Zelinsky
// @match        https://animestars.org/clubs/boost/?id=*
// @match        https://astars.club/clubs/boost/?id=*
// @match        https://asstars.club/clubs/boost/?id=*
// @match        https://asstars1.astars.club/clubs/boost/?id=*
// @match        https://as1.astars.club/clubs/boost/?id=*
// @match        https://asstars.tv/clubs/boost/?id=*
// @match        https://ass.astars.club/clubs/boost/?id=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=animestars.org
// @run-at       document-idle
// @grant        none
// @homepageURL  https://github.com/AntonZelinsky/AnimeStars_Club_Booster
// @updateURL    https://github.com/AntonZelinsky/AnimeStars_Club_Booster
// @downloadURL  https://github.com/AntonZelinsky/AnimeStars_Club_Booster
// ==/UserScript==

const DELAY_MS = 1000;

(function () {
  "use strict"

const DELAY_MS = 1000;

  function getMoscowTime() {
    const mskString = new Date().toLocaleString("en-US", {
      timeZone: "Europe/Moscow",
    })
    return new Date(mskString)
  }

  function getTarget2101Moscow(nowMsk) {
    const target = new Date(nowMsk)
    target.setHours(1, 49, 0, 0)
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
      const limitCounter = document.querySelector(".boost-limit").innerText
      if (limitCounter == "300") {
        console.log(
          `💳 Лимит карт исчерпан: ${new Date().toLocaleTimeString()}.`,
        )
        clearInterval(intervalId)
        return
      }

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
      await sleep(secondsLeft * 1000)
      console.log(`Прошло ${secondsLeft} секунд.`)
    }

    handleBoost()
    console.log(`Внесение вкладов завершено.`)
  }

  run()
})()
