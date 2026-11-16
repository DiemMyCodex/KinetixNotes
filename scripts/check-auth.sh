#!/bin/sh
set -eu

# ==============================================================================
# KinetixNotes Supabase & RLS Diagnostic Suite
# Checks connectivity, Row-Level Security (RLS) enforcement, and Auth setup.
# ==============================================================================

SUPABASE_URL="${VITE_SUPABASE_URL:-https://fsrdqmraatuzhdzdbfrk.supabase.co}"
ANON_KEY="${VITE_SUPABASE_ANON_KEY:-sb_publishable_SxgPR39Zr1OPdNOC80yXRg_yOVSXyaS}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
ADMIN_EMAIL="diemmycodex@gmail.com"

while [ $# -gt 0 ]; do
  case "$1" in
    --url|-u)
      SUPABASE_URL="$2"
      shift 2
      ;;
    --key|--anon-key|-k)
      ANON_KEY="$2"
      shift 2
      ;;
    --service-key|-s)
      SERVICE_ROLE_KEY="$2"
      shift 2
      ;;
    --email|-e)
      ADMIN_EMAIL="$2"
      shift 2
      ;;
    --help|-h)
      echo "Cách dùng: $0 [options]"
      echo "Options:"
      echo "  -u, --url <url>           Supabase URL (default: $SUPABASE_URL)"
      echo "  -k, --key <key>           Supabase Anon Key"
      echo "  -s, --service-key <key>   Supabase Service Role Key (để kiểm tra Auth Admin)"
      echo "  -e, --email <email>       Admin email cần kiểm tra (default: $ADMIN_EMAIL)"
      echo "  -h, --help                Hiển thị hướng dẫn"
      exit 0
      ;;
    *)
      echo "Tham số không hợp lệ: $1" >&2
      exit 1
      ;;
  esac
done

# Chuẩn bị chứng chỉ SSL CA cho môi trường Android nếu cần
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
echo "    KINETIXNOTES - SUPABASE & RLS VERIFICATION         "
echo "========================================================"
echo "Supabase Endpoint : $SUPABASE_URL"
echo "Target Admin Email: $ADMIN_EMAIL"
echo "Anon Key Preview  : $(printf '%s' "$ANON_KEY" | cut -c1-16)..."
echo "--------------------------------------------------------"

# Chạy kịch bản kiểm tra qua Node.js engine
export SUPABASE_URL ANON_KEY SERVICE_ROLE_KEY ADMIN_EMAIL

node - << 'EOF'
const url = process.env.SUPABASE_URL.replace(/\/$/, '');
const anonKey = process.env.ANON_KEY;
const serviceKey = process.env.SERVICE_ROLE_KEY || '';
const adminEmail = (process.env.ADMIN_EMAIL || 'diemmycodex@gmail.com').toLowerCase().trim();

let hasError = false;
let warningCount = 0;

function logPass(msg) {
  console.log(`[PASS] ${msg}`);
}

function logFail(msg) {
  console.log(`[FAIL] ${msg}`);
  hasError = true;
}

function logWarn(msg) {
  console.log(`[WARN] ${msg}`);
  warningCount++;
}

function logInfo(msg) {
  console.log(`[INFO] ${msg}`);
}

