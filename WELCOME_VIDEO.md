# Video chào mừng ở hero

Khung video đã được đặt bên trái thông tin đăng ký. Trên điện thoại, video và thông tin đăng ký xếp dọc.

Video hiện tại: https://youtu.be/XEcMKc6SMe8. Khách bấm play để xem YouTube trong popup ngay trên landing page, không mở trang khác.

## Gắn video

Trong `index.html`, tìm nút có `id="welcome-video-trigger"` và điền link vào `data-video-src=""`.

- YouTube: dùng link xem video hoặc link chia sẻ `youtu.be`.
- Vimeo: dùng link video; link không công khai có mã riêng cũng được hỗ trợ.
- MP4/WebM: đặt file trong `assets/videos/`, rồi điền đường dẫn, ví dụ `data-video-src="assets/videos/welcome.mp4"`.

Nút play tự bật khi có nguồn video hợp lệ. Video chỉ tải khi khách bấm xem, mở trong popup và dừng khi popup đóng. Khi chưa gắn video, ảnh bìa hiện “Sắp ra mắt”.

Ảnh bìa hiện dùng `assets/hero/welcome-thumbnail-v2.webp` (1200 × 675, khoảng 62 KB) và bản mobile `assets/hero/welcome-thumbnail-v2-mobile.webp` (640 × 360, khoảng 26 KB). Ảnh được tạo bằng công cụ tạo ảnh, dựa trên ảnh chân dung thật của Nam Nguyễn. Khi thay ảnh, cập nhật cả `src` và `srcset` của ảnh nằm trong nút video.
