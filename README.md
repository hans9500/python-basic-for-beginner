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

## 강사용 — GitHub Pages로 배포하기

### 1. GitHub 저장소 만들기

1. <https://github.com> 로그인
2. 우측 상단 **+ → New repository**
3. 저장소 이름 입력 (예: `python-basic-for-beginner`)
4. **Public** 선택 (GitHub Pages 무료 사용을 위해)
5. **Create repository**

### 2. 파일 업로드

**방법 A — 웹에서 드래그 앤 드롭 (가장 쉬움)**

1. 새로 만든 저장소 페이지에서 **uploading an existing file** 링크 클릭
2. 이 폴더의 모든 파일을 드래그 앤 드롭
3. 하단 **Commit changes** 클릭

**방법 B — git 명령어**

```bash
cd python-basic-for-beginner
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/hans9500/python-basic-for-beginner.git
git push -u origin main
```

### 3. GitHub Pages 활성화

1. 저장소 페이지 상단 **Settings** 탭 클릭
2. 왼쪽 사이드바에서 **Pages** 메뉴 선택
3. **Source** 항목에서:
   - Source: **Deploy from a branch**
   - Branch: **main** 선택
   - Folder: **/ (root)** 선택
4. **Save** 클릭
5. 1~2분 기다리면 상단에 URL 표시:
   ```
   https://hans9500.github.io/python-basic-for-beginner/
   ```
6. 이 URL을 학생에게 공유

### 4. 콘텐츠 수정 후 재배포

수정 후 다시 push만 하면 1~2분 안에 자동 반영됩니다.

```bash
git add .
git commit -m "내용 수정"
git push
```

또는 GitHub 웹 화면에서 파일 직접 편집(연필 아이콘) 후 Commit.

## 강의 구성

### 1주차 — 객체와 변수, 첫 문법 (10 섹션)
컴퓨터 이해, 객체 모델, print, 변수, 숫자·문자열 기초, f-string

### 2주차 — 흐름 제어 (8 섹션)
input, 형 변환, 조건문, 반복문

### 3주차 — 묶음 데이터와 함수 (8 섹션)
리스트, 튜플, 딕셔너리, 함수 정의, 매개변수

### 4주차 — 가벼운 마무리 (5 섹션)
None, 리스트 심화, 문자열 처리 심화, API 미션, "다음 학습" Notice

## 기술 스택

- **Pyodide 0.27.5** — 브라우저에서 진짜 Python 3 실행 (WebAssembly)
- **CodeMirror 5.65.16** — 코드 에디터, PyCharm Darcula 테마 적용
- **Pretendard** — 한글 본문 폰트
- 외부 의존성은 모두 CDN 로드 (별도 빌드 도구 불필요)

## 강의 작성 원칙

1. **사실 정확성 절대** — 비유든 단순화든 fact를 벗어나지 않음
2. **메모리 모델 기반** — 모든 값은 객체, 변수는 객체를 가리키는 이름표
3. **설명 순서** — 사실 먼저 → 비유는 보조
4. **공식 문서 기반** — Python 코드는 docs.python.org 기준
5. **관심 유발 우선** — 4주 안에 다 가르치려 하지 않음

## 라이선스

작성자가 별도로 정한 바에 따름.
