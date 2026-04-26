/* ============================================================
   main.js — 탭 전환, hash 라우팅, 콘텐츠 fetch, 테마 토글
   ============================================================ */

(function() {
  'use strict';

  /* ============== 전역 앱 상태 ============== */
  window.appState = {
    currentWeek: null,   // null = 아직 어떤 주차도 로드 안 됨
    sectionsByWeek: {}   // { 1: [{id, title}, ...], 2: [...], ... }
  };

  /* ============== 테마 토글 ============== */
  const themeBtn = document.getElementById('theme-toggle');
  const themeIcon = themeBtn.querySelector('.theme-icon');

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    themeIcon.textContent = t === 'dark' ? '☀️' : '🌙';
    themeBtn.setAttribute('aria-label',
      t === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환');
    try { localStorage.setItem('lesson-theme', t); } catch(e) {}
  }

  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem('lesson-theme'); } catch(e) {}
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));
  }
  initTheme();

  themeBtn.addEventListener('click', function() {
    const cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });

  /* ============== 탭 ============== */
  const tabs = document.querySelectorAll('.tab');
  const content = document.getElementById('content');

  function setActiveTab(weekNumber) {
    tabs.forEach(function(tab) {
      const w = parseInt(tab.dataset.week, 10);
      tab.classList.toggle('active', w === weekNumber);
      tab.setAttribute('aria-selected', w === weekNumber ? 'true' : 'false');
    });
  }

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      const w = parseInt(tab.dataset.week, 10);
      navigateTo(w, null);  // 섹션 미지정
    });
  });

  /* ============== 콘텐츠 동적 로드 ============== */

  /** content/weekN.html을 fetch해서 main에 주입 */
  async function loadWeek(weekNumber) {
    const url = 'content/week' + weekNumber + '.html';

    // 로딩 상태 표시
    content.style.opacity = '0.4';
    content.innerHTML = '<div class="loading-screen">' +
                        '<div class="loading-spinner"></div>' +
                        '<p class="loading-text">' + weekNumber + '주차 불러오는 중…</p>' +
                        '</div>';

    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const html = await res.text();

      content.innerHTML = html;
      content.style.opacity = '1';

      // 섹션 목록 추출 → 사이드바 갱신
      const sections = extractSections(content);
      window.appState.sectionsByWeek[weekNumber] = sections;
      window.appState.currentWeek = weekNumber;

      if (window.Sidebar) window.Sidebar.update(weekNumber, sections);

      // CodeMirror 에디터 초기화 + Run 버튼 연결
      if (window.EditorKit && window.PyRunner) {
        const editors = window.EditorKit.initAll(content);
        editors.forEach(function(ent) {
          // 같은 .editor-block 다음(또는 가까운)의 .terminal 찾기
          const terminal = findTerminalFor(ent.block);
          if (terminal) {
            window.PyRunner.bindRunButton(ent.block, terminal, ent.cm);
          }
        });
      }

      setActiveTab(weekNumber);

      // active 섹션 갱신
      if (window.Sidebar) {
        setTimeout(window.Sidebar.refresh, 50);
      }

      return sections;
    } catch (e) {
      content.style.opacity = '1';
      // 에러 종류별로 친절한 안내
      const errMsg = String(e.message || e);
      let hint = '';
      if (location.protocol === 'file:') {
        hint = '<br><br>이 페이지는 더블클릭(file://)으로 열 수 없습니다.<br>' +
               'GitHub Pages 같은 웹서버에서 열어주세요.';
      } else if (errMsg.indexOf('404') >= 0) {
        hint = '<br><br><code>content/week' + weekNumber + '.html</code> 파일이 ' +
               '저장소에 업로드되었는지 확인하세요.';
      } else {
        hint = '<br><br>F12 → Console 탭에서 자세한 에러를 확인할 수 있습니다.';
      }
      content.innerHTML = '<div class="loading-screen">' +
                          '<p class="loading-text" style="color:#c1440e">' +
                          weekNumber + '주차를 불러오지 못했습니다.<br>' +
                          '<small style="font-family:monospace">' + escapeHtml(errMsg) + '</small>' +
                          hint +
                          '</p></div>';
      console.error('[loadWeek 실패]', weekNumber, e);
      return null;
    }
  }

  /** content 안에서 모든 .section 요소 → [{id, title}, ...] 추출 */
  function extractSections(root) {
    const result = [];
    root.querySelectorAll('.section').forEach(function(sec) {
      const id = sec.id;
      if (!id) return;
      const titleEl = sec.querySelector('h2');
      const title = titleEl ? titleEl.textContent.trim() : id;
      // section-num 같은 prefix 제거 (h2 안에 별도 .section-num은 없으므로 그대로 사용)
      result.push({ id: id, title: title });
    });
    return result;
  }

  /** editor-block의 다음 .terminal을 찾기 */
  function findTerminalFor(block) {
    let next = block.nextElementSibling;
    while (next) {
      if (next.classList && next.classList.contains('terminal')) return next;
      // 다른 editor-block을 만나면 중단
      if (next.classList && next.classList.contains('editor-block')) return null;
      next = next.nextElementSibling;
    }
    return null;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ============== 라우팅 (hash 기반) ============== */
  // URL 형식: #week2 또는 #week2/s5

  /** hash 파싱 → { week, section } */
  function parseHash() {
    const h = window.location.hash.replace(/^#/, '');
    const m = h.match(/^week(\d)(?:\/(.+))?$/);
    if (!m) return { week: 1, section: null };
    const week = parseInt(m[1], 10);
    const section = m[2] || null;
    return {
      week: (week >= 1 && week <= 4) ? week : 1,
      section: section
    };
  }

  /** 특정 주차+섹션으로 이동 */
  async function navigateTo(weekNumber, sectionId) {
    if (window.appState.currentWeek !== weekNumber) {
      await loadWeek(weekNumber);
    } else {
      setActiveTab(weekNumber);
    }
    if (sectionId) {
      // 콘텐츠 주입 직후 DOM이 안정되도록 약간 지연
      setTimeout(function() {
        if (window.Sidebar) window.Sidebar.scrollTo(sectionId);
      }, 100);
    } else {
      // 섹션 미지정 시 최상단으로
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    // hash 동기화
    let newHash = '#week' + weekNumber;
    if (sectionId) newHash += '/' + sectionId;
    if (window.location.hash !== newHash) {
      history.replaceState(null, '', newHash);
    }
  }

  /** hash 변경 감지 */
  window.addEventListener('hashchange', function() {
    const { week, section } = parseHash();
    navigateTo(week, section);
  });

  /* ============== 초기 부트 ============== */
  function boot() {
    const { week, section } = parseHash();
    navigateTo(week, section);
  }

  // DOMContentLoaded가 이미 발생했는지 확인
  // (script가 늦게 로드되면 이벤트를 놓칠 수 있음)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    // 이미 DOM이 준비됨 → 즉시 실행
    boot();
  }

  // 외부 노출
  window.App = {
    navigateTo: navigateTo,
    state: window.appState
  };

})();
