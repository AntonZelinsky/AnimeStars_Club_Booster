// ==UserScript==
// @name            AnimeStars Club Booster
// @name:en         AnimeStars Club Booster
// @name:ru         AnimeStars Club Booster
// @namespace       http://tampermonkey.net/
// @version         2.0.0
// @description     Автоматизирует внесение вкладов карт в клубах на AnimeStars. Отправляет уведомления в Telegram-чат о текущей карте и её владельцах. Добавляет кнопку добавления недостающих карт в список желаний на странице Колод карт.
// @description:ru  Автоматизирует внесение вкладов карт в клубах на AnimeStars. Отправляет уведомления в Telegram-чат о текущей карте и её владельцах. Добавляет кнопку добавления недостающих карт в список желаний на странице Колод карт.
// @description:en  Automates card contributions in AnimeStars clubs. Sends Telegram chat notifications about the current card and its owners. Adds a button to add missing cards to the wishlist on the Card Decks page.
// @author          Anton Zelinsky https://t.me/anzeky
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
// @downloadURL     https://update.greasyfork.org/scripts/538709/AnimeStars%20Club%20Booster.user.js
// @updateURL       https://update.greasyfork.org/scripts/538709/AnimeStars%20Club%20Booster.meta.js
// ==/UserScript==

/*
 * === КАК РАБОТАЕТ АВТОМАТИЧЕСКИЙ ВЗНОС КАРТ ===
 *
 * Для корректной работы автовзносов:
 * - Откройте страницу Внесения вкладов (ссылка в клубе)
 * - Можно открыть страницу заранее — в нужное время скрипт сам начнёт работу
 * - Не закрывайте вкладку до завершения вкладов (можно свернуть или переключить — это не мешает)
 * - В 21:01 по Минску (UTC+3) скрипт начнёт вносить карты автоматически
 * - Раз в 5 минут страница автоматически перезагружается для обновления статистики вкладов
 * - ⚠️ Важно: должна быть открыта только одна вкладка страницы Внесения вкладов,
 *   иначе возможна блокировка из-за слишком частых запросов
 */


// === НАСТРОЙКИ АВТОВЗНОСОВ ===

// Задержка перед нажатием кнопки "Обновить карту" (в секундах)
// Используется для управления частотой обновлений текущей карты во вкладке клуба
const DELAY_RREFRESH_SEC = 1.4;

// Задержка после обновления карты перед внесением (в секундах)
// Нужна, чтобы DOM успел полностью обновиться перед кликом "Внести карту"
const DELAY_BOOST_AFTER_REFRESH_SEC = 0.2;


/*
 * === ДОПОЛНИТЕЛЬНАЯ НАСТРОЙКА УВЕДОМЛЕНИЙ В TELEGRAM ===
 *
 * ⚠️ Этот функционал НЕ обязателен.
 * Если вы ничего не заполняете, будет работать только автоматический функционал внесения вкладов.
 *
 * ⚠️ Важно: скрипт, настроенный на отправку уведомлений в Telegram, должен быть активен только у одного пользователя.
 * Иначе в чат будут поступать дублирующие уведомления от разных людей.
 *
 * ⚠️ Рекомендуется запускать скрипт с включёнными уведомлениями только администраторам или модераторам клуба.
 * У обычных участников может проявляться баг сайта: при смене карты список владельцев не всегда обновляется корректно,
 * из-за чего Telegram-уведомления могут не отправляться или содержать неполные данные.
 *
 * Чтобы Telegram-бот начал отправлять уведомления в ваш чат:
 *
 * 1. Заполните переменную `usernameMappingRaw` соответствиями:
 *    username_на_сайте:@telegram_username
 *    (одна пара на строку, без пробелов вокруг двоеточия)
 *
 *    Не все пользователи имеют публичный Telegram username.
 *    В таких случаях можно использовать их Telegram ID через формат ссылки:
 *    username_на_сайте:<a href="tg://user?id=TelegramID">Имя</a>
 *
 *    Примеры:
 *      const usernameMappingRaw = `
 *      AnimeStarsNews:@AnimeStarsNews
 *      admin:<a href="tg://user?id=123123123">AnimeStars Admin</a>
 *      `
 *
 * 2. Установите значение переменной `RAW_TELEGRAM_CHAT_ID`.
 *    - Это ID вашей группы или канала, **в который будут отправляться уведомления со списком владельцев карты**.
 *    - Как получить chat_id: https://pikabu.ru/story/_11099278
 *    - Пример:
 *        const RAW_TELEGRAM_CHAT_ID = '243547803';
 *      или
 *        const RAW_TELEGRAM_CHAT_ID = '-100243547803';
 *
 * 3. Добавьте бота @AnimeStarsClubBoosterBot в чат или канал, куда должны приходить уведомления.
 *    - Убедитесь, что бот имеет право отправлять сообщения (в Telegram-канале для этого нужно назначить его администратором с разрешением "Публиковать сообщения").
 *    - При желании можно создать собственного бота через https://t.me/BotFather.
 *      Полученный токен необходимо записать в переменную `TELEGRAM_BOT_TOKEN`.
 *      После этого вместо @AnimeStarsClubBoosterBot в чат нужно добавить вашего собственного бота.
 *
 * После этого скрипт сможет автоматически отправлять сообщения в Telegram
 * со списком владельцев нужной карты.
 */


