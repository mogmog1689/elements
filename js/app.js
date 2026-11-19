/**
 * 元素マスター - アプリケーション制御 (app.js)
 * UI制御、画面遷移、イベントリスナー
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const screens = {
    splash: document.getElementById('splash-screen'),
    home: document.getElementById('home-screen'),
    quiz: document.getElementById('quiz-screen'),
    result: document.getElementById('result-screen'),
    summary: document.getElementById('summary-screen'),
    records: document.getElementById('records-screen')
  };

  // Header & Buttons
  const btnRecords = document.getElementById('btn-records');
  const btnRecordsBack = document.getElementById('btn-records-back');
  const btnClearRecords = document.getElementById('btn-clear-records');
  const btnStart = document.getElementById('btn-start');
  const btnQuit = document.getElementById('btn-quit');
  const btnHint = document.getElementById('btn-hint');
  const btnNext = document.getElementById('btn-next');
  const btnRetry = document.getElementById('btn-retry');
  const btnHome = document.getElementById('btn-home');

  // Mode & Categories
  const modeCards = document.querySelectorAll('.mode-card');
  const categoryBtns = document.querySelectorAll('.category-btn');
  const orderBtns = document.querySelectorAll('.order-btn');
  const subCategorySection = document.getElementById('sub-category-section');
  const subCategoryTitle = document.getElementById('sub-category-title');
  const subCategoryGrid = document.getElementById('sub-category-grid');
  const questionCountLabel = document.getElementById('question-count');

  // Quiz Screen Elements
  const quizCurrent = document.getElementById('quiz-current');
  const quizTotal = document.getElementById('quiz-total');
  const streakBadge = document.getElementById('streak-badge');
  const streakCount = document.getElementById('streak-count');
  const progressBar = document.getElementById('progress-bar');
  const hintArea = document.getElementById('hint-area');
  const hintLabel = document.querySelector('.hint-label');
  const hintText = document.getElementById('hint-text');
  const hintExplanation = document.getElementById('hint-explanation');
  const choiceBtns = document.querySelectorAll('.choice-btn');

  // Previous Question Result Area Elements (Shown in Quiz Screen)
  const prevResultArea = document.getElementById('prev-result-area');
  const prevResultBadge = document.getElementById('prev-result-badge');
  const prevNumber = document.getElementById('prev-number');
  const prevSymbol = document.getElementById('prev-symbol');
  const prevName = document.getElementById('prev-name');
  const prevImage = document.getElementById('prev-image');
  const prevPlaceholder = document.getElementById('prev-image-placeholder');
  const prevPlaceholderSymbol = document.getElementById('prev-placeholder-symbol');
  const prevDescription = document.getElementById('prev-description');
  const prevUses = document.getElementById('prev-uses');
  const prevPrice = document.getElementById('prev-price');

  // Question displays
  const symbolQuestion = document.getElementById('symbol-question');
  const qNumber = document.getElementById('q-number');
  const qSymbol = document.getElementById('q-symbol');
  const qCategory = document.getElementById('q-category');
  const qImage = document.getElementById('q-image');
  const qPlaceholder = document.getElementById('q-image-placeholder');
  const qPlaceholderSymbol = document.getElementById('q-placeholder-symbol');

  const sequenceQuestion = document.getElementById('sequence-question');
  const sqNumber = document.getElementById('sq-number');
  const sqSymbol = document.getElementById('sq-symbol');
  const sqName = document.getElementById('sq-name');
  const sqImage = document.getElementById('sq-image');
  const sqPlaceholder = document.getElementById('sq-image-placeholder');
  const sqPlaceholderSymbol = document.getElementById('sq-placeholder-symbol');
  const sequenceQuestionText = document.getElementById('sequence-question-text');

  // Result Screen Elements
  const resultHeader = document.getElementById('result-header');
  const resultIcon = document.getElementById('result-icon');
  const resultTitle = document.getElementById('result-title');
  const rNumber = document.getElementById('r-number');
  const rSymbol = document.getElementById('r-symbol');
  const rName = document.getElementById('r-name');
  const rImage = document.getElementById('r-image');
  const rPlaceholder = document.getElementById('r-image-placeholder');
  const rPlaceholderSymbol = document.getElementById('r-placeholder-symbol');
  const rDescription = document.getElementById('r-description');
  const rUses = document.getElementById('r-uses');
  const rPrice = document.getElementById('r-price');

  // Summary Elements
  const scorePercent = document.getElementById('score-percent');
  const scoreRingFill = document.getElementById('score-ring-fill');
  const statCorrect = document.getElementById('stat-correct');
  const statWrong = document.getElementById('stat-wrong');
  const statStreak = document.getElementById('stat-streak');
  const wrongElementsSection = document.getElementById('wrong-elements-section');
  const wrongElementsList = document.getElementById('wrong-elements-list');

  // Dialog Elements
  const confirmDialog = document.getElementById('confirm-dialog');
  const dialogMessage = document.getElementById('dialog-message');
  const dialogCancel = document.getElementById('dialog-cancel');
  const dialogConfirm = document.getElementById('dialog-confirm');
  let dialogCallback = null;

  // Initialize Storage & Load Quiz Data
  Storage.init();
  const loaded = await Quiz.loadData();
  if (!loaded) {
    alert('データ読み込みに失敗しました。再読み込みしてください。');
  }

  // Switch active screen
  function showScreen(screenKey) {
    Object.values(screens).forEach(s => {
      if (s) s.classList.remove('active');
    });
    if (screens[screenKey]) {
      screens[screenKey].classList.add('active');
    }
  }

  // Hide splash after 1.2s
  setTimeout(() => {
    showScreen('home');
    updateQuestionCountLabel();
  }, 1200);

  // Update Question Count Display on Home Screen
  function updateQuestionCountLabel() {
    const total = Quiz.getFilteredElements().length;
    const currentMode = Quiz.getConfig().mode;
    const count = currentMode === 'sequence' ? Math.max(0, total - 1) : total;
    questionCountLabel.textContent = `（全${count}問）`;
  }

  // Mode Selection
  modeCards.forEach(card => {
    card.addEventListener('click', () => {
      modeCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      Quiz.setConfig({ mode: card.dataset.mode });
      updateQuestionCountLabel();
    });
  });

  // Category Selection
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.category;
      
      if (cat === 'group') {
        setupSubCategoryGrid('group', 18, 1);
        Quiz.setConfig({ category: 'group', subCategory: 1 });
      } else if (cat === 'period') {
        setupSubCategoryGrid('period', 7, 1);
        Quiz.setConfig({ category: 'period', subCategory: 1 });
      } else {
        subCategorySection.classList.add('hidden');
        Quiz.setConfig({ category: cat, subCategory: null });
      }
      updateQuestionCountLabel();
    });
  });

  function setupSubCategoryGrid(type, count, defaultVal) {
    subCategorySection.classList.remove('hidden');
    subCategoryTitle.textContent = type === 'group' ? '族を選択 (1〜18)' : '周期を選択 (1〜7)';
    subCategoryGrid.innerHTML = '';

    for (let i = 1; i <= count; i++) {
      const b = document.createElement('button');
      b.className = `sub-cat-btn ${i === defaultVal ? 'active' : ''}`;
      b.textContent = `${i}${type === 'group' ? '族' : '周'}`;
      b.addEventListener('click', () => {
        document.querySelectorAll('.sub-cat-btn').forEach(el => el.classList.remove('active'));
        b.classList.add('active');
        Quiz.setConfig({ subCategory: i });
        updateQuestionCountLabel();
      });
      subCategoryGrid.appendChild(b);
    }
  }

  // Order Selection (Asc / Desc)
  orderBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      orderBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Quiz.setConfig({ order: btn.dataset.order });
      updateQuestionCountLabel();
    });
  });

  // Dialog Helper
  function openConfirm(msg, onOk) {
    dialogMessage.textContent = msg;
    dialogCallback = onOk;
    confirmDialog.classList.remove('hidden');
  }
  dialogCancel.addEventListener('click', () => {
    confirmDialog.classList.add('hidden');
    dialogCallback = null;
  });
  dialogConfirm.addEventListener('click', () => {
    confirmDialog.classList.add('hidden');
    if (dialogCallback) dialogCallback();
    dialogCallback = null;
  });

  // Start Quiz
  btnStart.addEventListener('click', () => {
    const info = Quiz.start();
    if (info.totalQuestions === 0) {
      alert('選択した条件に該当する問題がありません。出題範囲を変更してください。');
      return;
    }
    prevResultArea.classList.add('hidden');
    showScreen('quiz');
    displayNextQuestion();
  });

  // Display Next Question
  function displayNextQuestion() {
    const q = Quiz.nextQuestion();
    if (!q) {
      finishQuiz();
      return;
    }

    // Reset hints & choice states
    hintArea.classList.add('hidden');
    btnHint.style.display = q.hint ? 'flex' : 'none';
    if (q.hint) {
      if (hintLabel) {
        hintLabel.textContent = q.hint.typeLabel ? `語呂合わせ（${q.hint.typeLabel}）` : '語呂合わせ';
      }
      hintText.textContent = q.hint.mnemonic || '';
      hintExplanation.textContent = q.hint.explanation || '';
    }

    // Header updates
    quizCurrent.textContent = q.index + 1;
    quizTotal.textContent = q.total;
    const progressPercent = ((q.index) / q.total) * 100;
    progressBar.style.width = `${progressPercent}%`;

    const streak = Quiz.getCurrentStreak();
    streakCount.textContent = streak;
    if (streak >= 3) {
      streakBadge.classList.add('on-fire');
    } else {
      streakBadge.classList.remove('on-fire');
    }

    // Question content display based on mode
    if (q.type === 'symbol') {
      symbolQuestion.classList.remove('hidden');
      sequenceQuestion.classList.add('hidden');

      qNumber.textContent = q.element.number;
      qSymbol.textContent = q.element.symbol;
      qCategory.textContent = Quiz.getCategoryNameJa(q.element.category);
      setElementImage(q.element, qImage, qPlaceholder, qPlaceholderSymbol);
    } else {
      symbolQuestion.classList.add('hidden');
      sequenceQuestion.classList.remove('hidden');

      sqNumber.textContent = q.questionElement.number;
      sqSymbol.textContent = q.questionElement.symbol;
      sqName.textContent = q.questionElement.name_ja;
      sequenceQuestionText.textContent = q.questionText;
      setElementImage(q.questionElement, sqImage, sqPlaceholder, sqPlaceholderSymbol);
    }

    // Choices setup
    choiceBtns.forEach((btn, i) => {
      btn.className = 'choice-btn';
      btn.textContent = q.choices[i] || '';
      btn.onclick = () => handleChoiceSelect(btn, q.choices[i]);
    });
  }

  // Image load helper with placeholder fallback
  function setElementImage(element, imgEl, placeholderEl, symbolEl) {
    if (!element) return;
    symbolEl.textContent = element.symbol || '';
    imgEl.style.display = 'none';
    placeholderEl.style.display = 'flex';

    if (element.image) {
      const src = `images/elements/${element.image}`;
      imgEl.onload = () => {
        imgEl.style.display = 'block';
        placeholderEl.style.display = 'none';
      };
      imgEl.onerror = () => {
        imgEl.style.display = 'none';
        placeholderEl.style.display = 'flex';
      };
      imgEl.src = src;
      if (imgEl.complete && imgEl.naturalWidth > 0) {
        imgEl.style.display = 'block';
        placeholderEl.style.display = 'none';
      }
    }
  }

  // Hint Toggle
  btnHint.addEventListener('click', () => {
    hintArea.classList.toggle('hidden');
  });

  // Handle Choice Selection - 即座に次問へ移行し、画面下部に前問解説を表示
  function handleChoiceSelect(selectedBtn, choiceText) {
    choiceBtns.forEach(b => b.classList.add('disabled'));
    const result = Quiz.checkAnswer(choiceText);

    if (result.isCorrect) {
      selectedBtn.classList.add('correct');
    } else {
      selectedBtn.classList.add('wrong');
      // Highlight correct choice
      choiceBtns.forEach(b => {
        if (b.textContent === result.correctAnswer) {
          b.classList.add('correct');
        }
      });
    }

    // 前問の解説情報をセット
    updatePrevResultArea(result);

    // 短い演出（300ms）ののち、別画面に飛ばず次の問題へ直接移行
    setTimeout(() => {
      displayNextQuestion();
    }, 320);
  }

  // 下部の前問解説エリアを更新
  function updatePrevResultArea(result) {
    prevResultArea.classList.remove('hidden');

    prevResultBadge.className = `prev-result-badge ${result.isCorrect ? 'correct' : 'wrong'}`;
    prevResultBadge.textContent = result.isCorrect ? '⭕ 正解！' : `❌ 不正解（正解: ${result.correctAnswer}）`;

    const el = result.element;
    prevNumber.textContent = `原子番号: ${el.number}`;
    prevSymbol.textContent = el.symbol;
    prevName.textContent = `${el.name_ja} (${el.name_en})`;

    prevDescription.textContent = el.description || '特徴情報はありません。';
    prevUses.textContent = el.uses || '用途情報はありません。';

    if (el.price_per_gram_jpy != null) {
      const formattedPrice = el.price_per_gram_jpy >= 10000 
        ? `${(el.price_per_gram_jpy).toLocaleString()} 円/g`
        : `${el.price_per_gram_jpy} 円/g`;
      prevPrice.textContent = `約 ${formattedPrice}`;
    } else if (el.price_note) {
      prevPrice.textContent = el.price_note;
    } else {
      prevPrice.textContent = '取引なし（人工元素・放射性元素等）';
    }

    setElementImage(el, prevImage, prevPlaceholder, prevPlaceholderSymbol);
  }

  // Retry Quiz
  btnRetry.addEventListener('click', () => {
    Quiz.start();
    prevResultArea.classList.add('hidden');
    showScreen('quiz');
    displayNextQuestion();
  });

  // Quit Quiz Confirmation
  btnQuit.addEventListener('click', () => {
    openConfirm('クイズを中断してホームに戻りますか？', () => {
      showScreen('home');
    });
  });

  // Finish Quiz & Summary Screen
  function finishQuiz() {
    const summary = Quiz.getResult();
    Storage.saveQuizResult(summary);

    showScreen('summary');

    scorePercent.textContent = summary.rate;
    statCorrect.textContent = summary.correctCount;
    statWrong.textContent = summary.wrongElements.length;
    statStreak.textContent = summary.maxStreak;

    // SVG Score Circle Animation
    const circumference = 2 * Math.PI * 54; // r=54
    const offset = circumference - (summary.rate / 100) * circumference;
    scoreRingFill.style.strokeDashoffset = offset;

    // Wrong elements list
    if (summary.wrongElements.length > 0) {
      wrongElementsSection.classList.remove('hidden');
      wrongElementsList.innerHTML = '';
      summary.wrongElements.forEach(item => {
        const tag = document.createElement('div');
        tag.className = 'wrong-element-tag';
        tag.innerHTML = `<span class="wrong-tag-symbol">${item.symbol}</span> <span>${item.name_ja}</span>`;
        wrongElementsList.appendChild(tag);
      });
    } else {
      wrongElementsSection.classList.add('hidden');
    }
  }

  btnRetry.addEventListener('click', () => {
    Quiz.start();
    prevResultArea.classList.add('hidden');
    showScreen('quiz');
    displayNextQuestion();
  });

  btnHome.addEventListener('click', () => {
    showScreen('home');
  });

  // Learning Records Screen
  btnRecords.addEventListener('click', () => {
    renderRecords();
    showScreen('records');
  });

  btnRecordsBack.addEventListener('click', () => {
    showScreen('home');
  });

  btnClearRecords.addEventListener('click', () => {
    openConfirm('これまでの学習記録をすべて消去しますか？', () => {
      Storage.clearAll();
      renderRecords();
    });
  });

  function renderRecords() {
    const stats = Storage.getOverallStats();
    document.getElementById('rec-total-quizzes').textContent = stats.totalQuizzes;
    document.getElementById('rec-total-correct').textContent = stats.totalCorrect;
    document.getElementById('rec-avg-rate').textContent = `${stats.avgRate}%`;
    document.getElementById('rec-best-streak').textContent = stats.bestStreak;

    // Weak elements TOP10
    const weakListEl = document.getElementById('weak-elements-list');
    const weakElements = Storage.getWeakElements(Quiz.getAllElements());
    weakListEl.innerHTML = '';

    if (weakElements.length === 0) {
      weakListEl.innerHTML = '<p class="empty-message">まだ記録がありません</p>';
    } else {
      weakElements.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'weak-element-item';
        row.innerHTML = `
          <div class="weak-rank">${index + 1}</div>
          <div class="weak-symbol">${item.element.symbol}</div>
          <div class="weak-name">${item.element.name_ja} (${item.element.number})</div>
          <div class="weak-rate">正答率 ${item.rate}% (${item.correct}/${item.total})</div>
        `;
        weakListEl.appendChild(row);
      });
    }

    // History list
    const historyListEl = document.getElementById('history-list');
    const history = Storage.getHistory();
    historyListEl.innerHTML = '';

    if (history.length === 0) {
      historyListEl.innerHTML = '<p class="empty-message">まだ履歴がありません</p>';
    } else {
      history.slice(0, 30).forEach(entry => {
        const date = new Date(entry.date);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        const modeLabel = entry.mode === 'symbol' ? '記号モード' : '順番モード';
        const catLabel = entry.subCategory ? `${entry.category}(${entry.subCategory})` : entry.category;

        const row = document.createElement('div');
        row.className = 'history-item';
        row.innerHTML = `
          <div class="history-date">${dateStr}</div>
          <div class="history-info">
            <span class="history-category">${catLabel} [${entry.order === 'asc' ? '昇順' : '降順'}]</span>
            <span class="history-mode">${modeLabel}</span>
          </div>
          <div class="history-score">${entry.correctCount}/${entry.totalQuestions} (${entry.rate}%)</div>
        `;
        historyListEl.appendChild(row);
      });
    }
  }

  // PWA Service Worker Registration & Update Check
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js?v=10').then(
        reg => {
          console.log('ServiceWorker registered:', reg.scope);
          // Check for worker updates
          reg.update();
        },
        err => console.log('ServiceWorker registration failed:', err)
      );
    });
  }
});
