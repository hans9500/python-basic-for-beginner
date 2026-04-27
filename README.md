# AI 활용을 위한 프로그래밍 기초 with 파이썬

비전공자를 위한 4주 파이썬 강의. 브라우저에서 바로 실행되는 파이썬 환경(Pyodide)과 PyCharm 스타일 코드 에디터를 제공합니다.

## 폴더 구조

```
python-basic-for-beginner/
├── index.html              메인 페이지 (탭 + 사이드바)
├── css/
│   ├── common.css          디자인 토큰, 레이아웃, 타이포
│   ├── sidebar.css         사이드바 동작 (push/overlay)
│   ├── editor.css          CodeMirror PyCharm 테마
│   └── terminal.css        미니멀 출력창
├── js/
│   ├── main.js             탭 전환, hash 라우팅, 콘텐츠 fetch
│   ├── sidebar.js          사이드바 토글, 섹션 네비게이션
│   ├── editor.js           CodeMirror 초기화
│   └── pyodide-runner.js   Pyodide 로드 + 코드 실행
├── content/
│   ├── week1.html          1주차 콘텐츠
│   ├── week2.html          2주차 콘텐츠
│   ├── week3.html          3주차 콘텐츠
│   └── week4.html          4주차 콘텐츠
├── simulators/
│   ├── sim-variable.html   시뮬레이터 ① 변수와 객체 (1주차 s5)
│   ├── sim-if.html         시뮬레이터 ② if 분기 (2주차 s4)
│   └── sim-for.html        시뮬레이터 ③ for 반복 (2주차 s5)
└── assets/                 (이미지 등 정적 자원)
```

## 학생용 — 사용 방법

**접속 URL**: <https://hans9500.github.io/python-basic-for-beginner/>

위 링크에 접속하면 바로 학습을 시작할 수 있습니다.

- **PC·노트북·태블릿·스마트폰** 모든 환경에서 작동
- 파이썬 설치 불필요 (브라우저 안에서 진짜 파이썬이 돌아감)
- 첫 접속 시 파이썬 환경 다운로드(약 10MB)에 잠깐 시간 걸림

