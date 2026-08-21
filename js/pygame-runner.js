/* ============================================================
   pygame-runner.js — Pyodide + pygame-ce Canvas 실행기
   ============================================================ */
(function() {
  'use strict';

  let packageReady = false;
  let packageLoading = null;
  let running = false;
  let activeRunPromise = null;
  let activeRunResolve = null;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  async function ensurePygame(canvas, statusEl) {
    const pyodide = await window.PyRunner.load();

    if (pyodide.canvas && canvas) {
      pyodide.canvas.setCanvas2D(canvas);
    }
    // SDL 패키지의 브라우저 실행을 위한 Pyodide opt-in 설정.
    if (pyodide._api) pyodide._api._skip_unwind_fatal_error = true;

    if (packageReady) return pyodide;
    if (!packageLoading) {
      packageLoading = (async function() {
        if (statusEl) {
          statusEl.textContent = 'pygame-ce 불러오는 중…';
          statusEl.className = 'game-runtime-status loading';
        }
        await pyodide.loadPackage('pygame-ce');
        packageReady = true;
        return pyodide;
      })();
    }
    return packageLoading;
  }

  function setTerminal(terminal, state, text) {
    if (!terminal) return;
    const head = terminal.querySelector('.terminal-head .status');
    const body = terminal.querySelector('.terminal-body');
    if (!head || !body) return;
    head.classList.remove('ok', 'err', 'running');
    body.classList.remove('empty');
    if (state === 'running') head.classList.add('running');
    if (state === 'ok') head.classList.add('ok');
    if (state === 'error') head.classList.add('err');
    head.textContent = state === 'running' ? '실행 중…' : state === 'error' ? '에러 발생' : '정상 종료';
    body.innerHTML = text ? escapeHtml(text) : '<span class="info">(출력 없음)</span>';
  }

  async function runGame(block, terminal, cm) {
    if (running) return;
    const lab = block.closest('[data-game-lab]');
    const canvas = lab ? lab.querySelector('.pygame-canvas') : document.getElementById('canvas');
    const status = lab ? lab.querySelector('[data-game-status]') : null;
    const stopBtn = lab ? lab.querySelector('[data-game-stop]') : null;
    const pauseBtn = lab ? lab.querySelector('[data-game-pause]') : null;
    const resetBtn = lab ? lab.querySelector('[data-game-reset]') : null;
    const runBtn = block.querySelector('.run-btn');
    const stageRunBtn = lab ? lab.querySelector('[data-game-run]') : null;
    const restartBtn = lab ? lab.querySelector('[data-game-restart]') : null;

    running = true;
    activeRunPromise = new Promise(function(resolve) { activeRunResolve = resolve; });
    if (runBtn) runBtn.disabled = true;
    if (stageRunBtn) stageRunBtn.disabled = true;
    if (restartBtn) restartBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;
    if (pauseBtn) { pauseBtn.disabled = false; pauseBtn.textContent = '일시정지'; pauseBtn.dataset.paused = 'false'; }
    if (resetBtn) resetBtn.disabled = true;
    setTerminal(terminal, 'running', '게임 실행 준비 중…');

    try {
      const pyodide = await ensurePygame(canvas, status);
      pyodide.globals.set('_stop_game', false);
      pyodide.globals.set('_pause_game', false);

      // 게임에서 print한 최종 결과만 이 실습 터미널에 보여준다.
      pyodide.runPython([
        'import sys, io',
        '_game_stdout = io.StringIO()',
        '_game_stderr = io.StringIO()',
        'sys.stdout = _game_stdout',
        'sys.stderr = _game_stderr'
      ].join('\n'));

      if (status) {
        status.textContent = '실행 중';
        status.className = 'game-runtime-status running';
      }
      setTerminal(terminal, 'running', '게임 화면을 클릭한 뒤 ← → 또는 A/D 키를 사용하세요.');
      if (canvas) canvas.focus();

      let runError = null;
      try {
        await pyodide.runPythonAsync(cm.getValue());
      } catch (e) {
        runError = e;
      }

      const stdout = pyodide.runPython('_game_stdout.getvalue()');
      const stderr = pyodide.runPython('_game_stderr.getvalue()');
      pyodide.runPython([
        'sys.stdout = sys.__stdout__',
        'sys.stderr = sys.__stderr__'
      ].join('\n'));

      if (runError) {
        const message = String(runError.message || runError).split('\n').filter(Boolean).slice(-5).join('\n');
        setTerminal(terminal, 'error', (stdout || '') + (stderr || '') + message);
        if (status) {
          status.textContent = '실행 오류';
          status.className = 'game-runtime-status error';
        }
      } else {
        setTerminal(terminal, 'ok', (stdout || '') + (stderr || ''));
        if (status) {
          status.textContent = '종료됨';
          status.className = 'game-runtime-status';
        }
      }
    } catch (e) {
      setTerminal(terminal, 'error', 'pygame 실행 환경 준비 실패: ' + (e.message || String(e)));
      if (status) {
        status.textContent = '환경 준비 실패';
        status.className = 'game-runtime-status error';
      }
    } finally {
      running = false;
      if (runBtn) runBtn.disabled = false;
      if (stageRunBtn) stageRunBtn.disabled = false;
      if (restartBtn) restartBtn.disabled = false;
      if (stopBtn) stopBtn.disabled = true;
      if (pauseBtn) { pauseBtn.disabled = true; pauseBtn.textContent = '일시정지'; pauseBtn.dataset.paused = 'false'; }
      if (resetBtn) resetBtn.disabled = false;
      if (activeRunResolve) activeRunResolve();
      activeRunResolve = null;
      activeRunPromise = null;
    }
  }

  async function stopGame() {
    try {
      const pyodide = await window.PyRunner.load();
      // 실행 중인 runPythonAsync 코드와 같은 Python 전역 네임스페이스에서 직접 변경합니다.
      pyodide.runPython('_stop_game = True');
    } catch (e) {
      console.error('게임 중지 실패:', e);
    }
  }

  async function togglePause(lab, pauseBtn) {
    if (!running || !pauseBtn) return;
    try {
      const pyodide = await window.PyRunner.load();
      const paused = pauseBtn.dataset.paused === 'true';
      const nextPaused = !paused;
      // JS Map-style set 대신 Python 코드로 직접 대입해 현재 실행 중인 게임의 globals()와 확실히 공유합니다.
      pyodide.runPython('_pause_game = ' + (nextPaused ? 'True' : 'False'));
      pauseBtn.dataset.paused = nextPaused ? 'true' : 'false';
      pauseBtn.textContent = nextPaused ? '계속' : '일시정지';
      if (!nextPaused) {
        const canvas = lab ? lab.querySelector('.pygame-canvas') : null;
        if (canvas) canvas.focus();
      }
      const status = lab ? lab.querySelector('[data-game-status]') : null;
      if (status) {
        status.textContent = nextPaused ? '일시정지' : '실행 중';
        status.className = nextPaused ? 'game-runtime-status' : 'game-runtime-status running';
      }
    } catch (e) {
      console.error('게임 일시정지 전환 실패:', e);
    }
  }

  function bind(block, terminal, cm) {
    const lab = block.closest('[data-game-lab]');
    const runBtn = block.querySelector('.run-btn');
    const stageRunBtn = lab ? lab.querySelector('[data-game-run]') : null;
    const restartBtn = lab ? lab.querySelector('[data-game-restart]') : null;
    const stopBtn = lab ? lab.querySelector('[data-game-stop]') : null;
    const pauseBtn = lab ? lab.querySelector('[data-game-pause]') : null;
    const resetBtn = lab ? lab.querySelector('[data-game-reset]') : null;
    const canvas = lab ? lab.querySelector('.pygame-canvas') : null;
    const initialCode = cm.getValue();

    if (runBtn) runBtn.addEventListener('click', function() { runGame(block, terminal, cm); });
    if (stageRunBtn) stageRunBtn.addEventListener('click', function() { runGame(block, terminal, cm); });
    if (restartBtn) restartBtn.addEventListener('click', async function() {
      if (pauseBtn) { pauseBtn.dataset.paused = 'false'; pauseBtn.textContent = '일시정지'; }
      if (running) await stopAndWait();
      runGame(block, terminal, cm);
    });
    if (stopBtn) stopBtn.addEventListener('click', stopGame);
    if (pauseBtn) pauseBtn.addEventListener('click', function() { togglePause(lab, pauseBtn); });
    if (resetBtn) resetBtn.addEventListener('click', function() {
      if (running) return;
      cm.setValue(initialCode);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#191c24';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
      const status = lab.querySelector('[data-game-status]');
      if (status) {
        status.textContent = '대기 중';
        status.className = 'game-runtime-status';
      }
      const body = terminal.querySelector('.terminal-body');
      const head = terminal.querySelector('.terminal-head .status');
      if (body) { body.innerHTML = ''; body.classList.add('empty'); }
      if (head) { head.textContent = '대기 중'; head.className = 'status'; }
    });
    if (canvas) canvas.addEventListener('click', function() { canvas.focus(); });
  }

  async function stopAndWait() {
    if (!running) return;
    await stopGame();
    if (activeRunPromise) await activeRunPromise;
  }

  window.PygameRunner = {
    bind: bind,
    stop: stopGame,
    stopAndWait: stopAndWait,
    isRunning: function() { return running; }
  };
})();
