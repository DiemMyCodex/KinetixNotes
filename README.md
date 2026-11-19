# KinetixNotes — Micro-Learning & Knowledge Engine

Nền tảng học tập vi mô (Micro-learning) hiệu năng cao, cung cấp các khối kiến thức súc tích thuộc 4 lĩnh vực trọng tâm: **Máy tính**, **Trí tuệ AI**, **Tâm lý & Sống**, và **Kinh tế**. Ứng dụng kết hợp cơ chế đọc tập trung, trắc nghiệm phản xạ logic, và hệ thống lưu trữ đồng bộ đám mây dựa trên Supabase với chính sách bảo mật đa tầng Row-Level Security (RLS).

---

## 1. Tính Năng Cốt Lõi

- **Kho bài học vi mô chuẩn hóa**: Mỗi bài học được cấu trúc chặt chẽ gồm Tiêu đề, Tóm tắt một câu, Danh sách luận điểm cốt lõi, Câu hỏi phản xạ và Đáp án phân tích.
- **Phân loại chuyên sâu (4 chuyên mục)**:
  - 💻 **Máy tính**: Kiến trúc hệ thống, mạng máy tính, thuật toán & dữ liệu.
  - 🤖 **Trí tuệ AI**: Mô hình ngôn ngữ lớn (LLM), học máy, kỹ thuật tạo prompt & tự động hóa.
  - 🧠 **Tâm lý & Sống**: Tâm lý học nhận thức, mô hình tư duy & thói quen hiệu suất cao.
  - 📈 **Kinh tế**: Kinh tế vi mô/vĩ mô, dòng tiền, thị trường & chiến lược kinh doanh.
- **Hệ thống theo dõi tiến độ thông minh (Progress Tracking)**:
  - Khách vãng lai: Lưu tiến độ cục bộ ngay trên trình duyệt thông qua `localStorage`.
  - Người dùng đăng nhập: Tự động đồng bộ hai chiều thời gian thực với bảng `public.user_progress` trên Supabase.
- **Bảo mật phân quyền Zero Trust (PostgreSQL RLS)**:
  - Mọi người dùng đều có quyền đọc (`SELECT`) kho bài học công khai.
  - Chỉ duy nhất tài khoản Quản trị viên (`diemmycodex@gmail.com`) sở hữu quyền thêm (`INSERT`), cập nhật (`UPDATE`) và gỡ bỏ (`DELETE`) bài học trong `public.lessons`.
  - Người dùng thông thường chỉ có toàn quyền với dữ liệu tiến độ cá nhân của chính mình (`auth.uid() = user_id`).
- **Khả năng chịu lỗi cao (Offline/Resilient Fallback)**:
  - Nếu mất kết nối mạng hoặc Supabase tạm thời gián đoạn, ứng dụng tự động kích hoạt bộ dữ liệu nền tảng tích hợp sẵn (bundled catalog fallback), bảo đảm trải nghiệm không bao giờ bị gián đoạn.
  - Service worker (chỉ bật ở bản production) precache vỏ ứng dụng, ưu tiên mạng cho điều hướng và cache-first cho asset đã băm — mở lại app khi ngoại tuyến vẫn đọc được.
- **Điều hướng nhanh & deep link**:
  - Command palette (`⌘K` / `Ctrl K`) tìm bài học hoặc chạy lệnh; phím tắt `?` mở bảng trợ giúp.
  - Mỗi bài có URL riêng (`/bai/:id`) để chia sẻ; nút chia sẻ dùng Web Share API hoặc sao chép liên kết.
  - Chuỗi ngày đọc (streak) lưu cục bộ; vuốt ngang trên thiết bị cảm ứng để chuyển bài.
- **PWA & mobile-first**:
  - Cài được lên màn hình chính (manifest, maskable icon, theme-color theo sáng/tối).
  - Thanh điều hướng đáy, safe-area inset và vùng chạm tối thiểu 38–40px cho điện thoại.

---

## 2. Công Nghệ Sử Dụng

