#!/usr/bin/env bash
# 일반 로그 뷰어 (debug / error / combined / exceptions / rejections)
#
# 사용법:
#   ./scripts/log.sh <타입> [날짜] [--level <레벨>] [--full]
#
# 예시:
#   ./scripts/log.sh debug                          # 오늘 debug 로그 요약
#   ./scripts/log.sh combined --level error         # 오늘 combined에서 error만
#   ./scripts/log.sh combined 2026-08-31 --level warn
#   ./scripts/log.sh debug --full                   # 오늘 debug 전체 JSON
#   ./scripts/log.sh combined --level error --full  # error만 전체 JSON

set -euo pipefail

# ── 인자 파싱 ──────────────────────────────────────────────────────────────

if [[ $# -eq 0 ]]; then
  echo "사용법: ./scripts/log.sh <타입> [날짜] [--level <레벨>] [--full]" >&2
  echo "타입  : debug | error | combined | exceptions | rejections" >&2
  echo "레벨  : error | warn | info | debug" >&2
  exit 1
fi

TYPE="$1"
DATE=""
MODE=""
LEVEL=""  # 레벨 필터 (비어있으면 전체 출력)

# $2 이후 인자를 순회하며 날짜 / --full / --level 구분
i=2
while [[ $i -le $# ]]; do
  arg="${!i}"
  # ↑ ${!i} : 변수 i의 값을 인덱스로 사용해 해당 인자를 꺼냄 (간접 참조)
  #           i=2이면 $2, i=3이면 $3을 의미

  if [[ "$arg" == "--full" ]]; then
    MODE="--full"

  elif [[ "$arg" == "--level" ]]; then
    i=$((i + 1))          # 다음 인자로 이동
    LEVEL="${!i}"         # --level 바로 뒤 값을 레벨로 저장

  else
    DATE="$arg"           # 그 외는 날짜로 간주
  fi

  i=$((i + 1))
done

DATE="${DATE:-$(date +%Y-%m-%d)}"

# ── 파일 경로 결정 ─────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/${TYPE}-${DATE}.log"

if [[ ! -f "$LOG_FILE" ]]; then
  echo "로그 파일 없음: $LOG_FILE" >&2
  exit 1
fi

if [[ ! -s "$LOG_FILE" ]]; then
  echo "로그 없음 (빈 파일): $LOG_FILE"
  exit 0
fi

# ── jq 필터 조합 ───────────────────────────────────────────────────────────

# --level 옵션이 있으면 select()로 필터링, 없으면 통과
# select(.level == "error") : level 필드가 일치하는 항목만 남김
if [[ -n "$LEVEL" ]]; then
  # ↑ -n : 문자열 길이가 0보다 크면 true (LEVEL이 설정된 경우)
  LEVEL_FILTER="select(.level == \"$LEVEL\") |"
  # ↑ jq 필터 문자열을 변수에 저장해서 아래에서 삽입
  #   \"$LEVEL\" : 쌍따옴표를 이스케이프해서 jq 문법에 맞게 처리
else
  LEVEL_FILTER=""  # 필터 없음 = 전체 통과
fi

# ── 출력 ───────────────────────────────────────────────────────────────────

if [[ "$TYPE" == "combined" ]]; then
  # combined: message가 이중 인코딩 → fromjson으로 파싱 후 필터 적용

  if [[ "$MODE" == "--full" ]]; then
    # 실행되는 명령 예시 (--level error --full):
    #   cat logs/combined-2026-09-01.log | jq '.message | fromjson | select(.level == "error") | .'
    cat "$LOG_FILE" | jq ".message | fromjson | $LEVEL_FILTER ."
  else
    # 실행되는 명령 예시 (--level error):
    #   cat logs/combined-2026-09-01.log | jq -r '.message | fromjson | select(.level == "error") | "\(.timestamp | .[0:19])  [\(.level)]  [\(.context)]  \(.message)"'
    cat "$LOG_FILE" | jq -r ".message | fromjson | $LEVEL_FILTER \"\(.timestamp | .[0:19])  [\(.level)]  [\(.context)]  \(.message)\""
  fi
else
  # 나머지: message가 일반 문자열 → 바로 필터 적용

  if [[ "$MODE" == "--full" ]]; then
    # 실행되는 명령 예시 (--level error --full):
    #   cat logs/debug-2026-09-01.log | jq 'select(.level == "error") | .'
    cat "$LOG_FILE" | jq "$LEVEL_FILTER ."
  else
    # 실행되는 명령 예시 (--level error):
    #   cat logs/debug-2026-09-01.log | jq -r 'select(.level == "error") | "\(.timestamp | .[0:19])  [\(.level)]  [\(.context)]  \(.message)"'
    cat "$LOG_FILE" | jq -r "$LEVEL_FILTER \"\(.timestamp | .[0:19])  [\(.level)]  [\(.context)]  \(.message)\""
  fi
fi
