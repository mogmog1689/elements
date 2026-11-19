/**
 * 元素マスター - クイズエンジン (quiz.js)
 * 問題の生成・正誤判定・選択肢生成を担当
 */

const Quiz = (() => {
  let elements = [];
  let mnemonics = {};
  let quizQueue = [];       // 出題予定の元素リスト
  let currentIndex = 0;
  let currentQuestion = null;
  let correctCount = 0;
  let wrongElements = [];
  let currentStreak = 0;
  let maxStreak = 0;

  // 設定
  let config = {
    mode: 'symbol',       // 'symbol' | 'sequence'
    category: 'all',      // 'all' | 'group' | 'period' | 'lanthanide' | 'actinide'
    subCategory: null,    // 族番号 or 周期番号
    order: 'asc',         // 'asc' | 'desc'
  };

  /**
   * データをロード
   */
  async function loadData() {
    try {
      const [elemRes, mnemRes] = await Promise.all([
        fetch('data/elements.json'),
        fetch('data/mnemonics.json'),
      ]);
      elements = await elemRes.json();
      mnemonics = await mnemRes.json();
      return true;
    } catch (err) {
      console.error('データの読み込みに失敗しました:', err);
      return false;
    }
  }

  /**
   * 全元素データを取得
   */
  function getAllElements() {
    return elements;
  }

  /**
   * 設定を更新
   */
  function setConfig(newConfig) {
    Object.assign(config, newConfig);
  }

  function getConfig() {
    return { ...config };
  }

  /**
   * フィルタ済みの元素リストを取得
   */
  function getFilteredElements() {
    let filtered = [...elements];

    switch (config.category) {
      case 'group':
        if (config.subCategory) {
          filtered = elements.filter(e => e.group === config.subCategory);
        }
        break;
      case 'period':
        if (config.subCategory) {
          filtered = elements.filter(e => e.period === config.subCategory);
        }
        break;
      case 'lanthanide':
        filtered = elements.filter(e => e.series === 'lanthanide');
        break;
      case 'actinide':
        filtered = elements.filter(e => e.series === 'actinide');
        break;
      case 'all':
      default:
        break;
    }

    // 原子番号でソート
    filtered.sort((a, b) =>
      config.order === 'asc' ? a.number - b.number : b.number - a.number
    );

    return filtered;
  }

  /**
   * クイズを開始
   */
  function start() {
    quizQueue = getFilteredElements();

    // 順番モードでは最初/最後の要素は「次/前」が無いので除外しない
    // ただし、1個しかない場合や、範囲端の要素については問題生成時に処理

    currentIndex = 0;
    correctCount = 0;
    wrongElements = [];
    currentStreak = 0;
    maxStreak = 0;

    return {
      totalQuestions: getTotalQuestions(),
    };
  }

  /**
   * 総問題数
   */
  function getTotalQuestions() {
    if (config.mode === 'sequence') {
      // 順番モードでは最後の要素には「次」がない（昇順）、最初の要素には「前」がない（降順）
      return Math.max(0, quizQueue.length - 1);
    }
    return quizQueue.length;
  }

  /**
   * 次の問題を生成
   * @returns {Object|null} question object or null (クイズ終了)
   */
  function nextQuestion() {
    const total = getTotalQuestions();
    if (currentIndex >= total) {
      return null; // クイズ終了
    }

    const element = quizQueue[currentIndex];

    if (config.mode === 'symbol') {
      currentQuestion = generateSymbolQuestion(element);
    } else {
      currentQuestion = generateSequenceQuestion(currentIndex);
    }

    currentQuestion.index = currentIndex;
    currentQuestion.total = total;

    return currentQuestion;
  }

  /**
   * 記号モードの問題を生成
   * 元素記号を見て元素名を答える
   */
  function generateSymbolQuestion(element) {
    const choices = generateChoices(element, 'name_ja');

    return {
      type: 'symbol',
      element,
      questionElement: element,
      correctAnswer: element.name_ja,
      choices,
      hint: findMnemonic(element),
    };
  }

  /**
   * 順番モードの問題を生成
   * 次（昇順）or 前（降順）の元素を答える
   */
  function generateSequenceQuestion(index) {
    const currentElement = quizQueue[index];
    const answerElement = quizQueue[index + 1];

    if (!answerElement) {
      return null;
    }

    const isAsc = config.order === 'asc';
    const questionText = isAsc
      ? 'この元素の次の元素は？'
      : 'この元素の前の元素は？';

    // 選択肢: 元素名（元素記号）の形式
    const choices = generateChoices(answerElement, 'display');

    return {
      type: 'sequence',
      element: answerElement,    // 正解の元素（解説表示用）
      questionElement: currentElement, // 問題に表示する元素
      questionText,
      correctAnswer: `${answerElement.name_ja}（${answerElement.symbol}）`,
      choices,
      hint: findMnemonic(currentElement),
    };
  }

  /**
   * 4択の選択肢を生成
   * @param {Object} correctElement 正解の元素
   * @param {string} displayType 'name_ja' | 'display'
   */
  function generateChoices(correctElement, displayType) {
    const formatChoice = (el) => {
      if (displayType === 'display') {
        return `${el.name_ja}（${el.symbol}）`;
      }
      return el.name_ja;
    };

    const correctAnswer = formatChoice(correctElement);

    // 同じカテゴリ/族/周期の元素から誤答を選ぶ（難易度向上）
    let pool = elements.filter(e => e.number !== correctElement.number);

    // 同じカテゴリの元素を優先的に選択肢に
    const sameCat = pool.filter(e => e.category === correctElement.category);
    const diffCat = pool.filter(e => e.category !== correctElement.category);

    // 誤答3つ: できれば同カテゴリから2つ、異カテゴリから1つ
    const wrongAnswers = [];
    const usedNumbers = new Set([correctElement.number]);

    // 同カテゴリからシャッフルして選ぶ
    const shuffledSame = shuffle([...sameCat]);
    const shuffledDiff = shuffle([...diffCat]);

    // まず同カテゴリから最大2つ
    for (const el of shuffledSame) {
      if (wrongAnswers.length >= 2) break;
      if (usedNumbers.has(el.number)) continue;
      const text = formatChoice(el);
      if (text === correctAnswer) continue;
      wrongAnswers.push(text);
      usedNumbers.add(el.number);
    }

    // 残りを異カテゴリから
    for (const el of shuffledDiff) {
      if (wrongAnswers.length >= 3) break;
      if (usedNumbers.has(el.number)) continue;
      const text = formatChoice(el);
      if (text === correctAnswer) continue;
      wrongAnswers.push(text);
      usedNumbers.add(el.number);
    }

    // 足りなければどこからでも
    if (wrongAnswers.length < 3) {
      for (const el of shuffle([...pool])) {
        if (wrongAnswers.length >= 3) break;
        if (usedNumbers.has(el.number)) continue;
        const text = formatChoice(el);
        if (text === correctAnswer) continue;
        wrongAnswers.push(text);
        usedNumbers.add(el.number);
      }
    }

    // 4択に正解を混ぜてシャッフル
    const choices = shuffle([correctAnswer, ...wrongAnswers]);

    return choices;
  }

  /**
   * 回答を判定
   * @param {string} selected 選んだ選択肢のテキスト
   * @returns {Object} { isCorrect, correctAnswer, element }
   */
  function checkAnswer(selected) {
    const isCorrect = selected === currentQuestion.correctAnswer;

    if (isCorrect) {
      correctCount++;
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
      wrongElements.push({
        number: currentQuestion.element.number,
        symbol: currentQuestion.element.symbol,
        name_ja: currentQuestion.element.name_ja,
      });
    }

    // 元素別記録
    Storage.recordAnswer(currentQuestion.element.number, isCorrect);

    currentIndex++;

    return {
      isCorrect,
      correctAnswer: currentQuestion.correctAnswer,
      element: currentQuestion.element,
      streak: currentStreak,
    };
  }

  /**
   * クイズの結果サマリーを取得
   */
  function getResult() {
    return {
      mode: config.mode,
      category: config.category,
      subCategory: config.subCategory,
      order: config.order,
      totalQuestions: getTotalQuestions(),
      correctCount,
      wrongElements,
      maxStreak,
      rate: getTotalQuestions() > 0
        ? Math.round((correctCount / getTotalQuestions()) * 100)
        : 0,
    };
  }

  /**
   * 語呂合わせを検索（出題設定（族別・周期別・系列別・全元素）に応じたものを返す）
   */
  function findMnemonic(element) {
    if (!mnemonics) return null;

    // 1. 族別の出題の場合 -> 該当族の語呂合わせを最優先
    if (config.category === 'group') {
      const gKey = String(config.subCategory || element.group);
      if (mnemonics.groups && mnemonics.groups[gKey]) {
        return {
          typeLabel: `${gKey}族の語呂合わせ`,
          ...mnemonics.groups[gKey]
        };
      }
    }

    // 2. 周期別の出題の場合 -> 該当周期の語呂合わせを最優先
    if (config.category === 'period') {
      const pKey = String(config.subCategory || element.period);
      if (mnemonics.periods && mnemonics.periods[pKey]) {
        return {
          typeLabel: `第${pKey}周期の語呂合わせ`,
          ...mnemonics.periods[pKey]
        };
      }
    }

    // 3. ランタノイド系列の場合
    if (config.category === 'lanthanide' || (element.series === 'lanthanide' && config.category !== 'group' && config.category !== 'period')) {
      if (mnemonics.series && mnemonics.series['lanthanide']) {
        return {
          typeLabel: 'ランタノイド系列の語呂合わせ',
          ...mnemonics.series['lanthanide']
        };
      }
    }

    // 4. アクチノイド系列の場合
    if (config.category === 'actinide' || (element.series === 'actinide' && config.category !== 'group' && config.category !== 'period')) {
      if (mnemonics.series && mnemonics.series['actinide']) {
        return {
          typeLabel: 'アクチノイド系列の語呂合わせ',
          ...mnemonics.series['actinide']
        };
      }
    }

    // 5. 全元素または未指定の場合:
    // 第1〜第3周期(原子番号1〜18)は有名な「水兵リーベ僕の船…」または周期語呂が覚えやすいため周期別を優先、
    // それ以降は族別または系列別を探す
    if (element.period <= 3 && mnemonics.periods && mnemonics.periods[String(element.period)]) {
      return {
        typeLabel: `第${element.period}周期の語呂合わせ`,
        ...mnemonics.periods[String(element.period)]
      };
    }

    if (element.series && mnemonics.series && mnemonics.series[element.series]) {
      return {
        typeLabel: element.series === 'lanthanide' ? 'ランタノイド系列' : 'アクチノイド系列',
        ...mnemonics.series[element.series]
      };
    }

    const groupKey = String(element.group);
    if (mnemonics.groups && mnemonics.groups[groupKey]) {
      return {
        typeLabel: `${groupKey}族の語呂合わせ`,
        ...mnemonics.groups[groupKey]
      };
    }

    const periodKey = String(element.period);
    if (mnemonics.periods && mnemonics.periods[periodKey]) {
      return {
        typeLabel: `第${periodKey}周期の語呂合わせ`,
        ...mnemonics.periods[periodKey]
      };
    }

    return null;
  }

  /**
   * カテゴリの表示名を取得
   */
  function getCategoryDisplayName() {
    switch (config.category) {
      case 'all': return '全元素';
      case 'group': return `第${config.subCategory}族`;
      case 'period': return `第${config.subCategory}周期`;
      case 'lanthanide': return 'ランタノイド系列';
      case 'actinide': return 'アクチノイド系列';
      default: return '';
    }
  }

  /**
   * カテゴリ色を取得
   */
  function getCategoryColor(category) {
    const colors = {
      'alkali-metal': '#ff6b6b',
      'alkaline-earth-metal': '#ffa07a',
      'transition-metal': '#69b4ff',
      'post-transition-metal': '#7fb3d3',
      'metalloid': '#98d8c8',
      'nonmetal': '#82ca9d',
      'halogen': '#dda0dd',
      'noble-gas': '#c9b1ff',
      'lanthanide': '#ffb347',
      'actinide': '#ff8c94',
    };
    return colors[category] || '#69b4ff';
  }

  /**
   * カテゴリの日本語名
   */
  function getCategoryNameJa(category) {
    const names = {
      'alkali-metal': 'アルカリ金属',
      'alkaline-earth-metal': 'アルカリ土類金属',
      'transition-metal': '遷移金属',
      'post-transition-metal': '卑金属',
      'metalloid': '半金属',
      'nonmetal': '非金属',
      'halogen': 'ハロゲン',
      'noble-gas': '希ガス',
      'lanthanide': 'ランタノイド',
      'actinide': 'アクチノイド',
    };
    return names[category] || category;
  }

  /**
   * 現在のストリーク
   */
  function getCurrentStreak() {
    return currentStreak;
  }

  // ユーティリティ: Fisher-Yates シャッフル
  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  return {
    loadData,
    getAllElements,
    setConfig,
    getConfig,
    getFilteredElements,
    start,
    getTotalQuestions,
    nextQuestion,
    checkAnswer,
    getResult,
    findMnemonic,
    getCategoryDisplayName,
    getCategoryColor,
    getCategoryNameJa,
    getCurrentStreak,
  };
})();
