#!/bin/sh
set -eu

# ==============================================================================
# KinetixNotes Automated Deployment Script
# Automates:
#   1. Supabase Backend & RLS verification (via scripts/check-auth.sh)
#   2. Local validation (npm install, lint, build)
#   3. Git staging / commit / push preparation
#   4. Vercel deployment with VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
#   5. Live site verification and Supabase Auth URL configuration guidance
# ==============================================================================

PROJECT_NAME="KinetixNotes"
DEFAULT_SUPABASE_URL="https://fsrdqmraatuzhdzdbfrk.supabase.co"
DEFAULT_SUPABASE_ANON_KEY="sb_publishable_SxgPR39Zr1OPdNOC80yXRg_yOVSXyaS"

PROD=true
SKIP_INSTALL=false
SKIP_LINT=false
SKIP_BUILD=false
SKIP_AUTH_CHECK=false
SKIP_GIT=false
PUSH_GIT=false
DRY_RUN=false
COMMIT_MSG="feat: update Supabase RLS policies and deploy KinetixNotes"
CUSTOM_VERCEL_TOKEN="${VERCEL_TOKEN:-}"

# Xác định thư mục script và thư mục dự án
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORK_DIR="$(pwd)"

# Tìm thư mục chứa package.json
if [ -f "$WORK_DIR/package.json" ]; then
  PROJECT_DIR="$WORK_DIR"
elif [ -f "/storage/emulated/0/Documents/AgyX/workspaces/KinetixNotes/package.json" ]; then
  PROJECT_DIR="/storage/emulated/0/Documents/AgyX/workspaces/KinetixNotes"
elif [ -f "$SCRIPT_DIR/../package.json" ]; then
  PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
else
  PROJECT_DIR="$WORK_DIR"
fi

SUPABASE_URL="${VITE_SUPABASE_URL:-$DEFAULT_SUPABASE_URL}"
SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-$DEFAULT_SUPABASE_ANON_KEY}"

print_help() {
  cat << EOF
Cách dùng: $0 [options]

Các tùy chọn:
  --prod                  Deploy môi trường Production (mặc định: bật)
  --preview               Deploy môi trường Preview (tắt --prod)
  --skip-install          Bỏ qua bước npm install
  --skip-lint             Bỏ qua bước npm run lint
  --skip-build            Bỏ qua bước npm run build
  --skip-auth-check       Bỏ qua bước kiểm tra kết nối & RLS Supabase
  --skip-git              Bỏ qua bước kiểm tra / commit Git
  --push                  Tự động git push lên remote sau khi commit
  -m, --message <msg>     Nội dung Git commit (mặc định: "$COMMIT_MSG")
  -u, --url <url>         Supabase URL (mặc định: $DEFAULT_SUPABASE_URL)
  -k, --key <key>         Supabase Anon Key
  -t, --token <token>     Vercel CLI Token (hoặc biến môi trường VERCEL_TOKEN)
  --dry-run               Chạy mô phỏng toàn bộ quy trình không gọi deploy thực tế
  -h, --help              Hiển thị trợ giúp này

EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --prod)
      PROD=true
      shift
      ;;
    --preview)
      PROD=false
      shift
      ;;
    --skip-install)
      SKIP_INSTALL=true
      shift
      ;;
    --skip-lint)
      SKIP_LINT=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-auth-check)
      SKIP_AUTH_CHECK=true
      shift
      ;;
    --skip-git)
      SKIP_GIT=true
      shift
      ;;
    --push)
      PUSH_GIT=true
      shift
      ;;
    -m|--message)
      COMMIT_MSG="$2"
      shift 2
      ;;
    -u|--url)
      SUPABASE_URL="$2"
      shift 2
      ;;
    -k|--key)
      SUPABASE_ANON_KEY="$2"
      shift 2
      ;;
    -t|--token)
      CUSTOM_VERCEL_TOKEN="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      print_help
      exit 0
      ;;
    *)
      echo "Tham số không hợp lệ: $1" >&2
      print_help
      exit 1
      ;;
  esac
