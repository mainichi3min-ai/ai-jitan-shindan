// アプリ設定
const CONFIG = {
  noteUrl: "https://lit.link/mainichi3min_ai",
  noteLabel: "無料プロンプト集・収支シートの受け取りはこちら（リンク集）",
  siteUrl: "https://takaom0924-sys.github.io/ai-jitan-shindan/",
  shareText: "私のAI時短診断の結果はこちら"
};

// URLはここを書き換える（アフィリエイトURLなど）
const TOOLS = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/', category: 'writing', catch: '文章作成やアイデア出しに強い汎用AIチャット', freeNote: '無料枠で十分に使える基本機能が利用可能' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai/', category: 'writing', catch: '自然な日本語と長文要約に定評のあるAI', freeNote: '無料プランで一定のメッセージ数が利用可能' },
  { id: 'gemini', name: 'Google Gemini', url: 'https://gemini.google.com/', category: 'research', catch: 'Google連携で情報収集とリサーチに強い', freeNote: '無料アカウントで基本機能が利用可能' },
  { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/', category: 'research', catch: '出典付きで調べものが速いAI検索エンジン', freeNote: '無料枠で検索と要約が利用可能' },
  { id: 'notebooklm', name: 'NotebookLM', url: 'https://notebooklm.google.com/', category: 'docs', catch: '手持ちの資料をもとに要約や質問ができるAI', freeNote: '無料枠でノートブック作成と要約が利用可能' },
  { id: 'gamma', name: 'Gamma', url: 'https://gamma.app/', category: 'slides', catch: 'AIがスライド構成とデザインを自動作成', freeNote: '無料プランではクレジット制でスライド作成が可能' },
  { id: 'canva', name: 'Canva', url: 'https://www.canva.com/', category: 'slides', catch: '豊富なテンプレートでAIデザインが使える', freeNote: '無料プランで基本テンプレートとAI機能が一部利用可能' },
  { id: 'copilot', name: 'Microsoft Copilot', url: 'https://copilot.microsoft.com/', category: 'data', catch: 'Microsoftの汎用AIチャット。文章作成や要約、表の相談にも使える', freeNote: '無料アカウントでチャットが利用可能' }
];

const QUESTIONS = [
  {
    id: 'q1',
    text: '職種を教えてください',
    choices: [
      { label: '事務・総務', scores: { cat: { writing: 1, data: 1 } } },
      { label: '営業・接客', scores: { cat: { writing: 1, research: 1 } } },
      { label: '企画・マーケティング', scores: { cat: { slides: 1, research: 1 } } },
      { label: 'エンジニア・専門職', scores: { cat: { docs: 1, data: 1 } } },
      { label: '自営業・フリーランス', scores: { cat: { writing: 1, slides: 1 } } }
    ]
  },
  {
    id: 'q2',
    text: '一番時間を使っている作業は？',
    choices: [
      { label: 'メール・文章作成', scores: { cat: { writing: 3 }, weeklyHours: 5 } },
      { label: '資料・スライド作成', scores: { cat: { slides: 3 }, weeklyHours: 6 } },
      { label: '調べもの・情報収集', scores: { cat: { research: 3 }, weeklyHours: 4 } },
      { label: '会議・議事録', scores: { cat: { docs: 2, writing: 1 }, weeklyHours: 3 } },
      { label: 'データ入力・集計', scores: { cat: { data: 3 }, weeklyHours: 5 } }
    ]
  },
  {
    id: 'q3',
    text: 'AIツールの利用経験は？',
    choices: [
      { label: 'ほぼ使ったことがない', scores: { cat: {}, rate: 0.3 } },
      { label: 'たまに使う', scores: { cat: {}, rate: 0.4 } },
      { label: 'ほぼ毎日使う', scores: { cat: {}, rate: 0.5 } }
    ]
  },
  {
    id: 'q4',
    text: 'ツール選びで重視するのは？',
    choices: [
      { label: 'とにかく簡単・すぐ使える', scores: { tool: { chatgpt: 2, copilot: 2 } } },
      { label: '無料で高機能', scores: { tool: { gemini: 2, perplexity: 2 } } },
      { label: '日本語が自然', scores: { tool: { claude: 2, chatgpt: 1 } } },
      { label: '調べものが速い', scores: { tool: { perplexity: 2, gemini: 1 } } }
    ]
  }
];

let currentIndex = 0;
let answers = {};
let sessionWeeklyHours = 0;
let sessionRate = 1;

const $ = (selector) => document.querySelector(selector);

const showScreen = (screenId) => {
  const ids = ['screen-start', 'screen-quiz', 'screen-loading', 'screen-result'];
  ids.forEach((id) => {
    const el = $(`#${id}`);
    if (el) el.classList.add('hidden');
  });
  const target = $(`#${screenId}`);
  if (target) target.classList.remove('hidden');
};

