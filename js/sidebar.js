/* ============================================================
   sidebar.js — 사이드바 토글, 섹션 네비게이션
   ============================================================ */

(function() {
  'use strict';

  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const sectionNav = document.getElementById('section-nav');
  const weekLabel = document.getElementById('sidebar-week-label');
  const sectionCount = document.getElementById('sidebar-section-count');

  /** 모바일 여부 (768px 이하) */
  function isMobile() {
    return window.innerWidth <= 768;
  }

  /** 사이드바 열기 */
  function openSidebar() {
    sidebar.classList.add('open');
    if (isMobile()) {
      backdrop.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }

  /** 사이드바 닫기 */
  function closeSidebar() {
    sidebar.classList.remove('open');
    backdrop.classList.remove('show');
    document.body.style.overflow = '';
  }

  /** 사이드바 토글 */
  function toggleSidebar() {
    if (sidebar.classList.contains('open')) closeSidebar();
    else openSidebar();
  }

  toggleBtn.addEventListener('click', toggleSidebar);
  backdrop.addEventListener('click', closeSidebar);

  // 모바일에서 회전·리사이즈 시 backdrop 정리
  window.addEventListener('resize', function() {
    if (!isMobile()) {
      backdrop.classList.remove('show');
      document.body.style.overflow = '';
    } else if (sidebar.classList.contains('open')) {
      backdrop.classList.add('show');
    }
  });

  // ESC로 사이드바 닫기 (모바일에서만)
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isMobile() && sidebar.classList.contains('open')) {
      closeSidebar();
    }
  });

  /**
   * 사이드바 섹션 목록 갱신
   * sections: [{ id: 's0', title: '섹션 제목' }, ...]
   * weekNumber: 1~4
   */
  function updateSidebar(weekNumber, sections) {
    weekLabel.textContent = weekNumber + '주차';
    sectionCount.textContent = sections.length + '개 섹션';

    sectionNav.innerHTML = '';
    sections.forEach(function(sec) {
      const item = document.createElement('button');
      item.className = 'section-nav-item';
      item.dataset.sectionId = sec.id;
      item.innerHTML = '<span class="sn-id">' + sec.id + '</span>' +
                       '<span class="sn-title">' + sec.title + '</span>';
      item.addEventListener('click', function() {
        scrollToSection(sec.id);
        if (isMobile()) closeSidebar();
      });
      sectionNav.appendChild(item);
    });
  }

  /** 특정 섹션으로 부드럽게 스크롤 */
  function scrollToSection(sectionId) {
    const target = document.getElementById(sectionId);
    if (!target) return;

    const topbarHeight = 56;  // common.css의 --topbar-h와 동기화
    const offset = 16;         // 살짝 여유
    const targetY = target.getBoundingClientRect().top
                  + window.pageYOffset
                  - topbarHeight - offset;

    window.scrollTo({ top: targetY, behavior: 'smooth' });

    // URL hash 갱신 (라우터가 기록할 수 있도록)
    if (history.replaceState) {
      const week = window.appState ? window.appState.currentWeek : 1;
      history.replaceState(null, '', '#week' + week + '/' + sectionId);
    }
  }

  /** 스크롤 위치에 따라 active 섹션 갱신 */
  function updateActiveSection() {
    const items = sectionNav.querySelectorAll('.section-nav-item');
    if (!items.length) return;

    const topbarHeight = 56;
    const triggerY = topbarHeight + 80;
    let activeId = null;

    items.forEach(function(item) {
      const id = item.dataset.sectionId;
      const sec = document.getElementById(id);
      if (!sec) return;
      const rect = sec.getBoundingClientRect();
      if (rect.top <= triggerY) activeId = id;
    });

    items.forEach(function(item) {
      item.classList.toggle('active', item.dataset.sectionId === activeId);
    });
  }

  // 스크롤 이벤트는 throttle
  let scrollTimer = null;
  window.addEventListener('scroll', function() {
    if (scrollTimer) return;
    scrollTimer = setTimeout(function() {
      updateActiveSection();
      scrollTimer = null;
    }, 100);
  });

  // 외부 노출
  window.Sidebar = {
    open: openSidebar,
    close: closeSidebar,
    toggle: toggleSidebar,
    update: updateSidebar,
    scrollTo: scrollToSection,
    refresh: updateActiveSection
  };

})();
