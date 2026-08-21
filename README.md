# AI 활용을 위한 프로그래밍 기초 with 파이썬

파이썬 초보자를 위한 1~4주차 기초 과정, `실무 IT 산업` 탭, 그리고 선택형 자습 탭 `Python 한 단계 더`로 구성된 학습 자료입니다. 브라우저에서 바로 실행되는 파이썬 환경(Pyodide)과 PyCharm 스타일 코드 에디터를 제공합니다.

## 로컬에서 실행하기

> **중요:** `index.html`을 더블클릭해서 `file://` 주소로 열면 강의 내용을 불러올 수 없습니다.

이 프로젝트의 `index.html`은 JavaScript `fetch()`를 사용해 `content/week1.html` ~ `content/week5.html` 및 `content/selfstudy.html`을 불러옵니다. 브라우저는 보안상의 이유로 `file://` 페이지에서 이런 로컬 파일 요청을 제한하므로, **간단한 로컬 웹 서버를 실행한 뒤 `http://localhost`로 접속해야 합니다.**

### Windows에서 가장 간단한 실행 방법

1. ZIP 파일을 원하는 폴더에 압축 해제합니다.
2. CMD 또는 PowerShell을 열고 프로젝트 폴더로 이동합니다.

```bash
cd C:\Users\사용자이름\Downloads\python-basic-for-beginner-main-fixed-v10-readability
```

3. Python의 내장 HTTP 서버를 실행합니다.

```bash
python -m http.server 8000
```

Windows 환경에서 `python` 명령 대신 Python Launcher를 사용하는 경우에는 다음 명령도 사용할 수 있습니다.

```bash
py -m http.server 8000
```

4. 브라우저에서 다음 주소로 접속합니다.

```text
http://localhost:8000
```

정상적으로 실행되면 주소는 다음과 같은 형태가 됩니다.

```text
http://localhost:8000/#week1
```

5. 서버를 종료하려면 서버를 실행한 CMD/PowerShell 창에서 `Ctrl + C`를 누릅니다.

### 왜 더블클릭으로 열 수 없나요?

현재 프로젝트는 다음과 같은 구조로 동작합니다.

```text
index.html
   │
   ├─ fetch("content/week1.html")
   ├─ fetch("content/week2.html")
   ├─ fetch("content/week3.html")
   ├─ fetch("content/week4.html")
   ├─ fetch("content/week5.html")
   └─ fetch("content/selfstudy.html")
```

`file://`로 연 페이지에서는 브라우저의 보안 정책 때문에 위 파일들을 `fetch()`로 읽어오지 못할 수 있습니다. 로컬 HTTP 서버를 사용하면 같은 웹사이트의 리소스로 처리되어 정상적으로 로딩됩니다.

### Python 코드의 Run 버튼 사용 시 인터넷 연결 필요

강의 페이지 자체의 HTML/CSS/JavaScript는 로컬 HTTP 서버로 볼 수 있지만, 브라우저 안에서 Python을 실행하는 기능은 **Pyodide를 외부 CDN에서 불러옵니다.**

따라서 다음과 같이 구분하면 됩니다.

- 강의 내용 보기: 로컬 HTTP 서버 필요
- Python `Run` 버튼 사용: 로컬 HTTP 서버 + 인터넷 연결 필요
- `index.html` 더블클릭(`file://`): 지원하지 않음

---

## 폴더 구조

