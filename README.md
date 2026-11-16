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

---

## 2. Công Nghệ Sử Dụng

- **Giao diện & Ứng dụng**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Framer Motion (`motion`).
- **Backend & Cơ sở dữ liệu**: Supabase (PostgreSQL 15+, Supabase Auth, Row-Level Security, PostgREST API).
- **Hạ tầng triển khai**: Vercel Edge Network (cấu hình SPA Routing qua `vercel.json`).

---

## 3. Cấu Trúc Mã Nguồn

```text
KinetixNotes/
├── index.html                   # HTML entry point với cấu hình viewport chuẩn mobile & desktop
├── package.json                 # Danh sách thư viện phụ thuộc & lệnh thực thi
├── tsconfig.json                # Cấu hình kiểm tra kiểu tĩnh TypeScript
├── vercel.json                  # Cấu hình routing SPA & build command cho Vercel
├── vite.config.ts               # Cấu hình bundler Vite & Tailwind v4
├── DEPLOYMENT.md                # Tài liệu quy trình triển khai & vận hành chi tiết (Runbook)
├── supabase/
│   └── schema.sql               # Định nghĩa bảng lessons, user_progress & chính sách RLS
└── src/
    ├── App.tsx                  # Điều phối luồng màn hình, quản trị trạng thái & định tuyến
    ├── main.tsx                 # Điểm khởi chạy React DOM
    ├── index.css                # Style toàn cục & cấu hình theme
    ├── components/
    │   ├── AddLessonModal.tsx   # Modal tạo bài học mới (dành riêng cho Admin)
    │   ├── AuthView.tsx         # Màn hình đăng nhập & đăng ký người dùng
    │   ├── CategoryTabs.tsx     # Bộ lọc theo 4 phân loại bài học
    │   ├── LessonReader.tsx     # Trình đọc bài học chi tiết, quiz tương tác & nút đánh dấu
    │   ├── LibrarySidebar.tsx   # Danh sách danh mục bài học & tiến độ hoàn thành
    │   └── TopHeader.tsx        # Thanh điều hướng trên cùng, huy hiệu user & nút quản trị
    ├── data/
    │   └── defaultLessons.ts    # Kho bài học nền tảng mặc định (offline fallback)
    ├── lib/
    │   └── supabase.ts          # Khởi tạo Supabase client với biến môi trường
    ├── services/
    │   ├── supabaseHelpers.ts   # Hàm chuẩn hóa dữ liệu, kiểm tra quyền admin diemmycodex@gmail.com
    │   └── supabaseSync.ts      # Hàm tương tác PostgREST: fetch/insert lessons & user progress
    └── types/
        └── lesson.ts            # Định nghĩa Interface & Types (Lesson, Category, User)
```

---

## 4. Hướng Dẫn Cài Đặt & Phát Triển Cục Bộ (Local Development)

### Yêu cầu tiên quyết:
- **Node.js**: Phiên bản 18 trở lên (khuyến nghị Node 20+).
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