- **Giao diện & Ứng dụng**: Svelte 5 (runes), TypeScript, Vite 8, Tailwind CSS v4, @lucide/svelte, Svelte transitions.
- **Backend & Cơ sở dữ liệu**: Supabase (PostgreSQL 15+, Supabase Auth, Row-Level Security, PostgREST API).
- **Hạ tầng triển khai**: Vercel Edge Network (cấu hình SPA Routing qua `vercel.json`).
- **PWA**: Web App Manifest + service worker tự viết (`public/sw.js`), không phụ thuộc plugin.
- **Kiểm thử**: `npm test` (`tsx --test`, chạy cả 3 file test) + `npm run lint` (`svelte-check`).

---

## 3. Cấu Trúc Mã Nguồn

```text
KinetixNotes/
├── index.html                   # HTML entry point: meta, manifest, theme-color, OG
├── package.json                 # Danh sách thư viện phụ thuộc & lệnh thực thi
├── svelte.config.js             # vitePreprocess cho <script lang="ts">
├── tsconfig.json                # Kiểm tra kiểu TypeScript + Svelte
├── vercel.json                  # SPA rewrites + cache/security headers
├── vite.config.ts               # Bundler Vite, Svelte, Tailwind v4, SW version stamping
├── DEPLOYMENT.md                # Runbook triển khai & vận hành
├── public/
│   ├── manifest.webmanifest     # Metadata cài đặt PWA
│   ├── sw.js                    # Service worker: precache shell, offline fallback
│   ├── og.png                   # Ảnh chia sẻ mạng xã hội 1200×630
│   └── icons/                   # Icon 192/512, maskable, apple-touch, SVG
├── supabase/
│   └── schema.sql               # Bảng lessons, user_progress & chính sách RLS
└── src/
    ├── App.svelte               # State (runes), route, phím tắt, streak, lazy views
    ├── main.ts                  # Svelte mount + đăng ký service worker
    ├── index.css                # Design tokens, primitive classes & motion
    ├── components/
    │   ├── AddLessonModal.svelte # Modal tạo bài học mới (Admin)
    │   ├── AuthView.svelte      # Đăng nhập / đăng ký (split layout)
    │   ├── CategoryTabs.svelte  # Lọc 4 chuyên mục, icon + màu riêng
    │   ├── CommandPalette.svelte # Tìm bài + chạy lệnh (⌘K)
    │   ├── LessonReader.svelte  # Trình đọc, quiz, chia sẻ, vuốt chuyển bài
    │   ├── LibrarySidebar.svelte # Danh sách, tìm kiếm, vòng tiến độ
    │   ├── MobileTabBar.svelte  # Điều hướng đáy trên di động
    │   ├── ShortcutsDialog.svelte # Bảng phím tắt (?)
    │   └── TopHeader.svelte     # Header, scope filter, streak, theme, auth
    ├── data/
    │   └── lessons.json         # Kho bài học mặc định (offline fallback)
    ├── lib/
    │   ├── categoryMeta.ts      # Icon & màu theo chuyên mục
    │   ├── router.ts            # Parse `/bai/:id`, `/login`, `/register`
    │   ├── streak.ts            # Chuỗi ngày đọc lưu localStorage
    │   ├── supabase.ts          # Supabase client từ biến môi trường
    │   └── dialogA11y.ts        # Svelte action: focus trap, Esc, scroll lock, focus restore
    ├── services/
    │   ├── supabaseHelpers.ts   # Chuẩn hóa dữ liệu, kiểm tra quyền admin
    │   └── supabaseSync.ts      # PostgREST: lessons & user progress
    └── types/
        └── lesson.ts            # Interface & Types (Lesson, Category, User)
```

### Phím tắt

| Phím | Hành động |
| :--- | :--- |
| `⌘K` / `Ctrl K` | Mở command palette (tìm bài + lệnh) |
| `/` | Focus ô tìm kiếm trong tủ sách |
| `←` / `→` | Bài trước / bài tiếp theo |
| `T` | Đổi giao diện sáng / tối |
| `R` | Ôn bài ngẫu nhiên |
| `?` | Mở bảng phím tắt |
| `Esc` | Đóng hộp thoại |

