/**
 * 元素マスター - 学習記録管理 (storage.js)
 * localStorage を使った学習データの永続化
 */

const Storage = (() => {
  const KEYS = {
    HISTORY: 'elemaster_history',       // クイズ履歴
    ELEMENT_STATS: 'elemaster_stats',   // 元素別の正答統計
    BEST_STREAK: 'elemaster_streak',    // 最高連続正解数
  };

  /**
   * 初期化（データが無ければ作成）
   */
  function init() {
    if (!localStorage.getItem(KEYS.HISTORY)) {
      localStorage.setItem(KEYS.HISTORY, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.ELEMENT_STATS)) {
      localStorage.setItem(KEYS.ELEMENT_STATS, JSON.stringify({}));
    }
    if (!localStorage.getItem(KEYS.BEST_STREAK)) {
      localStorage.setItem(KEYS.BEST_STREAK, '0');
    }
  }

  /**
   * クイズ結果を記録
   * @param {Object} result
   *   - mode: 'symbol' | 'sequence'
   *   - category: string (出題範囲)
   *   - subCategory: string | null
   *   - order: 'asc' | 'desc'
   *   - totalQuestions: number
   *   - correctCount: number
   *   - wrongElements: [{number, symbol, name_ja}]
   *   - maxStreak: number
   */
  function saveQuizResult(result) {
    const history = getHistory();
    const entry = {
      id: Date.now(),
      date: new Date().toISOString(),
      mode: result.mode,
      category: result.category,
      subCategory: result.subCategory || null,
      order: result.order,
      totalQuestions: result.totalQuestions,
      correctCount: result.correctCount,
      wrongElements: result.wrongElements.map(e => ({
        number: e.number,
        symbol: e.symbol,
        name_ja: e.name_ja,
      })),
      maxStreak: result.maxStreak,
      rate: result.totalQuestions > 0
        ? Math.round((result.correctCount / result.totalQuestions) * 100)
        : 0,
    };

    history.unshift(entry); // 最新が先頭
    // 最大100件保存
    if (history.length > 100) {
      history.length = 100;
    }
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));

    // 最高ストリーク更新
    const currentBest = getBestStreak();
    if (result.maxStreak > currentBest) {
      localStorage.setItem(KEYS.BEST_STREAK, String(result.maxStreak));
    }
  }

  /**
   * 個別の回答を記録（元素ごとの正答率追跡用）
   * @param {number} elementNumber 原子番号
   * @param {boolean} isCorrect 正解かどうか
   */
  function recordAnswer(elementNumber, isCorrect) {
    const stats = getElementStats();
    if (!stats[elementNumber]) {
      stats[elementNumber] = { correct: 0, wrong: 0 };
    }
    if (isCorrect) {
      stats[elementNumber].correct++;
    } else {
      stats[elementNumber].wrong++;
    }
    localStorage.setItem(KEYS.ELEMENT_STATS, JSON.stringify(stats));
  }

  /**
   * クイズ履歴を取得
   * @returns {Array}
   */
  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.HISTORY)) || [];
    } catch {
      return [];
    }
  }

  /**
   * 元素別の統計を取得
   * @returns {Object} { [atomicNumber]: { correct, wrong } }
   */
  function getElementStats() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.ELEMENT_STATS)) || {};
    } catch {
      return {};
    }
  }

  /**
   * 最高連続正解数を取得
   */
  function getBestStreak() {
    return parseInt(localStorage.getItem(KEYS.BEST_STREAK) || '0', 10);
  }

  /**
   * 総合統計を計算
   */
  function getOverallStats() {
    const history = getHistory();
    const totalQuizzes = history.length;
    const totalCorrect = history.reduce((sum, h) => sum + h.correctCount, 0);
    const totalQuestions = history.reduce((sum, h) => sum + h.totalQuestions, 0);
    const avgRate = totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;
    const bestStreak = getBestStreak();

    return { totalQuizzes, totalCorrect, totalQuestions, avgRate, bestStreak };
  }

  /**
   * 苦手な元素TOP10を取得
   * @param {Array} elements 全元素データ
   * @returns {Array} [{element, correct, wrong, rate}]
   */
  function getWeakElements(elements) {
    const stats = getElementStats();
    const results = [];

    for (const [numStr, data] of Object.entries(stats)) {
      const total = data.correct + data.wrong;
      if (total === 0) continue;
      const rate = Math.round((data.correct / total) * 100);
      const element = elements.find(e => e.number === parseInt(numStr, 10));
      if (element) {
        results.push({
          element,
          correct: data.correct,
          wrong: data.wrong,
          total,
          rate,
        });
      }
    }

    // 正答率が低い順にソート（同率なら出題数が多い方を優先）
    results.sort((a, b) => a.rate - b.rate || b.total - a.total);

    return results.slice(0, 10);
  }

  /**
   * 全記録をクリア
   */
  function clearAll() {
    localStorage.removeItem(KEYS.HISTORY);
    localStorage.removeItem(KEYS.ELEMENT_STATS);
    localStorage.removeItem(KEYS.BEST_STREAK);
    init();
  }

  return {
    init,
    saveQuizResult,
    recordAnswer,
    getHistory,
    getElementStats,
    getBestStreak,
    getOverallStats,
    getWeakElements,
    clearAll,
  };
})();
