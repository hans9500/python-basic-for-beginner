/* ============================================================
   pyodide-runner.js — Pyodide 로드 + 코드 실행 통합
   ============================================================ */

(function() {
  'use strict';

  let pyodide = null;
  let pyodideReady = false;
  let pyodideLoading = null;       // Promise

  const statusEl = document.getElementById('pyodide-status');
  const statusText = statusEl ? statusEl.querySelector('.text') : null;

  function setStatus(state, message) {
    if (!statusEl) return;
    statusEl.classList.remove('done', 'error', 'ready');
    if (state === 'done') statusEl.classList.add('done');
    if (state === 'error') statusEl.classList.add('error');
    if (state === 'ready') statusEl.classList.add('ready');
    if (statusText && message) statusText.textContent = message;
  }

  /** Pyodide를 한 번만 로드 (중복 호출 방지) */
  function loadPyodideOnce() {
    if (pyodideLoading) return pyodideLoading;
    pyodideLoading = (async function() {
      try {
        setStatus(null, '파이썬 환경 다운로드 중…');
        // indexURL 옵션 없이 호출 (DataCloneError 회피)
        pyodide = await loadPyodide();
        pyodideReady = true;
        setStatus('done', '파이썬 준비 완료');
        setTimeout(function() { setStatus('ready'); }, 1500);
        return pyodide;
      } catch (e) {
        console.error('Pyodide 로드 실패:', e);
        setStatus('error', '파이썬 로드 실패');
        throw e;
      }
    })();
    return pyodideLoading;
  }

  /**
   * 파이썬 코드 실행
   * @param {string} code 실행할 파이썬 코드
   * @param {string} stdin 표준 입력으로 채울 문자열 (input() 대응)
   * @returns {Promise<{stdout, stderr, error}>}
   */
  async function runCode(code, stdin) {
    if (!pyodideReady) await loadPyodideOnce();
    stdin = stdin || '';

    // stdout/stderr/stdin 가로채기
    const setupCode = [
      'import sys, io',
      '_stdout_capture = io.StringIO()',
      '_stderr_capture = io.StringIO()',
      '_stdin_buffer = io.StringIO(' + JSON.stringify(stdin) + ')',
      'sys.stdout = _stdout_capture',
      'sys.stderr = _stderr_capture',
      'sys.stdin = _stdin_buffer'
    ].join('\n');

    pyodide.runPython(setupCode);

    let runError = null;
    try {
      await pyodide.runPythonAsync(code);
    } catch (e) {
      runError = e;
    }

    const stdout = pyodide.runPython('_stdout_capture.getvalue()');
    const stderr = pyodide.runPython('_stderr_capture.getvalue()');

    // 표준 입출력 복원
    pyodide.runPython([
      'sys.stdout = sys.__stdout__',
      'sys.stderr = sys.__stderr__',
      'sys.stdin = sys.__stdin__'
    ].join('\n'));

    return {
      stdout: stdout || '',
      stderr: stderr || '',
      error: runError ? extractErrorMessage(runError) : null
    };
  }

  /** Pyodide 에러에서 사용자 친화적 메시지 추출 */
  function extractErrorMessage(err) {
    const msg = String(err.message || err);
    // 마지막 몇 줄이 보통 실제 에러 (Traceback 가독성 제한)
    const lines = msg.split('\n').filter(function(l) { return l.trim(); });
    return lines.slice(-4).join('\n');
  }

  /** HTML 이스케이프 */
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /** 터미널에 결과 렌더링 */
  function renderTerminal(terminalEl, result) {
    const head = terminalEl.querySelector('.terminal-head .status');
    const body = terminalEl.querySelector('.terminal-body');
    if (!head || !body) return;

    head.classList.remove('ok', 'err', 'running');
    body.classList.remove('empty');

    if (result.error) {
      head.classList.add('err');
      head.textContent = '에러 발생';
      let html = '';
      if (result.stdout) html += escapeHtml(result.stdout);
      html += '<span class="err-line">' + escapeHtml(result.error) + '</span>';
      body.innerHTML = html;
    } else {
      head.classList.add('ok');
      head.textContent = '정상 종료';
      let html = '';
      if (result.stdout) html += escapeHtml(result.stdout);
      if (result.stderr) html += '<span class="err-line">' + escapeHtml(result.stderr) + '</span>';
      if (!result.stdout && !result.stderr) {
        html = '<span class="info">(출력 없음)</span>';
      }
      body.innerHTML = html;
    }
  }

  /** 터미널을 "실행 중" 상태로 */
  function setTerminalRunning(terminalEl) {
    const head = terminalEl.querySelector('.terminal-head .status');
    const body = terminalEl.querySelector('.terminal-body');
    if (!head || !body) return;
    head.classList.remove('ok', 'err');
    head.classList.add('running');
    head.textContent = '실행 중…';
    body.classList.remove('empty');
    body.innerHTML = '<span class="info">실행 중…</span>';
  }

  /**
   * .editor-block의 Run 버튼에 실행 동작 연결
   * @param {Element} block .editor-block 요소
   * @param {Element} terminal 결과를 표시할 .terminal 요소
   * @param {Object} cmInstance CodeMirror 인스턴스
   */
  function bindRunButton(block, terminal, cmInstance) {
    const btn = block.querySelector('.run-btn');
    if (!btn) return;

    btn.addEventListener('click', async function() {
      btn.disabled = true;
      setTerminalRunning(terminal);

      try {
        const code = cmInstance.getValue();
        const stdin = window.EditorKit ? window.EditorKit.getStdin(block) : '';
        const result = await runCode(code, stdin);
        renderTerminal(terminal, result);
      } catch (e) {
        renderTerminal(terminal, {
          stdout: '', stderr: '',
          error: '실행 중 오류: ' + (e.message || String(e))
        });
      } finally {
        btn.disabled = false;
      }
    });
  }

  // 외부 노출
  window.PyRunner = {
    load: loadPyodideOnce,
    run: runCode,
    isReady: function() { return pyodideReady; },
    renderTerminal: renderTerminal,
    bindRunButton: bindRunButton
  };

  // 페이지 로드 즉시 Pyodide 로딩 시작 (백그라운드)
  loadPyodideOnce().catch(function() {});

})();