```
python-basic-for-beginner/
├── index.html              메인 페이지 (탭 + 사이드바)
├── css/
│   ├── common.css          디자인 토큰, 레이아웃, 타이포
│   ├── sidebar.css         사이드바 동작 (push/overlay)
│   ├── editor.css          CodeMirror PyCharm 테마
│   ├── terminal.css        미니멀 출력창
│   └── simulator.css       시뮬레이터 공통 스타일
├── js/
│   ├── main.js             탭 전환, hash 라우팅, 콘텐츠 fetch
│   ├── sidebar.js          사이드바 토글, 섹션 네비게이션
│   ├── editor.js           CodeMirror 초기화
│   └── pyodide-runner.js   Pyodide 로드 + 코드 실행
├── content/
│   ├── week1.html          1주차 콘텐츠
│   ├── week2.html          2주차 콘텐츠
│   ├── week3.html          3주차 콘텐츠
│   ├── week4.html          4주차 콘텐츠
│   ├── week5.html          실무 IT 산업의 큰 그림
│   └── selfstudy.html      선택형 자습 — Python 한 단계 더
├── simulators/
│   ├── sim-variable.html   시뮬레이터 ① 변수와 객체 (1주차 s5)
│   ├── sim-if.html         시뮬레이터 ② if 분기 (2주차 s4)
│   ├── sim-for.html        시뮬레이터 ③ for 반복 (2주차 s5)
│   ├── sim-mutable.html    시뮬레이터 ④ 가변 vs 불변
│   └── sim-services.html   시뮬레이터 ⑤ 서비스 요청 흐름
└── assets/                 (이미지 등 정적 자원)
```

## 학생용 — 사용 방법

**접속 URL**: <https://hans9500.github.io/python-basic-for-beginner/>

위 링크에 접속하면 바로 학습을 시작할 수 있습니다.

- **PC·노트북·태블릿·스마트폰** 모든 환경에서 작동
- 파이썬 설치 불필요 (브라우저 안에서 진짜 파이썬이 돌아감)
- 첫 접속 시 파이썬 환경 다운로드(약 10MB)에 잠깐 시간 걸림



## 추가 자습 탭

`content/selfstudy.html`은 정규 주차가 아닌 선택형 자습 공간입니다. `#selfstudy` 주소로 열리며 다음 주제를 포함합니다.

- 리스트 실무 메서드와 `sort()` / `sorted()` / 복사 차이
- `map()`, `filter()`, `functools.reduce()`와 comprehension 비교
- `split()` / `join()` 실전 복습
- `abs()`, `round()`, `reversed()`, `isinstance()`
- 문자열 판별 메서드와 dict/set의 실무 메서드
- `assert`, `raise`, `else`, `finally`과 사용자 정의 예외
- 함수 객체, closure, decorator
- iterable / iterator / generator
- class / instance / `self` / 상속 입문
- type hint 심화
- module / package / pip / venv / requirements / pyproject 개요
- `match/case`, `:=`, context manager, async 후속 학습 지도

## Python 한 단계 더(Self Study)

본 과정을 마친 뒤 돌아오는 선택형 자습 교재입니다. 단순 문법 목록이 아니라 개념 설명, SVG 도식, 여러 실행 예제, 실무형 상황, 흔한 실수와 직접 해보기를 통해 같은 개념을 반복해서 익히도록 구성했습니다.

현재 Self Study에는 **73개의 실행형 Python 예제와 8개의 SVG 개념도**가 포함되어 있습니다. 예제 수를 채우기 위한 단순 숫자 변경은 피하고, 로그·사용자·주문·권한·작업 큐·예외 처리·Decorator·Generator·Class·프로젝트 환경처럼 서로 다른 문제 상황에서 같은 개념을 반복해서 사용하도록 구성했습니다.


## Python 한 단계 더 (Self Study)

기초 과정 이후 선택적으로 공부하는 자습 교재입니다. 현재 **25개 섹션**, **135개 실행형 예제**, **20개 SVG 개념도**, **15개 직접 해보기**로 구성되어 있습니다.

추가 심화 범위에는 LEGB와 scope, shallow/deep copy, class 심화, dataclass, collections, itertools, pathlib, datetime, 정규표현식, logging과 환경변수, 테스트, asyncio가 포함됩니다. 예제는 문법 모양을 채우기 위해 반복하지 않고 로그·설정·주문·파일·배포·사용자 데이터처럼 실제 목적이 다른 상황에서 같은 개념을 다시 적용하도록 구성했습니다.
