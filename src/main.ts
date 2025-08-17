// ========================= News App  ==========================

type Article = {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  source: { id: string | null; name: string };
  publishedAt: string;
};

type NewsResponse = {
  status: "ok" | "error";
  totalResults?: number;
  articles?: Article[];
  code?: string;
  message?: string;
};

// ==== Настройки API =======================================================
const API = "https://newsapi.org/v2/everything";
const API_KEY =
  (import.meta as any).env?.VITE_NEWS_API_KEY // обращение к переменной окружения, откуда берётся ключ (из файла .env).
  || "PASTE_YOUR_KEY_HERE"; //  запасное значение (Если не настроен env) - "PASTE_YOUR_KEY_HERE"


// ==== DOM ================================================================
const form = document.getElementById("searchForm") as HTMLFormElement;
const input = document.getElementById("query") as HTMLInputElement;
const langSel = document.getElementById("language") as HTMLSelectElement;
const sortSel = document.getElementById("sort") as HTMLSelectElement;
const statusEl = document.getElementById("status") as HTMLDivElement;
const results = document.getElementById("results") as HTMLDivElement;

// ---- ЯЗЫКИ NewsAPI: наполняем <select id="language"> из массива ----------
const LANGUAGES: Array<{ code: string; label: string }> = [
  { code: "ar", label: "Arabisch" },
  { code: "de", label: "Deutsch" },
  { code: "en", label: "Englisch" },
  { code: "es", label: "Spanisch" },
  { code: "fr", label: "Französisch" },
  { code: "he", label: "Hebräisch" },
  { code: "it", label: "Italienisch" },
  { code: "nl", label: "Niederländisch" },
  { code: "no", label: "Norwegisch" },
  { code: "pt", label: "Portugiesisch" },
  { code: "ru", label: "Russisch" },
  { code: "sv", label: "Schwedisch" },
  { code: "ud", label: "Urdu" }, // именно `ud` в NewsAPI
  { code: "zh", label: "Chinesisch" },
];

// Функция Заполняет <select id="language"> вариантами языков NewsAPI.
function populateLanguages(selectEl: HTMLSelectElement, defaultCode = "de") {
  selectEl.innerHTML = "";
  const frag = document.createDocumentFragment();
  LANGUAGES.forEach(({ code, label }) => {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = label;
    if (code === defaultCode) opt.selected = true;
    frag.append(opt);
  });
  selectEl.append(frag);
}

// вызвать сразу
populateLanguages(langSel, "de");

// Фолбэк картинка. Если не приходит нормальная картинка с API
const NO_IMAGE = "https://via.placeholder.com/600x360?text=No+Image";

// Небольшой хелпер: обрезать описание и показать длину в символах
// Обрезает длинный текст до указанного лимита и добавляет многоточие
function clip(text: string, limit = 180): string {
  if (!text) return "";
  if (text.length <= limit) return text;
  return text.slice(0, limit).trim() + " …";
}

// Рендер карточек
// Отрисовывает список статей как карточки и выводит в <section id="results">
function renderArticles(items: Article[]) {
  if (!items.length) {
    results.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#666;">Keine Ergebnisse.</p>`;
    return;
  }

  results.innerHTML = "";
  items.forEach((a) => {
    const card = document.createElement("article");
    card.className = "card";

    const h3 = document.createElement("h3");
    h3.textContent = a.title;

    const p = document.createElement("p");
    const desc = a.description ?? "";
    p.textContent = `${clip(desc, 160)}  [~${desc.length} chars]`;

    const img = document.createElement("img");
    img.src = a.urlToImage || NO_IMAGE;
    img.alt = a.title;
    img.onerror = () => { if (img.src !== NO_IMAGE) img.src = NO_IMAGE; };

    const link = document.createElement("a");
    link.href = a.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Zum Artikel";

    card.append(h3, p, img, link);
    results.append(card);
  });
}

// Вспомогательно: сообщить статус пользователю
function setStatus(msg: string) {
  statusEl.textContent = msg;
}

// Выполнить запрос к NewsAPI
async function fetchNews(q: string, language: string, sortBy: string) {
  // NewsAPI требует параметр q; если пусто — подставим безопасное
  const query = q.trim() || "Berlin";

  const params = new URLSearchParams({
    q: query,
    language,          // de | en | es | fr | it | ru ...
    sortBy,            // relevancy | popularity | publishedAt
    pageSize: "12"     // сколько статей вернуть
  });

  const url = `${API}?${params.toString()}`;

  setStatus("Lade Daten …");

  // Отправляем запрос к NewsAPI с ключом авторизации в заголовке
  const res = await fetch(url, {
    headers: { "X-Api-Key": API_KEY } // ключ лучше отправлять в заголовке
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  //  Преобразуем ответ в объект JS и проверяем по типу NewsResponse
  const data: NewsResponse = await res.json();

  if (data.status !== "ok" || !data.articles) {
    throw new Error(data.message || "NewsAPI error");
  }

  setStatus("");          // очистить статус
  renderArticles(data.articles);
}

// Обработчик формы
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await fetchNews(input.value, langSel.value, sortSel.value);
  } catch (err) {
    console.error(err);
    setStatus(String(err));
    results.innerHTML = "";
  }
});

// Первый запуск с дефолтами
fetchNews("Berlin", langSel.value, sortSel.value).catch(err => {
  console.error(err);
  setStatus(String(err));
});