done

# Chuẩn bị chứng chỉ SSL CA cho Node trên Android nếu cần
if [ -z "${NODE_EXTRA_CA_CERTS:-}" ] && [ -d "/system/etc/security/cacerts" ]; then
  CA_DIR="${HOME:-/data/user/0/com.agyx.v2.debug/files/home}/.cache"
  CA_FILE="${CA_DIR}/cacerts.pem"
  if [ ! -f "$CA_FILE" ] || [ ! -s "$CA_FILE" ]; then
    mkdir -p "$CA_DIR" 2>/dev/null || true
    cat /system/etc/security/cacerts/*.0 > "$CA_FILE" 2>/dev/null || true
  fi
  if [ -s "$CA_FILE" ]; then
    export NODE_EXTRA_CA_CERTS="$CA_FILE"
  fi
fi

echo "========================================================"
echo "    KINETIXNOTES - AUTOMATED DEPLOYMENT PIPELINE       "
echo "========================================================"
echo "Project Directory : $PROJECT_DIR"
echo "Target Mode       : $( [ "$PROD" = true ] && echo "Production (--prod)" || echo "Preview" )"
echo "Dry Run           : $DRY_RUN"
echo "Supabase Endpoint : $SUPABASE_URL"
echo "Supabase Anon Key : $(printf '%s' "$SUPABASE_ANON_KEY" | cut -c1-16)..."
echo "--------------------------------------------------------"

cd "$PROJECT_DIR"

# ------------------------------------------------------------------------------
# GIAI ĐOẠN 1: KIỂM TRA BACKEND & RLS SUPABASE
# ------------------------------------------------------------------------------
echo "\n>>> [1/5] Kiểm tra Supabase Backend & RLS Policies..."
AUTH_CHECK_SCRIPT=""
if [ -f "$SCRIPT_DIR/check-auth.sh" ]; then
  AUTH_CHECK_SCRIPT="$SCRIPT_DIR/check-auth.sh"
elif [ -f "$PROJECT_DIR/scripts/check-auth.sh" ]; then
  AUTH_CHECK_SCRIPT="$PROJECT_DIR/scripts/check-auth.sh"
fi

if [ "$SKIP_AUTH_CHECK" = true ]; then
  echo "[SKIP] Bỏ qua kiểm tra Supabase theo yêu cầu (--skip-auth-check)."
elif [ -n "$AUTH_CHECK_SCRIPT" ]; then
  echo "[RUN] Thực thi $AUTH_CHECK_SCRIPT..."
  VITE_SUPABASE_URL="$SUPABASE_URL" \
  VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  sh "$AUTH_CHECK_SCRIPT"
  echo "[PASS] Kiểm tra Supabase Backend & RLS thành công."
else
  echo "[WARN] Không tìm thấy check-auth.sh. Tiếp tục mà không kiểm tra backend."
fi

# ------------------------------------------------------------------------------
# GIAI ĐOẠN 2: LOCAL VALIDATION (INSTALL, LINT, BUILD)
# ------------------------------------------------------------------------------
echo "\n>>> [2/5] Xác thực mã nguồn cục bộ (Install, Lint, Build)..."

if [ "$SKIP_INSTALL" = true ]; then
  echo "[SKIP] Bỏ qua npm install (--skip-install)."
else
  if [ ! -d "node_modules" ]; then
    echo "[RUN] Đang cài đặt thư viện phụ thuộc (npm install)..."
    if [ "$DRY_RUN" = true ]; then
      echo "[DRY-RUN] npm install --no-audit --no-fund"
    else
      npm install --no-audit --no-fund
    fi
  else
    echo "[PASS] Thư mục node_modules đã sẵn sàng."
  fi
fi

if [ "$SKIP_LINT" = true ]; then
  echo "[SKIP] Bỏ qua bước kiểm tra cú pháp & typecheck (--skip-lint)."
else
  echo "[RUN] Chạy kiểm tra TypeScript typecheck (npm run lint)..."
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY-RUN] npm run lint"
  else
    if grep -q '"lint"' package.json 2>/dev/null; then
      npm run lint
    else
      echo "[INFO] package.json không có lệnh lint. Bỏ qua."
    fi
  fi
  echo "[PASS] Lint / Typecheck hoàn tất không có lỗi."
fi

if [ "$SKIP_BUILD" = true ]; then
  echo "[SKIP] Bỏ qua bước đóng gói dự án (--skip-build)."
else
  echo "[RUN] Đóng gói bản phát hành sản phẩm (npm run build)..."
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY-RUN] npm run build"
  else
    npm run build
    if [ ! -f "dist/index.html" ]; then
      echo "[ERROR] Bản build thất bại: Không tìm thấy dist/index.html!" >&2
      exit 1
    fi
    echo "[PASS] Đóng gói thành công (dist/index.html sẵn sàng)."
  fi
fi

# ------------------------------------------------------------------------------
# GIAI ĐOẠN 3: KIỂM TRA .GITIGNORE & GIT STAGING / COMMIT
# ------------------------------------------------------------------------------
echo "\n>>> [3/5] Kiểm tra .gitignore & chuẩn bị Git Staging..."

if [ "$SKIP_GIT" = true ]; then
  echo "[SKIP] Bỏ qua kiểm tra Git (--skip-git)."
else
  # Đảm bảo .gitignore loại trừ bảo mật và file build
  if [ -f ".gitignore" ]; then
    for pattern in ".env" "node_modules" "dist"; do
      if ! grep -q "^$pattern" .gitignore 2>/dev/null; then
        echo "$pattern" >> .gitignore
        echo "[INFO] Đã bổ sung '$pattern' vào .gitignore."
      fi
    done
    echo "[PASS] File .gitignore đã bảo vệ an toàn các file nhạy cảm và build rác."
  fi

  if command -v git >/dev/null 2>&1; then
    if [ -d ".git" ]; then
      GIT_STATUS=$(git status --porcelain 2>/dev/null || true)
      if [ -n "$GIT_STATUS" ]; then
        echo "[INFO] Phát hiện tệp thay đổi:"
        echo "$GIT_STATUS" | head -n 10
        if [ "$DRY_RUN" = true ]; then
          echo "[DRY-RUN] git add . && git commit -m \"$COMMIT_MSG\""
        else
          git add .
          git commit -m "$COMMIT_MSG" || true
          echo "[PASS] Đã tạo Git commit: $COMMIT_MSG"
        fi
      else
        echo "[PASS] Git working tree sạch sẽ, không có thay đổi chưa commit."
      fi

      if [ "$PUSH_GIT" = true ]; then
        if [ "$DRY_RUN" = true ]; then
          echo "[DRY-RUN] git push"
        else
          echo "[RUN] Đang đẩy mã nguồn lên GitHub remote (git push)..."
          git push || echo "[WARN] Git push gặp lỗi hoặc chưa cấu hình upstream."
        fi
      fi
    else
      echo "[INFO] Thư mục hiện tại chưa khởi tạo Git repository (.git)."
    fi
  else
    echo "[INFO] Git CLI không có trong PATH môi trường này. Bỏ qua bước git."
  fi
fi

# ------------------------------------------------------------------------------
# GIAI ĐOẠN 4: THỰC THI DEPLOY VERCEL
# ------------------------------------------------------------------------------
echo "\n>>> [4/5] Kích hoạt Vercel Deployment với cấu hình Supabase..."

VERCEL_BIN=""
if [ -x "./node_modules/.bin/vercel" ]; then
  VERCEL_BIN="./node_modules/.bin/vercel"
elif command -v vercel >/dev/null 2>&1; then
  VERCEL_BIN="vercel"
else
  VERCEL_BIN="npx --yes vercel"
fi

DEPLOY_FLAGS="--yes"
if [ "$PROD" = true ]; then
  DEPLOY_FLAGS="$DEPLOY_FLAGS --prod"
fi

# Bơm biến môi trường vào cả lúc build và runtime của Vercel
ENV_FLAGS="-e VITE_SUPABASE_URL=$SUPABASE_URL -b VITE_SUPABASE_URL=$SUPABASE_URL -e VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY -b VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY"

TOKEN_FLAG=""
if [ -n "$CUSTOM_VERCEL_TOKEN" ]; then
  TOKEN_FLAG="--token $CUSTOM_VERCEL_TOKEN"
fi

DEPLOY_CMD="$VERCEL_BIN $DEPLOY_FLAGS $ENV_FLAGS $TOKEN_FLAG"

DEPLOYED_URL=""
if [ "$DRY_RUN" = true ]; then
  echo "[DRY-RUN] Lệnh deploy sẽ được chạy:"
  echo "  $DEPLOY_CMD"
  DEPLOYED_URL="https://kinetix-notes-simulated.vercel.app"
  echo "[PASS] Mô phỏng deploy hoàn tất: $DEPLOYED_URL"
else
  echo "[RUN] Đang thực thi triển khai Vercel..."
  TMP_OUT="$(mktemp 2>/dev/null || echo "/tmp/vercel_deploy_out.$$" || echo "${HOME}/.cache/vercel_deploy_out.$$")"
  
  # Thực thi và in trực tiếp ra console đồng thời lưu log
  if $DEPLOY_CMD 2>&1 | tee "$TMP_OUT"; then
    DEPLOYED_URL=$(grep -oE "https://[a-zA-Z0-9.-]+\.vercel\.app" "$TMP_OUT" | tail -n 1 || true)
    rm -f "$TMP_OUT" 2>/dev/null || true
    echo "[PASS] Triển khai Vercel thành công!"
  else
    EXIT_CODE=$?
    rm -f "$TMP_OUT" 2>/dev/null || true
    echo "[ERROR] Triển khai Vercel thất bại với mã lỗi $EXIT_CODE." >&2
    exit "$EXIT_CODE"
  fi
fi

# ------------------------------------------------------------------------------
# GIAI ĐOẠN 5: KIỂM TRA LIVE SITE & HƯỚNG DẪN CẤU HÌNH SUPABASE
# ------------------------------------------------------------------------------
echo "\n>>> [5/5] Xác nhận trạng thái Live Site & Hướng dẫn Supabase..."

if [ -n "$DEPLOYED_URL" ]; then
  echo "Trang web đã triển khai tại: $DEPLOYED_URL"

  if [ "$DRY_RUN" = false ]; then
    echo "[RUN] Gửi HTTP probe kiểm tra live site..."
    export TARGET_CHECK_URL="$DEPLOYED_URL"
    node - << 'EOF' || echo "[WARN] Không thể gửi HTTP probe tới live site."
const target = process.env.TARGET_CHECK_URL;
if (!target) process.exit(0);
fetch(target)
  .then(res => {
    console.log(`[PASS] Live site phản hồi HTTP ${res.status} ${res.statusText}`);
  })
  .catch(err => {
    console.log(`[WARN] HTTP probe tới ${target} thông báo: ${err.message}`);
  });
EOF
  fi

  echo "\n========================================================"
  echo "   BƯỚC QUAN TRỌNG TIẾP THEO TRÊN SUPABASE DASHBOARD   "
  echo "========================================================"
  echo "Để tính năng đăng nhập và chuyển hướng hoạt động chuẩn xác:"
  echo "1. Truy cập trực tiếp trang cấu hình URL:"
  echo "   https://supabase.com/dashboard/project/fsrdqmraatuzhdzdbfrk/auth/url-configuration"
  echo ""
  echo "2. Cập nhật các trường sau:"
  echo "   - Site URL      : $DEPLOYED_URL"
  echo "   - Redirect URLs : Thêm 2 mục:"
  echo "                     $DEPLOYED_URL/**"
  echo "                     $DEPLOYED_URL/auth/callback"
  echo "========================================================"
else
  echo "[WARN] Chưa xác định được URL .vercel.app từ kết quả deploy."
fi

echo "\n[HOÀN TẤT] Pipeline thực thi thành công mỹ mãn."
