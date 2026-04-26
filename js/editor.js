/* ============================================================
   editor.js — CodeMirror 5 인스턴스 생성 (PyCharm Darcula)
   ============================================================ */

(function() {
  'use strict';

  /**
   * 코드 에디터 블록 하나를 CodeMirror로 변환.
   * 호출 전 DOM 구조:
   *   <div class="editor-block">
   *     <div class="editor-tab-bar">...</div>
   *     <textarea class="editor-source">...코드...</textarea>
   *     <div class="run-bar">...</div>
   *   </div>
   *
   * 호출 후: textarea가 CodeMirror 에디터로 교체됨.
   * 반환: CodeMirror 인스턴스
   */
  function createEditor(textarea, options) {
    options = options || {};
    const cm = CodeMirror.fromTextArea(textarea, {
      mode: 'python',
      theme: 'pycharm-darcula',
      lineNumbers: true,
      indentUnit: 4,
      tabSize: 4,
      indentWithTabs: false,
      smartIndent: true,
      lineWrapping: false,
      matchBrackets: true,
      styleActiveLine: true,
      extraKeys: {
        'Tab': function(cm) {
          if (cm.somethingSelected()) cm.indentSelection('add');
          else cm.replaceSelection('    ', 'end');
        },
        'Ctrl-Enter': options.onRun || function() {},
        'Cmd-Enter': options.onRun || function() {}
      }
    });
    cm.setSize('100%', 'auto');
    return cm;
  }

  /**
   * 페이지 안의 모든 .editor-block을 자동 변환.
   * 각 블록의 `data-editor-id` 또는 textarea의 `id`로 식별 가능.
   */
  function initAllEditors(root) {
    root = root || document;
    const blocks = root.querySelectorAll('.editor-block');
    const editors = [];

    blocks.forEach(function(block) {
      const ta = block.querySelector('textarea.editor-source');
      if (!ta) return;
      if (ta.classList.contains('cm-initialized')) return;
      ta.classList.add('cm-initialized');

      const cm = createEditor(ta, {
        onRun: function() {
          const runBtn = block.querySelector('.run-btn');
          if (runBtn && !runBtn.disabled) runBtn.click();
        }
      });

      editors.push({ block: block, cm: cm, textarea: ta });
    });

    return editors;
  }

  /** input-stdin 영역의 입력값 읽기 (한 줄 = 한 입력) */
  function getStdinValues(block) {
    const stdinBlock = block.previousElementSibling;
    if (!stdinBlock || !stdinBlock.classList.contains('input-stdin')) return '';
    const ta = stdinBlock.querySelector('textarea');
    if (!ta) return '';
    return ta.value;
  }

  // 외부 노출
  window.EditorKit = {
    create: createEditor,
    initAll: initAllEditors,
    getStdin: getStdinValues
  };

})();
