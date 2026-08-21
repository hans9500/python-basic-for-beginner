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
    const url = weekNumber === 6 ? 'content/selfstudy.html' :
                weekNumber === 7 ? 'content/project.html' :
                'content/week' + weekNumber + '.html';

    // 로딩 상태 표시
    content.style.opacity = '0.4';
    content.innerHTML = '<div class="loading-screen">' +
                        '<div class="loading-spinner"></div>' +
                        '<p class="loading-text">' + (weekNumber === 6 ? 'Python 한 단계 더' : weekNumber === 7 ? '종합 프로젝트' : weekNumber + '주차') + ' 불러오는 중…</p>' +
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
            if (ent.block.dataset.runner === 'pygame' && window.PygameRunner) {
              window.PygameRunner.bind(ent.block, terminal, ent.cm);
            } else {
              window.PyRunner.bindRunButton(ent.block, terminal, ent.cm);
            }
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
        const missingFile = weekNumber === 6 ? 'content/selfstudy.html' : weekNumber === 7 ? 'content/project.html' : 'content/week' + weekNumber + '.html';
        hint = '<br><br><code>' + missingFile + '</code> 파일이 ' +
               '저장소에 업로드되었는지 확인하세요.';
      } else {
        hint = '<br><br>F12 → Console 탭에서 자세한 에러를 확인할 수 있습니다.';
      }
      content.innerHTML = '<div class="loading-screen">' +
                          '<p class="loading-text" style="color:#c1440e">' +
                          (weekNumber === 6 ? 'Python 한 단계 더' : weekNumber === 7 ? '종합 프로젝트' : weekNumber + '주차') + '를 불러오지 못했습니다.<br>' +
                          '<small style="font-family:monospace">' + escapeHtml(errMsg) + '</small>' +
                          hint +
                          '</p></div>';
      console.error('[loadWeek 실패]', weekNumber, e);
      return null;
    }
  }

  /** content 안에서 모든 .section 요소 → [{id, label, title}, ...] 추출 */
  function extractSections(root) {
    const result = [];
    root.querySelectorAll('.section').forEach(function(sec) {
      const id = sec.id;
      if (!id) return;
      const titleEl = sec.querySelector('h2');
      const labelEl = sec.querySelector('.section-num');
      const title = titleEl ? titleEl.textContent.trim() : id;
      let label = labelEl ? labelEl.textContent.trim() : id;
      // 사이드바에는 내부 id가 아니라 사람이 읽는 순수 섹션 번호만 표시한다.
      // 사이드바 번호 칸에는 SECTION/SELF STUDY의 순수 번호만 표시한다.
      const m = label.match(/(?:SECTION|SELF\s+STUDY)\s+(\d+)/i);
      label = m ? m[1].padStart(2, '0') : label;
      result.push({ id: id, label: label, title: title });
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

    // 자습 탭은 "주차"가 아니므로 별도 주소를 사용합니다.
    const self = h.match(/^selfstudy(?:\/(.+))?$/);
    if (self) return { week: 6, section: self[1] || null };

    const project = h.match(/^project(?:\/(.+))?$/);
    if (project) return { week: 7, section: project[1] || null };

    const m = h.match(/^week([1-5])(?:\/(.+))?$/);
    if (!m) return { week: 1, section: null };
    return {
      week: parseInt(m[1], 10),
      section: m[2] || null
    };
  }

  /** 특정 주차+섹션으로 이동 */
  async function navigateTo(weekNumber, sectionId) {
    // 게임 탭을 떠날 때 Canvas가 사라지기 전에 실행 중인 게임 루프를 먼저 종료한다.
    if (window.appState.currentWeek === 7 && weekNumber !== 7 &&
        window.PygameRunner && window.PygameRunner.isRunning()) {
      await window.PygameRunner.stopAndWait();
    }

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
    let newHash = weekNumber === 6 ? '#selfstudy' : weekNumber === 7 ? '#project' : '#week' + weekNumber;
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
