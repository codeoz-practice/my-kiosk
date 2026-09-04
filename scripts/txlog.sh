#!/usr/bin/env bash
# ↑ 이 파일을 어떤 프로그램으로 실행할지 지정 (shebang)
#   /usr/bin/env bash : 시스템에 설치된 bash를 찾아서 실행

# 사용법:
#   ./scripts/txlog.sh              # 오늘 로그 요약
#   ./scripts/txlog.sh 2026-08-31  # 특정 날짜 요약
#   ./scripts/txlog.sh --full       # 오늘 로그 전체(JSON)
#   ./scripts/txlog.sh 2026-08-31 --full

set -euo pipefail
# ↑ 스크립트 안전 옵션 3가지를 한 번에 설정
#   -e : 명령이 실패(exit code != 0)하면 즉시 스크립트 종료
#   -u : 선언하지 않은 변수를 쓰면 에러 (오타 방지)
#   -o pipefail : 파이프(|) 중간에 실패해도 에러로 처리
#                 (기본값은 마지막 명령만 체크해서 중간 실패를 놓침)

DATE=${1:-$(date +%Y-%m-%d)}
# ↑ 첫 번째 인자($1)를 DATE 변수에 저장
#   ${1:-기본값} : $1이 없으면(인자 없이 실행하면) 기본값을 사용
#   $(date +%Y-%m-%d) : date 명령 실행 결과를 문자열로 삽입 → 오늘 날짜 ex) 2026-09-01

MODE=${2:-""}
# ↑ 두 번째 인자($2)를 MODE 변수에 저장
#   없으면 빈 문자열("")을 기본값으로 사용

# --full이 첫 번째 인자로 올 수도 있음 (날짜 없이 바로 --full만 넘긴 경우)
if [[ "$DATE" == "--full" ]]; then
  MODE="--full"
  DATE=$(date +%Y-%m-%d)  # 날짜는 오늘로 설정
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# ↑ 이 스크립트 파일이 있는 디렉토리의 절대 경로를 구하는 관용구
#   ${BASH_SOURCE[0]} : 현재 실행 중인 스크립트의 경로
#   dirname "경로"    : 경로에서 파일명을 제거하고 디렉토리만 반환
#                       ex) scripts/txlog.sh → scripts
#   cd "..." && pwd   : 해당 디렉토리로 이동 후 절대 경로 출력
#   $( )              : 명령 실행 결과를 문자열로 삽입

PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
# ↑ SCRIPT_DIR(scripts/)의 상위 디렉토리 = 프로젝트 루트
#   dirname으로 한 단계 위 경로를 구함

LOG_FILE="$PROJECT_ROOT/logs/transactions/transaction-${DATE}.log"
# ↑ 로그 파일 전체 경로 조합
#   ${DATE} : 변수 값 삽입 (중괄호는 변수명 끝을 명확히 구분할 때 사용)

if [[ ! -f "$LOG_FILE" ]]; then
  # ↑ -f : 해당 경로가 일반 파일로 존재하는지 검사
  #   !    : 조건을 반전 (파일이 존재하지 않으면 true)
  echo "로그 파일 없음: $LOG_FILE" >&2
  # ↑ >&2 : 표준 출력(stdout) 대신 표준 에러(stderr)로 출력
  #         에러 메시지는 stderr로 보내는 것이 관례
  exit 1
  # ↑ 비정상 종료. 0이면 성공, 1 이상이면 실패를 의미
fi

if [[ "$MODE" == "--full" ]]; then
  # 전체 JSON 보기
  cat "$LOG_FILE" | jq '.message | fromjson'
  # ↑ jq '.message | fromjson'
  #   .message    : JSON에서 message 필드 값을 꺼냄
  #   fromjson    : 문자열로 된 JSON을 다시 파싱 (이중 인코딩 해제)
else
  # 한 줄 요약
  cat "$LOG_FILE" | jq -r '
    .message | fromjson |
    "\(.timestamp | .[0:19])  [\(.type)]  \(.status)  \(.transactionId)"
  '
  # ↑ jq -r : 결과를 raw 문자열로 출력 (따옴표 없이)
  #   "\( )" : jq 문자열 보간 (TypeScript의 `${}` 와 동일)
  #   .[0:19]: 문자열 슬라이스. "2026-09-01T11:22:56.406Z"에서 앞 19자만 추출
  #            → "2026-09-01T11:22:56"
fi