---

## 4. Hướng Dẫn Cài Đặt & Phát Triển Cục Bộ (Local Development)

### Yêu cầu tiên quyết:
- **Node.js**: `>=22.0.0` (Supabase JS yêu cầu 22+; Vite 8 yêu cầu `^20.19 || >=22.12`). `npm` 9+.
- **npm**: Phiên bản 9 trở lên (hoặc `bun` / `pnpm`).

### Các bước khởi chạy:

1. **Cài đặt các gói phụ thuộc**:
   ```bash
   npm install
   ```

2. **Cấu hình biến môi trường**:
   Sao chép tệp mẫu `.env.example` thành `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Khai báo thông số Supabase của dự án:
   ```env
   VITE_SUPABASE_URL=https://fsrdqmraatuzhdzdbfrk.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_SxgPR39Zr1OPdNOC80yXRg_yOVSXyaS
   ```

3. **Khởi chạy máy chủ phát triển (Development Server)**:
   ```bash
   npm run dev
   ```
   Mở trình duyệt truy cập: `http://localhost:3000` (hoặc cổng được hiển thị trên terminal).

4. **Kiểm tra kiểu dữ liệu & mã nguồn**:
   ```bash
   npm run lint
   ```

5. **Đóng gói bản sản xuất (Production Build)**:
   ```bash
   npm run build
   ```

---

## 5. Quy Trình Triển Khai & Vận Hành (Deployment)

Tài liệu chi tiết từng bước xem tại **[DEPLOYMENT.md](./DEPLOYMENT.md)**. Tóm tắt các khâu trọng yếu:

1. **Khởi tạo Database & RLS trên Supabase**:
   - Truy cập **Supabase Dashboard -> SQL Editor**.
   - Chạy toàn bộ mã trong file `supabase/schema.sql` để thiết lập bảng `lessons`, `user_progress` và các policy kiểm tra `auth.jwt() ->> 'email' = 'diemmycodex@gmail.com'`.
2. **Kích hoạt tài khoản Quản trị viên**:
   - Tại **Supabase Dashboard -> Authentication -> Users**, xác nhận tài khoản `diemmycodex@gmail.com` đã được tạo và kích hoạt (Confirmed).
3. **Triển khai lên Vercel**:
   - Thiết lập Project với Preset `Vite`, Root Directory `./`, Build Command `npm run build`, Output Directory `dist`.
   - Cấu hình 2 biến môi trường:
     - `VITE_SUPABASE_URL`: `https://fsrdqmraatuzhdzdbfrk.supabase.co`
     - `VITE_SUPABASE_ANON_KEY`: `sb_publishable_SxgPR39Zr1OPdNOC80yXRg_yOVSXyaS`
   - Kích hoạt **Redeploy** để Vite nhúng biến môi trường vào client bundle.
4. **Cấu hình URL Chuyển Hướng**:
   - Trong **Supabase Dashboard -> Authentication -> URL Configuration**, điền domain Vercel thực tế vào **Site URL** và bổ sung vào danh sách **Redirect URLs** (`https://<domain-vercel>.vercel.app/**`).
5. **Kiểm thử thực tế (Smoke Testing)**:
   - Xác minh truy cập vãng lai, đăng ký/đăng nhập người dùng thông thường (chỉ lưu tiến độ), và tài khoản admin `diemmycodex@gmail.com` (toàn quyền thêm/sửa bài học mới).

---

## 6. Chính Sách Bảo Mật & Đóng Góp

- Tuyệt đối không bao giờ commit các tệp bí mật (`.env`, `.env.local`, Private API Keys, Service Role Keys) vào Git repository.
- Mọi đóng góp bài học mới đều được giám sát và lưu trữ an toàn thông qua cơ chế RLS có xác thực email của tác giả.
