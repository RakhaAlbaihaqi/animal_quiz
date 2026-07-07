/* ============================================================
   Tebak Hewan! — game logic
   Two modes:
     - "sound": hear the animal sound, pick the matching picture
     - "image": see the animal picture, pick the matching name
   ============================================================ */
(function () {
  "use strict";

  // ---------------------------------------------------------
  // Config: audio paths & emoji map
  // ---------------------------------------------------------
  const AUDIO = {
    bgm: "/static/audio/elements/bgmsound.mp3",
    correct: "/static/audio/elements/correct.mp3",
    wrong: "/static/audio/elements/wrongsound.mp3",
    win: "/static/audio/elements/win.mp3",
    click: "/static/audio/elements/clicksound.mp3",
    quizStart: "/static/audio/quiz/quis dimulai.mp4",
    quizEnd: "/static/audio/quiz/quis selesai.mp4",
    stars: {
      1: "/static/audio/quiz/bintang 1.mp4",
      2: "/static/audio/quiz/bintang 2.mp4",
      3: "/static/audio/quiz/bintang 3.mp4",
      4: "/static/audio/quiz/bintang 4.mp4",
      5: "/static/audio/quiz/bintang 5.mp4",
    },
    benar: [
      "/static/audio/feedback/benar1.mp4",
      "/static/audio/feedback/benar2.mp4",
      "/static/audio/feedback/benar3.mp4",
    ],
    salah: [
      "/static/audio/feedback/salah1.mp4",
      "/static/audio/feedback/salah2.mp4",
      "/static/audio/feedback/salah3.mp4",
    ],
    animals: (id) => `/static/audio/animals/${id}.mp3`,
  };

  // Result tiers keyed by star count (icon = Lucide icon name).
  const RESULT_TIERS = {
    5: { icon: "trophy", title: "LUAR BIASA!", subtitle: "Sempurna! Kamu mengenal semua hewan!" },
    4: { icon: "award", title: "HEBAT SEKALI!", subtitle: "Hampir sempurna! Terus berlatih ya!" },
    3: { icon: "smile", title: "BAGUS!", subtitle: "Tidak mengecewakan! Terus semangat!" },
    2: { icon: "meh", title: "LUMAYAN!", subtitle: "Masih ada yang perlu dipelajari!" },
    1: { icon: "frown", title: "Ayo Coba Lagi!", subtitle: "Kamu pasti bisa lebih baik!" },
  };

  // Timing constants (ms)
  const SOUND_AUTO_PLAY_DELAY = 600;
  const ANIMAL_SOUND_MAX_MS = 10000;
  const FEEDBACK_TO_NEXT_MS = 2200;
  const QUIZ_START_DELAY = 300;
  const POST_ANSWER_SFX_DELAY = 600;

  // ---------------------------------------------------------
  // State
  // ---------------------------------------------------------
  const state = {
    quizData: [],
    questionIndex: 0,
    score: 0,
    answered: false,
    mode: "sound", // 'sound' | 'image'
    animalAudio: null,
    animalAudioTimeout: null,
    feedbackAudio: null,
    bgmAudio: null,
    resultAudio: null,
    resultGen: 0, // bumped to cancel an in-flight result audio sequence
  };

  // DOM cache (filled on init)
  const el = {};

  const audioContext =
    window.AudioContext || window.webkitAudioContext
      ? new (window.AudioContext || window.webkitAudioContext)()
      : null;

  // ---------------------------------------------------------
  // Audio helpers
  // ---------------------------------------------------------
  function playAudio(src, { loop = false, volume = 1, boost = 1 } = {}) {
    const audio = new Audio(src);
    audio.loop = loop;
    audio.volume = Math.min(volume, 1);

    if (boost !== 1 && audioContext) {
      const source = audioContext.createMediaElementSource(audio);
      const gainNode = audioContext.createGain();
      gainNode.gain.value = boost;
      source.connect(gainNode).connect(audioContext.destination);
      audio._source = source;
      audio._gainNode = gainNode;
    }

    audio.play().catch(() => {});
    return audio;
  }

  function stopAudio(audio) {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    if (audio._source) audio._source.disconnect();
    if (audio._gainNode) audio._gainNode.disconnect();
  }

  function randomFrom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  // Swap any <i data-lucide> placeholders for SVGs. Safe to call repeatedly.
  function renderIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  function stopAnimalAudio() {
    if (state.animalAudioTimeout) {
      clearTimeout(state.animalAudioTimeout);
      state.animalAudioTimeout = null;
    }
    stopAudio(state.animalAudio);
    state.animalAudio = null;

    if (el.btnPlay) {
      el.btnPlay.classList.remove("playing");
    }
    if (el.playHint) {
      el.playHint.textContent = "Tekan lagi untuk dengar ulang!";
    }
  }

  function stopAllAudio() {
    stopAnimalAudio();
    stopAudio(state.feedbackAudio);
    state.feedbackAudio = null;
    stopResultAudio();
  }

  // Play a list of clips one after another (no overlap). Each clip waits for
  // the previous to finish; a generous fallback keeps the chain moving if an
  // "ended" event never fires.
  function playSequence(items) {
    const gen = ++state.resultGen;
    let i = 0;
    function next() {
      if (gen !== state.resultGen) return; // a newer sequence took over
      if (i >= items.length) {
        state.resultAudio = null;
        return;
      }
      const { src, opt } = items[i++];
      const audio = playAudio(src, opt);
      state.resultAudio = audio;
      let advanced = false;
      const advance = () => {
        if (advanced) return;
        advanced = true;
        next();
      };
      audio.onended = advance;
      setTimeout(advance, 6000); // safety net
    }
    next();
  }

  function stopResultAudio() {
    state.resultGen++;
    stopAudio(state.resultAudio);
    state.resultAudio = null;
  }

  // ---------------------------------------------------------
  // Ambient decorations: sparkles + confetti
  // ---------------------------------------------------------
  function spawnFireflies() {
    for (let i = 0; i < 15; i++) {
      const ff = document.createElement("div");
      ff.className = "firefly";
      ff.style.left = Math.random() * 100 + "vw";
      ff.style.top = Math.random() * 100 + "vh";
      ff.style.setProperty("--dx", (Math.random() - 0.5) * 200 + "px");
      ff.style.setProperty("--dy", (Math.random() - 0.5) * 200 + "px");
      ff.style.animationDuration = 4 + Math.random() * 8 + "s";
      ff.style.animationDelay = Math.random() * 8 + "s";
      document.body.appendChild(ff);
    }
  }

  function burstConfetti(amount = 60) {
    const colors = ["#ffd23e", "#ff7a6b", "#4db8ff", "#46c46a", "#ff8fc7", "#a78bfa"];
    for (let i = 0; i < amount; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.background = randomFrom(colors);
      piece.style.animationDuration = 2 + Math.random() * 2 + "s";
      piece.style.animationDelay = Math.random() * 0.4 + "s";
      if (Math.random() > 0.5) piece.style.borderRadius = "50%";
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 4500);
    }
  }

  // ---------------------------------------------------------
  // Screen management
  // ---------------------------------------------------------
  function showScreen(id) {
    document
      .querySelectorAll(".screen")
      .forEach((s) => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }

  // ---------------------------------------------------------
  // Quiz flow
  // ---------------------------------------------------------
  async function startQuiz(mode) {
    playAudio(AUDIO.click);
    state.mode = mode;

    if (!state.bgmAudio) {
      state.bgmAudio = playAudio(AUDIO.bgm, { loop: true, volume: 0.3 });
    }

    const resp = await fetch("/api/quiz");
    const data = await resp.json();
    state.quizData = data.questions;
    state.questionIndex = 0;
    state.score = 0;

    showScreen("screen-quiz");

    // Mode badge
    if (mode === "sound") {
      el.modeBadge.innerHTML = '<i data-lucide="volume-2"></i> Tebak Suara';
      el.modeBadge.className = "mode-badge mode-badge-sound";
    } else {
      el.modeBadge.innerHTML = '<i data-lucide="image"></i> Tebak Gambar';
      el.modeBadge.className = "mode-badge mode-badge-image";
    }
    renderIcons();

    // Use "flex" (not "block") so .q-inner keeps its centered column layout.
    el.soundQuestion.style.display = mode === "sound" ? "flex" : "none";
    el.imageQuestion.style.display = mode === "image" ? "flex" : "none";

    setTimeout(
      () => playAudio(AUDIO.quizStart, { volume: 1.0, boost: 2.5 }),
      QUIZ_START_DELAY
    );

    loadQuestion();
  }

  function loadQuestion() {
    state.answered = false;
    stopAllAudio();

    const q = state.quizData[state.questionIndex];
    const total = state.quizData.length;

    el.qCurrent.textContent = state.questionIndex + 1;
    el.qTotal.textContent = total;
    el.qScore.textContent = state.score;
    el.progressFill.style.width = (state.questionIndex / total) * 100 + "%";

    el.choicesGrid.innerHTML = "";

    if (state.mode === "sound") {
      renderSoundQuestion(q);
    } else {
      renderImageQuestion(q);
    }

    renderIcons();
    animateQuizPage();
  }

  // Turn the answers page like flipping to a fresh page in the book.
  function animateQuizPage() {
    if (!hasGsap()) return;
    gsap.fromTo(
      "#quiz-book .book-page--right",
      { rotateY: -85, transformOrigin: "left center" },
      { rotateY: 0, duration: 0.6, ease: "power3.out" }
    );
  }

  function renderSoundQuestion(q) {
    el.playHint.textContent = "Tekan untuk mendengar!";
    el.btnPlay.classList.remove("playing");
    setTimeout(playCurrentAnimalSound, SOUND_AUTO_PLAY_DELAY);

    q.choices.forEach((animal) => {
      const card = document.createElement("div");
      card.className = "animal-choice";
      card.dataset.animalId = animal.id;
      card.innerHTML = `
        <img src="/static/images/animals/${animal.id}.jpg" alt="${animal.name}" loading="lazy" />
        <div class="animal-name">${animal.name}</div>`;
      el.choicesGrid.appendChild(card);
    });
  }

  function renderImageQuestion(q) {
    el.questionImg.src = `/static/images/animals/${q.correct_animal.id}.jpg`;

    q.choices.forEach((animal) => {
      const card = document.createElement("div");
      card.className = "text-choice";
      card.dataset.animalId = animal.id;
      card.innerHTML = `
        <span class="choice-icon"><i data-lucide="paw-print"></i></span>
        <span class="animal-name-label">${animal.name}</span>`;
      el.choicesGrid.appendChild(card);
    });
  }

  function playCurrentAnimalSound() {
    stopAnimalAudio();
    const q = state.quizData[state.questionIndex];
    state.animalAudio = playAudio(AUDIO.animals(q.correct_animal.id));

    el.btnPlay.classList.add("playing");
    el.playHint.textContent = "Sedang memutar...";

    // Safety stop for long clips.
    state.animalAudioTimeout = setTimeout(stopAnimalAudio, ANIMAL_SOUND_MAX_MS);
    state.animalAudio.onended = stopAnimalAudio;
  }

  function handleAnswer(chosenId) {
    if (state.answered) return;
    state.answered = true;
    stopAnimalAudio();
    stopAudio(state.feedbackAudio);

    const correctId = state.quizData[state.questionIndex].correct_animal.id;
    const isCorrect = chosenId === correctId;

    revealChoices(chosenId, correctId, isCorrect);

    if (isCorrect) {
      state.score++;
      state.feedbackAudio = playAudio(randomFrom(AUDIO.benar));
      // After the praise clip, replay the animal sound (image mode) or a ding.
      const followUp =
        state.mode === "image"
          ? () => playAudio(AUDIO.animals(correctId), { volume: 0.6 })
          : () => playAudio(AUDIO.correct, { volume: 0.7 });
      setTimeout(followUp, POST_ANSWER_SFX_DELAY);
      showFeedback(true);
      burstConfetti(40);
    } else {
      state.feedbackAudio = playAudio(randomFrom(AUDIO.salah));
      setTimeout(() => playAudio(AUDIO.wrong, { volume: 0.7 }), POST_ANSWER_SFX_DELAY);
      showFeedback(false);
    }

    setTimeout(advanceQuestion, FEEDBACK_TO_NEXT_MS);
  }

  function revealChoices(chosenId, correctId, isCorrect) {
    el.choicesGrid.querySelectorAll("[data-animal-id]").forEach((card) => {
      const id = card.dataset.animalId;
      if (id === correctId) {
        card.classList.add("correct");
      } else if (id === chosenId && !isCorrect) {
        card.classList.add("wrong");
      }
    });
  }

  function advanceQuestion() {
    hideFeedback();
    stopAllAudio();
    state.questionIndex++;
    if (state.questionIndex < state.quizData.length) {
      loadQuestion();
    } else {
      showResult();
    }
  }

  function showFeedback(correct) {
    el.feedbackBadge.className =
      "feedback-badge " + (correct ? "correct-badge" : "wrong-badge");
    el.feedbackBadge.innerHTML = correct
      ? '<i data-lucide="check-circle-2"></i> Benar!'
      : '<i data-lucide="x-circle"></i> Salah!';
    renderIcons();
    el.feedbackOverlay.classList.add("show");
  }

  function hideFeedback() {
    el.feedbackOverlay.classList.remove("show");
  }

  // ---------------------------------------------------------
  // Result screen
  // ---------------------------------------------------------
  function calcStars(score, total) {
    const pct = score / total;
    if (pct === 1) return 5;
    if (pct >= 0.8) return 4;
    if (pct >= 0.6) return 3;
    if (pct >= 0.4) return 2;
    return 1;
  }

  function showResult() {
    stopAllAudio();
    stopAudio(state.bgmAudio);
    state.bgmAudio = null;

    const total = state.quizData.length;
    const wrong = total - state.score;
    const stars = calcStars(state.score, total);
    const tier = RESULT_TIERS[stars];

    el.resultIcon.innerHTML = `<i data-lucide="${tier.icon}"></i>`;
    renderIcons();
    el.resultTitle.textContent = tier.title;
    el.resultSubtitle.textContent = tier.subtitle;
    el.resultCorrect.textContent = state.score;
    el.resultWrong.textContent = wrong;

    showScreen("screen-result");

    // Light up the earned stars one by one.
    el.starEls.forEach((star, i) => {
      star.classList.remove("earned");
      if (i < stars) {
        setTimeout(() => star.classList.add("earned"), 700 + i * 450);
      }
    });

    if (stars >= 4) burstConfetti(120);

    // Play the result voice clips back-to-back so they never overlap:
    // "quis selesai" -> "bintang N" -> (win jingle for 4-5 stars).
    const sequence = [
      { src: AUDIO.quizEnd, opt: { volume: 1.0, boost: 2.5 } },
      { src: AUDIO.stars[stars], opt: { volume: 1.0 } },
    ];
    if (stars >= 4) sequence.push({ src: AUDIO.win, opt: { volume: 1.0 } });
    playSequence(sequence);
  }

  // ---------------------------------------------------------
  // Landing: open-book animation (GSAP, optional)
  // ---------------------------------------------------------
  const hasGsap = () => typeof window.gsap !== "undefined";

  // Book "blooms" open: both pages swing out from the spine,
  // then content + peeking animals settle in.
  function animateBookIn() {
    if (!hasGsap()) return;
    gsap.set("#intro-book", { scale: 0.72, y: 50, autoAlpha: 0 });
    gsap.set(".brand", { y: -36, autoAlpha: 0 });
    gsap.set("#intro-book .book-page--left", { rotateY: 72, transformOrigin: "right center" });
    gsap.set("#intro-book .book-page--right", { rotateY: -72, transformOrigin: "left center" });
    gsap.set(".mode-panel", { autoAlpha: 0, y: 18 });
    gsap.set(".peek", { scale: 0, autoAlpha: 0 });
    gsap.set(".book-about", { autoAlpha: 0, y: 14 });

    gsap
      .timeline()
      .to("#intro-book", { scale: 1, y: 0, autoAlpha: 1, duration: 0.55, ease: "back.out(1.4)" })
      .to("#intro-book .book-page--left", { rotateY: 0, duration: 0.75, ease: "power3.out" }, "-=0.15")
      .to("#intro-book .book-page--right", { rotateY: 0, duration: 0.75, ease: "power3.out" }, "<")
      .to(".mode-panel", { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.14 }, "-=0.25")
      .to(".brand", { y: 0, autoAlpha: 1, duration: 0.5, ease: "back.out(2)" }, "-=0.55")
      .to(".peek", { scale: 1, autoAlpha: 1, duration: 0.5, stagger: 0.1, ease: "back.out(2.4)" }, "-=0.3")
      .to(".book-about", { autoAlpha: 1, y: 0, duration: 0.4 }, "-=0.4");
  }

  // Before the quiz starts: zoom into the book and fade it out (no backflip).
  function startWithFlip(mode) {
    if (!hasGsap()) {
      startQuiz(mode);
      return;
    }
    gsap
      .timeline({ onComplete: () => startQuiz(mode) })
      .to(".peek", { scale: 0, autoAlpha: 0, duration: 0.25, stagger: 0.04 })
      .to(".brand", { autoAlpha: 0, y: -18, duration: 0.3 }, "<")
      .to(
        "#intro-book",
        { scale: 1.08, autoAlpha: 0, duration: 0.4, ease: "power2.in" },
        "-=0.15"
      );
  }

  // ---------------------------------------------------------
  // Navigation & modal
  // ---------------------------------------------------------
  function restartSameMode() {
    playAudio(AUDIO.click);
    stopAllAudio();
    startQuiz(state.mode);
  }

  function goHome() {
    playAudio(AUDIO.click);
    stopAllAudio();
    stopAudio(state.bgmAudio);
    state.bgmAudio = null;
    showScreen("screen-intro");
    animateBookIn();
  }

  function showAboutModal() {
    playAudio(AUDIO.click);
    el.aboutModal.classList.add("show");
  }

  function hideAboutModal() {
    playAudio(AUDIO.click);
    el.aboutModal.classList.remove("show");
  }

  // ---------------------------------------------------------
  // Init: cache DOM, wire events, start ambient effects
  // ---------------------------------------------------------
  function cacheDom() {
    const ids = [
      "btn-play", "play-hint", "mode-badge", "sound-question", "image-question",
      "q-current", "q-total", "q-score", "progress-fill", "choices-grid",
      "question-img", "feedback-overlay", "feedback-badge", "about-modal",
      "result-icon", "result-title", "result-subtitle", "result-correct",
      "result-wrong",
    ];
    ids.forEach((id) => {
      // 'btn-play' -> 'btnPlay'
      const key = id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      el[key] = document.getElementById(id);
    });
    el.starEls = document.querySelectorAll("#stars-container .star");
  }

  function wireEvents() {
    // Intro mode buttons + nav + about via data-action attributes.
    document.querySelectorAll("[data-action]").forEach((node) => {
      node.addEventListener("click", () => {
        switch (node.dataset.action) {
          case "start":
            startWithFlip(node.dataset.mode);
            break;
          case "play-sound":
            playCurrentAnimalSound();
            break;
          case "restart":
            restartSameMode();
            break;
          case "home":
            goHome();
            break;
          case "about-open":
            showAboutModal();
            break;
          case "about-close":
            hideAboutModal();
            break;
        }
      });
    });

    // Event delegation for answer choices.
    el.choicesGrid.addEventListener("click", (e) => {
      const card = e.target.closest("[data-animal-id]");
      if (card) handleAnswer(card.dataset.animalId);
    });

    // Close modal when clicking the dimmed backdrop.
    el.aboutModal.addEventListener("click", (e) => {
      if (e.target === el.aboutModal) hideAboutModal();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    cacheDom();
    wireEvents();
    renderIcons();
    spawnFireflies();
    animateBookIn();
  });
})();