const renderQuestion = () => {
  const q = QUESTIONS[currentIndex];
  if (!q) return;

  const progressEl = $('#q-progress');
  const barEl = $('#progress-bar');
  const textEl = $('#q-text');
  const choicesEl = $('#q-choices');

  if (progressEl) progressEl.textContent = `Q${currentIndex + 1} / ${QUESTIONS.length}`;
  if (barEl) barEl.style.width = `${(currentIndex / QUESTIONS.length) * 100}%`;
  if (textEl) textEl.textContent = q.text;
  if (choicesEl) choicesEl.innerHTML = '';

  q.choices.forEach((choice, choiceIndex) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = choice.label;
    btn.classList.add('choice-btn');
    btn.addEventListener('click', () => {
      answers[q.id] = choiceIndex;
      const scores = choice.scores || {};
      if (scores.weeklyHours !== undefined) sessionWeeklyHours = scores.weeklyHours;
      if (scores.rate !== undefined) sessionRate = scores.rate;

      setTimeout(() => {
        if (currentIndex < QUESTIONS.length - 1) {
          currentIndex += 1;
          renderQuestion();
        } else {
          showScreen('screen-loading');
          setTimeout(() => {
            showResult();
          }, 1000);
        }
      }, 250);
    });
    if (choicesEl) choicesEl.appendChild(btn);
  });
};

const calculateResult = () => {
  const categoryPoints = { writing: 0, research: 0, docs: 0, slides: 0, meeting: 0, data: 0 };
  const toolPoints = {};

  QUESTIONS.forEach((q) => {
    const choiceIndex = answers[q.id];
    if (choiceIndex === undefined) return;
    const choice = q.choices[choiceIndex];
    const scores = choice.scores || {};

    if (scores.cat) {
      Object.keys(scores.cat).forEach((cat) => {
        categoryPoints[cat] = (categoryPoints[cat] || 0) + scores.cat[cat];
      });
    }
    if (scores.tool) {
      Object.keys(scores.tool).forEach((toolId) => {
        toolPoints[toolId] = (toolPoints[toolId] || 0) + scores.tool[toolId];
      });
    }
  });

  const scoredTools = TOOLS.map((tool, index) => {
    const score = (categoryPoints[tool.category] || 0) + (toolPoints[tool.id] || 0);
    return { tool, score, index };
  });

  scoredTools.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.index - b.index;
  });

  const weekly = sessionWeeklyHours * sessionRate;
  const monthly = weekly * 4.33;

  return {
    topTools: scoredTools.slice(0, 3).map((item) => item.tool),
    weeklyHours: Math.round(weekly * 10) / 10,
    monthHours: Math.round(monthly * 10) / 10
  };
};

const showResult = () => {
  const result = calculateResult();

  const weekEl = $('#result-hours-week');
  const monthEl = $('#result-hours-month');
  const toolsEl = $('#result-tools');

  if (weekEl) weekEl.textContent = String(result.weeklyHours);
  if (monthEl) monthEl.textContent = String(result.monthHours);
  if (toolsEl) toolsEl.innerHTML = '';

  result.topTools.forEach((tool) => {
    const card = document.createElement('div');
    card.classList.add('tool-card');

    const nameEl = document.createElement('h3');
    nameEl.textContent = tool.name;
    card.appendChild(nameEl);

    const catchEl = document.createElement('p');
    catchEl.textContent = tool.catch;
    card.appendChild(catchEl);

    const freeEl = document.createElement('p');
    freeEl.textContent = tool.freeNote;
    card.appendChild(freeEl);

    const link = document.createElement('a');
    link.href = tool.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = '公式サイトを見る';
    link.classList.add('btn');
    card.appendChild(link);

    toolsEl.appendChild(card);
  });

  const btnNote = $('#btn-note');
  if (btnNote) {
    btnNote.href = CONFIG.noteUrl;
    btnNote.target = '_blank';
    btnNote.rel = 'noopener';
    btnNote.textContent = CONFIG.noteLabel;
  }

  const recommendName = result.topTools[0] ? result.topTools[0].name : '';
  let shareText = `AI時短診断で私におすすめのツールは${recommendName}でした！月約${result.monthHours}時間の時短見込み`;
  if (CONFIG.siteUrl) {
    shareText += ` ${CONFIG.siteUrl}`;
  }

  const btnShareX = $('#btn-share-x');
  if (btnShareX) {
    btnShareX.href = 'https://x.com/intent/post?text=' + encodeURIComponent(shareText);
    btnShareX.target = '_blank';
    btnShareX.rel = 'noopener';
  }

  const btnShareThreads = $('#btn-share-threads');
  if (btnShareThreads) {
    btnShareThreads.href = 'https://www.threads.net/intent/post?text=' + encodeURIComponent(shareText);
    btnShareThreads.target = '_blank';
    btnShareThreads.rel = 'noopener';
  }

  showScreen('screen-result');
};

const init = () => {
  const btnStart = $('#btn-start');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      currentIndex = 0;
      answers = {};
      sessionWeeklyHours = 0;
      sessionRate = 1;
      showScreen('screen-quiz');
      renderQuestion();
    });
  }

  const btnRetry = $('#btn-retry');
  if (btnRetry) {
    btnRetry.addEventListener('click', () => {
      currentIndex = 0;
      answers = {};
      sessionWeeklyHours = 0;
      sessionRate = 1;
      showScreen('screen-start');
    });
  }
};

document.addEventListener('DOMContentLoaded', init);