// === НАСТРОЙКИ УВЕДОМЛЕНИЙ В TELEGRAM ===

// 1. Соответствие username на сайте : Telegram username / ID
const RAW_USERNAME_MAPPING = `

`.trim();

// 2. ID чата или канала, куда отправляются уведомления
const RAW_TELEGRAM_CHAT_ID = '';

// 3. Токен Telegram-бота, через которого будут отправляться уведомления
// По умолчанию используется https://t.me/AnimeStarsClubBoosterBot
const TELEGRAM_BOT_TOKEN = '';

// 4. Задержка перед отправкой уведомления в Telegram (в секундах)
const DELAY_SEND_MESSAGE__SEC = 4;


const USERNAME_MAPPING = (() => {
  const entries = RAW_USERNAME_MAPPING
    .split('\n')
    .map(line => {
      const match = line.trim().match(/^([^:]+):(.*)$/);
      return match ? [match[1].trim(), match[2].trim()] : null;
    })
    .filter(Boolean);

  return entries.length > 0 ? Object.fromEntries(entries) : null;
})();

const TELEGRAM_CHAT_ID = RAW_TELEGRAM_CHAT_ID.startsWith('-100') // Id чата Telegram должен начинаться с -100
  ? RAW_TELEGRAM_CHAT_ID
  : `-100${RAW_TELEGRAM_CHAT_ID}`;

