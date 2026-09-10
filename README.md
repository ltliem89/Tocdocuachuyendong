# Mô Phỏng Khám Phá Tốc Độ Chuyển Động (KHTN 7)

Ứng dụng mô phỏng trực quan phục vụ dạy và học môn Khoa học tự nhiên lớp 7:
- **5 Chế độ học tập:** Khởi động đo đạc, Khám phá thương số $s/t$, So sánh tốc độ, Đổi đơn vị (m/s & km/h), Luyện tập tính toán ($s = v \times t$, $t = s / v$).
- **Mô hình vận động viên chuyển động thực tế:** Hoạt họa chân dung, tay chân khớp động học mượt mà (60 FPS).
- **3 Đường đua độc lập:** 3 màu sắc riêng biệt (Sapphire, Emerald, Amber), tên nổi bật không bị vạch xuất phát che.

---

## 🚀 Triển khai nhanh lên Vercel (Deployment)

Dự án đã được cấu hình đầy đủ với `vercel.json` và `package-lock.json` chuẩn Vite SPA.

### Cách 1: Kết nối trực tiếp qua GitHub & Vercel (Khuyên dùng)
1. Đẩy dự án lên kho GitHub của bạn (hoặc chọn **Export to GitHub** từ AI Studio).
2. Đăng nhập vào [Vercel](https://vercel.com).
3. Nhấp **Add New...** > **Project** và chọn kho GitHub vừa tạo.
4. Vercel sẽ tự động nhận diện thiết lập qua tệp `vercel.json`:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. Nhấp **Deploy** là xong!

### Cách 2: Triển khai bằng Vercel CLI từ máy tính
```bash
# Cài đặt Vercel CLI (nếu chưa có)
npm i -g vercel

# Đăng nhập và triển khai
vercel
```

---

## 💻 Cài đặt và chạy trên máy tính cá nhân (Local Development)

### Yêu cầu
- Node.js >= 18.0.0 (khuyến nghị Node 20+)
- npm >= 9.0.0

### Các bước thực hiện
```bash
# 1. Cài đặt thư viện phụ thuộc
npm install

# 2. Khởi chạy máy chủ phát triển
npm run dev

# 3. Kiểm tra lỗi TypeScript
npm run lint

# 4. Đóng gói sản phẩm cho môi trường Production
npm run build

# 5. Xem trước bản build production
npm run preview
```

---

## 📂 Cấu trúc mã nguồn chính
- `src/components/TrackCanvas.tsx`: Khung đường đua 3 làn màu sắc, thước đo khoảng cách và vạch xuất phát/đích.
- `src/components/RealisticEntity.tsx`: Bộ mô hình hoạt họa thể thao chân thực (vận động viên chạy, đi bộ, xe đạp, ô tô, xe buýt).
- `src/components/Mode1Warmup.tsx`: Khởi động - Đo thời gian và quãng đường 3 bạn.
- `src/components/Mode2Discovery.tsx`: Khám phá - Tính thương số $s/t$ và ý nghĩa tốc độ trong 1 giây.
- `src/components/Mode3Compare.tsx`: So sánh tốc độ chuyển động giữa các phương tiện & vật thể.
- `src/components/Mode4UnitConversion.tsx`: Đổi đơn vị trực quan giữa m/s và km/h kèm thang đo trực tiếp.
- `src/components/Mode5Practice.tsx`: Luyện tập vận dụng công thức tính $v, s, t$ với đồ họa mô phỏng kiểm chứng.
- `vercel.json`: Tệp cấu hình chuẩn cho Vercel SPA routing & caching.