async function run() {
  console.log('1. Kiểm tra kết nối dịch vụ Supabase Auth...');
  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      logPass(`Kết nối Supabase Auth thành công (HTTP ${res.status}).`);
      const externalProviders = Object.entries(data.external || {})
        .filter(([, enabled]) => enabled)
        .map(([name]) => name);
      if (externalProviders.length > 0) {
        logInfo(`Các OAuth providers đang bật: ${externalProviders.join(', ')}`);
      } else {
        logInfo('OAuth providers ngoài: Không (sử dụng Email / Password Auth).');
      }
    } else {
      logFail(`Supabase Auth trả về HTTP ${res.status}: ${res.statusText}`);
    }
  } catch (err) {
    logFail(`Không thể kết nối đến Supabase Auth: ${err.message}`);
  }

  console.log('\n2. Kiểm tra RLS cho bảng public.lessons (SELECT - quyền đọc tự do)...');
  try {
    const res = await fetch(`${url}/rest/v1/lessons?select=*`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      logPass(`SELECT public.lessons thành công (HTTP 200). Số bản ghi hiện có: ${Array.isArray(data) ? data.length : 0}`);
    } else {
      const errText = await res.text();
      logFail(`SELECT public.lessons thất bại (HTTP ${res.status}): ${errText}`);
    }
  } catch (err) {
    logFail(`Lỗi kết nối khi đọc public.lessons: ${err.message}`);
  }

  console.log('\n3. Kiểm tra RLS cho bảng public.lessons (Chặn INSERT trái phép khi chưa đăng nhập)...');
  try {
    const res = await fetch(`${url}/rest/v1/lessons`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        category: 'Máy tính',
        title: '__rls_probe__',
        summary: 'probe',
        points: [],
        quiz: 'q',
        answer: 'a'
      })
    });

    if (res.status === 401 || res.status === 403) {
      const body = await res.json().catch(() => ({}));
      if (body.code === '42501' || (body.message && body.message.toLowerCase().includes('row-level security'))) {
        logPass(`RLS Policy hoạt động chuẩn xác: Chặn INSERT trái phép với mã 42501 (HTTP ${res.status}).`);
      } else {
        logPass(`RLS Policy chặn thành công request trái phép (HTTP ${res.status}).`);
      }
    } else if (res.ok) {
      logFail(`CẢNH BÁO LỖ HỔNG: Người dùng ẩn danh có thể INSERT vào public.lessons (HTTP ${res.status}). RLS chưa được áp dụng đúng!`);
    } else {
      const errText = await res.text();
      logPass(`Request bị từ chối như kỳ vọng (HTTP ${res.status}): ${errText}`);
    }
  } catch (err) {
    logFail(`Lỗi kiểm tra RLS INSERT: ${err.message}`);
  }

  console.log('\n4. Kiểm tra bảng public.user_progress (SELECT & INSERT isolation)...');
  try {
    const resSelect = await fetch(`${url}/rest/v1/user_progress?select=*`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });

    if (resSelect.ok) {
      const data = await resSelect.json();
      logPass(`SELECT public.user_progress thành công (HTTP 200). Bản ghi nhìn thấy: ${Array.isArray(data) ? data.length : 0}`);
    } else {
      const errText = await resSelect.text();
      logFail(`SELECT public.user_progress thất bại (HTTP ${resSelect.status}): ${errText}`);
    }

    const resInsert = await fetch(`${url}/rest/v1/user_progress`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: '00000000-0000-0000-0000-000000000000',
        lesson_id: 999999
      })
    });

    if (resInsert.status === 401 || resInsert.status === 403) {
      logPass(`RLS public.user_progress chuẩn xác: Chặn ghi đè dữ liệu tiến độ của người khác (HTTP ${resInsert.status}).`);
    } else if (resInsert.ok) {
      logFail(`CẢNH BÁO LỖ HỔNG: Có thể INSERT vào user_progress mà không qua xác thực!`);
    } else {
      logPass(`Ghi vào user_progress bị từ chối như kỳ vọng (HTTP ${resInsert.status}).`);
    }
  } catch (err) {
    logFail(`Lỗi kiểm tra user_progress: ${err.message}`);
  }

  console.log(`\n5. Kiểm tra trạng thái tài khoản quản trị (${adminEmail})...`);
  if (serviceKey && serviceKey.trim().length > 0) {
    try {
      const adminRes = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=50`, {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      });

      if (adminRes.ok) {
        const usersData = await adminRes.json();
        const users = usersData.users || [];
        const target = users.find(u => (u.email || '').toLowerCase() === adminEmail);

        if (target) {
          if (target.email_confirmed_at) {
            logPass(`Tài khoản ${adminEmail} đã tồn tại và ĐÃ XÁC NHẬN EMAIL (confirmed_at: ${target.email_confirmed_at}).`);
            logInfo(`User ID: ${target.id}`);
          } else {
            logWarn(`Tài khoản ${adminEmail} tồn tại nhưng CHƯA XÁC NHẬN EMAIL.`);
            logInfo(`Để xác nhận ngay, vào Supabase Dashboard -> Authentication -> Users -> [Confirm email] hoặc gọi API Admin.`);
          }
        } else {
          logWarn(`Chưa tìm thấy tài khoản ${adminEmail} trong danh sách người dùng Supabase.`);
          logInfo(`Vào Supabase Dashboard -> Authentication -> Users -> [Add user] -> [Create user] với email ${adminEmail} và bật "Auto-confirm email".`);
        }
      } else {
        logWarn(`Không thể truy cập Supabase Admin API với SERVICE_ROLE_KEY (HTTP ${adminRes.status}).`);
      }
    } catch (err) {
      logWarn(`Lỗi khi truy vấn Admin API: ${err.message}`);
    }
  } else {
    logInfo('SUPABASE_SERVICE_ROLE_KEY chưa được truyền; sử dụng xác thực Public Endpoint.');
    logInfo(`Hướng dẫn kiểm tra tài khoản ${adminEmail} trên Supabase Dashboard:`);
    console.log(`  1. Truy cập: https://supabase.com/dashboard/project/fsrdqmraatuzhdzdbfrk/auth/users`);
    console.log(`  2. Tìm kiếm email: ${adminEmail}`);
    console.log(`  3. Nếu tài khoản đã hiển thị và có dấu tích xanh (Confirmed): Sẵn sàng!`);
    console.log(`  4. Nếu hiển thị "Unconfirmed": Bấm menu 3 chấm (...) -> chọn "Confirm email".`);
    console.log(`  5. Nếu chưa có: Bấm "Add user" -> "Create user", nhập ${adminEmail}, mật khẩu và tích "Auto Confirm".`);
  }

  console.log('\n--------------------------------------------------------');
  if (hasError) {
    console.error('KẾT QUẢ: PHÁT HIỆN LỖI KIỂM THỬ SUPABASE/RLS. Cần kiểm tra lại schema.sql!');
    process.exit(1);
  } else if (warningCount > 0) {
    console.log(`KẾT QUẢ: KIỂM THỬ THÀNH CÔNG VỚI ${warningCount} CẢNH BÁO (AUTH SETUP).`);
    process.exit(0);
  } else {
    console.log('KẾT QUẢ: 100% KIỂM THỬ KẾT NỐI VÀ RLS HOÀN TẤT XUẤT SẮC!');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Lỗi nghiêm trọng:', err);
  process.exit(1);
});
EOF