(function () {
  "use strict"

  const MAX_LIMIT_CARDS = 600;
  const COOKIE_KEY_CURRENT_BOOST_CARD_ID = 'CURRENT_BOOST_CARD_ID';
  const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

  /**
   * Возвращает текущее время по Минску
   * @returns {Date} — объект времени по Минску
   */
  function getMinskTime() {
    const minskTimeString = new Date().toLocaleString("en-US", {
      timeZone: "Europe/Minsk",
      hour12: false,
    });
    return new Date(minskTimeString);
  }

  /**
   * Возвращает объект времени 21:01 по Минску для переданной даты
   * @param {Date} nowMinskTime — текущее время по Минску
   * @returns {Date} — объект времени 21:01 по Минску
   */
  function getTarget2101MinskTime(nowMinskTime) {
    const targetTime = new Date(nowMinskTime);
    targetTime.setHours(21, 1, 0, 2);
    return targetTime;
  }

  /**
   * Возвращает количество секунд до 21:01 по Минску
   * @returns {number} — количество секунд до 21:01
   */
  function getUntil2101MinskSeconds() {
    const nowMinskTime = getMinskTime();
    const targetTime = getTarget2101MinskTime(nowMinskTime);
    const diffMs = targetTime - nowMinskTime;
    return diffMs > 0 ? Math.floor(diffMs / 1000) : 0;
  }

  /**
   * Асинхронная задержка на заданное количество секунд
   * @param {number} seconds — количество секунд
   * @returns {Promise<boolean>} — промис, который резолвится через заданное время
   */
  function sleep(seconds) {
    return new Promise(resolve => setTimeout(() => resolve(true), seconds * 1000));
  }

  /**
   * Перезагружает страницу через 5 минут (для обновления статистики)
   */
  function reloadPageAfter5min() {
    DLEPush.info('Страница перезагрузится через 5 минут.')
    setTimeout(() => {
      location.reload();
    }, 5 * 60 * 1000);
  }

  /**
   * Проверяет, достигнут ли лимит внесённых карт
   * @returns {boolean} — true, если лимит достигнут
   */
  function isBoostLimitReached() {
    const limitCounter = document.querySelector('.boost-limit').innerText;
    if (MAX_LIMIT_CARDS == limitCounter) {
      console.info(`💳 Лимит карт исчерпан: ${new Date().toLocaleTimeString()}.`);
      DLEPush.info(`💳 Лимит карт исчерпан: ${new Date().toLocaleTimeString()}.`);
      return true;
    }
    return false;
  }

  /**
   * Преобразует количество секунд в строку вида "X ч Y мин Z сек"
   * @param {number} seconds — количество секунд
   * @returns {string} — строка с форматированным временем
   */
  function formatTimeLeft(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hrs > 0) parts.push(`${hrs} ч`);
    if (mins > 0) parts.push(`${mins} мин`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs} сек`);

    return parts.join(' ');
  }

  /**
   * Получает строку из localStorage
   * @param {string} key — Ключ
   * @param {string} [defaultValue=null] — Значение по умолчанию, если ключ не найден
   * @returns {string|null} — Строка из хранилища или defaultValue
   */
  function getStorage(key, defaultValue = null) {
    const value = localStorage.getItem(key);
    return value === null ? defaultValue : value;
  }

  /**
   * Записывает строку в localStorage
   * @param {string} key — Ключ
   * @param {string} value — Строка
   */
  function upsertStorage(key, value) {
    localStorage.setItem(key, value);
  }

  /**
   * Получает URL изображения текущей карты
   * @returns {string} — абсолютный URL изображения карты
   */
  function getCardImageUrl() {
    const imgElement = document.querySelector('.club-boost__image.anime-cards__item img');
    return new URL(imgElement.getAttribute('src'), location.origin).href;
  }
  /**
  * Отправляет уведомление в канал Telegram со списком пользователях, у которых есть нужная карта для взноса.
  * Сообщение отправляется только для новой карты.
  */
  function sendMessageToTelegramAboutDutyUsernames() {
    if (USERNAME_MAPPING === null || TELEGRAM_BOT_TOKEN == '' || TELEGRAM_CHAT_ID == '') return;

    const refreshBtn = document.querySelector('.button.button--primary.club__boost__refresh-btn');
    const currentBoostCardId = refreshBtn ? refreshBtn.dataset.cardId : null;

    const lastBoostCardId = getStorage(COOKIE_KEY_CURRENT_BOOST_CARD_ID);
    if (!refreshBtn || lastBoostCardId === currentBoostCardId) return;

    const users = Array.from(document.querySelectorAll('.club-boost__user'))
      .map(user => {
        // Извлекаем юзернейм из ссылки вида "/user/UserName/"
        const link = user.querySelector('a[href^="/user/"]');
        const href = link.getAttribute('href');
        return href.slice(6, -1);
      })
      .filter(Boolean);

    if (users.length === 0) return;

    const usernames = users.map(name => USERNAME_MAPPING[name] || `@${name}`);
    const result = `Карта <code>${currentBoostCardId}</code>: ${usernames.join(', ')}`;
    console.log(`Отправлено в телеграм: ${result}`);
    DLEPush.info(result, 'Отправлено в телеграм:');

    const imageUrl = getCardImageUrl();

    sendTelegramMessage(result, imageUrl);
    upsertStorage(COOKIE_KEY_CURRENT_BOOST_CARD_ID, currentBoostCardId);
  }

  /**
   * Отправляет сообщение и/или фото в Telegram
   * @param {string} text — текст сообщения
   * @param {string|null} imageUrl — (опц.) URL картинки
   */
  function sendTelegramMessage(text, imageUrl = null) {
    const endpoint = imageUrl ? 'sendPhoto' : 'sendMessage';
    const url = `${TELEGRAM_API_URL}/${endpoint}`;

    const payload = imageUrl
      ? { chat_id: TELEGRAM_CHAT_ID, photo: imageUrl, caption: text, parse_mode: 'HTML' }
      : { chat_id: TELEGRAM_CHAT_ID, text: text, parse_mode: 'HTML' };

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (!data.ok) console.error('Telegram error:', data);
    })
    .catch(err => console.error('Fetch error:', err));
  }

  /**
   * Следит за изменением карты и отправляет с задержкой уведомление в Telegram при её смене
   */
  function observeBoostOwners() {
    const target = document.querySelector('.club-boost--content');
    if (!target) return;

    let boostChangeTimeoutId = null;
    const observer = new MutationObserver(() => {
      console.log('Новая карта');

      // Очистка таймера для отмены отправки уведомления с предыдущей картой
      clearTimeout(boostChangeTimeoutId);

      const contributeBtn = document.querySelector('.button.button--primary.club__boost-btn')
      if (contributeBtn) {
        contributeBtn.click();
        console.info(`💳 Внесена карта: ${contributeBtn.dataset.cardId}. ${new Date().toLocaleTimeString()}.`);
        return;
      }

      boostChangeTimeoutId = setTimeout(() => {
        sendMessageToTelegramAboutDutyUsernames();
      }, DELAY_SEND_MESSAGE__SEC * 1000); // Установка задержки перед отправкой сообщения в Telegram
    });

    observer.observe(target, {
      childList: true,
      subtree: false,
    });
  }

  /**
   * Исправляет внешний CSS код
   */
  function fixStyle() {
    // Делает ссылки в уведомлениях чёрными, чтобы не сливались с фоном
    const style = document.createElement('style');
    style.textContent = `.DLEPush-notification a { color: #333 !important; }`;
    document.head.appendChild(style);
  }

  /**
   * Исправляет внешний JS код
   */
  function fixJs() {
    // Уменьшает задержку отображения предупреждений до 1 секунды
    DLEPush.warning = function (message, title, life) {
      return $.jGrowl(message, {
        header: title ? title : '',
        theme: 'push-warning',
        icon: `
          <svg width="28" height="28" fill="currentColor" viewBox="0 0 28 28">
            <path d="M16 21.484v-2.969c0-0.281-0.219-0.516-0.5-0.516h-3c-0.281 0-0.5 0.234-0.5 
            0.516v2.969c0 0.281 0.219 0.516 0.5 0.516h3c0.281 0 0.5-0.234 0.5-0.516zM15.969 
            15.641l0.281-7.172c0-0.094-0.047-0.219-0.156-0.297-0.094-0.078-0.234-0.172-0.375-
            0.172h-3.437c-0.141 0-0.281 0.094-0.375 0.172-0.109 0.078-0.156 0.234-0.156 
            0.328l0.266 7.141c0 0.203 0.234 0.359 0.531 0.359h2.891c0.281 0 0.516-0.156 
            0.531-0.359zM15.75 1.047l12 22c0.344 0.609 0.328 1.359-0.031 1.969s-1.016 
            0.984-1.719 0.984h-24c-0.703 0-1.359-0.375-1.719-0.984s-0.375-1.359-0.031-
            1.969l12-22c0.344-0.641 1.016-1.047 1.75-1.047s1.406 0.406 1.75 1.047z">
            </path>
          </svg>`.trim(),
        life: life ? life : 1000
      });
    };
  }

  /**
   * Основной цикл внесения вкладов (автоматизация)
   * @returns {Promise<void>}
   */
  async function handleBoost() {
    console.log('Внесение вкладов начато.');
    console.log(`Последняя карта: ${getStorage(COOKIE_KEY_CURRENT_BOOST_CARD_ID)}`);
    sendMessageToTelegramAboutDutyUsernames();

    do {
      const refreshBtn = document.querySelector('.button.button--primary.club__boost__refresh-btn')
      if (refreshBtn) {
        refreshBtn.click();
        console.log(`🌀 Обновлена карта: ${refreshBtn.dataset.cardId}.`);

        await sleep(DELAY_BOOST_AFTER_REFRESH_SEC);
      }

      const contributeBtn = document.querySelector('.button.button--primary.club__boost-btn');
      if (contributeBtn) {
        contributeBtn.click();
        console.info(`💳 Внесена карта: ${contributeBtn.dataset.cardId}. ${new Date().toLocaleTimeString()}.`);
        await sleep(DELAY_RREFRESH_SEC);
      }

      if (isBoostLimitReached()) {
        break;
      }

    } while(await sleep(DELAY_RREFRESH_SEC))
  }

  /**
   * Запуск автоматизации вкладов, ожидание времени, контроль лимита
   * @returns {Promise<void>}
   */
  async function runBoost() {
    console.log(`Начало работы автовкладов. ${new Date().toLocaleTimeString()}.`);

    reloadPageAfter5min()

    const secondsLeft = getUntil2101MinskSeconds();
    if (isBoostLimitReached() && secondsLeft > 0) {
      console.log(`До 21:01 по Мінску осталось ${formatTimeLeft(secondsLeft)}.`);
      await sleep(secondsLeft);
      location.reload();
      return;
    }

    if (USERNAME_MAPPING !== null) {
      DLEPush.info(`🔢 Число участников для уведомления в чате Telegram: ${Object.keys(USERNAME_MAPPING).length}.`);
    }

    fixStyle();
    fixJs();

    observeBoostOwners();

    await handleBoost();
    console.log('🏁 Внесение вкладов завершено.');
  }


  if (/\/clubs\/boost\//.test(window.location.pathname)) {
    runBoost();
  }


  /**
   * Добавляет кнопку "Добавить недостающие карты в список желаний" на странице с колодами карт
   */
  if (/\/user\/[^\/]+\/cards_progress\//.test(window.location.pathname)) {
    function injectCardsProgressButtons() {
      const userAnimeDivs = document.querySelectorAll('div.user-anime');

      userAnimeDivs.forEach(div => {
        const progressDiv = div.querySelector('div.user-anime__progress');
        const button = div.querySelector('button.update-my-progress');
        // Извлекаем ID из строки вида `UpdateMyProgress('123456')`
        const animeId = button?.getAttribute('onclick')?.match(/UpdateMyProgress\('(\d+)'\)/)?.[1] || '000000';

        progressDiv?.insertAdjacentHTML('afterend', `
          <div class="cards-progress card-anime-list__add-btn" data-anime="${animeId}" style="display:block">
            <i class="ass-cards"></i> Добавить недостающие в список желаний
          </div>
        `);
      });
    }

    injectCardsProgressButtons();
  }
})()
