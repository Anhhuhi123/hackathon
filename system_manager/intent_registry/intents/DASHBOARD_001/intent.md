# Intent: DASHBOARD_001
# Title: Football Betting Dashboard
# Status: PROCESSING
# Created: 2026-05-26T03:21:26Z

---

## Business Objective
Tạo một dashboard sau đăng nhập để người dùng xem các trận bóng đá đang mở cược, chọn kèo, nhập số tiền cược và theo dõi trạng thái các cược của mình một cách nhanh, rõ ràng và đáng tin cậy.

## Inferred Requirements
### Functional Requirements
1. Sau khi đăng nhập thành công, người dùng được chuyển thẳng vào dashboard.
2. Dashboard hiển thị danh sách trận bóng đá đang mở cược với các thông tin cần thiết như đội bóng, thời gian, giải đấu và tỷ lệ cược.
3. Người dùng có thể lọc hoặc tìm trận theo đội bóng, giải đấu, thời gian và trạng thái cược.
4. Người dùng có thể xem chi tiết một trận để xem các lựa chọn cược khả dụng.
5. Người dùng có thể chọn một hoặc nhiều lựa chọn cược để tạo bet slip.
6. Người dùng có thể nhập số tiền cược và xem giá trị dự kiến trước khi xác nhận.
7. Hệ thống phải cho phép người dùng kiểm tra lại thông tin trước khi chốt cược.
8. Người dùng có thể xác nhận đặt cược và nhận phản hồi trạng thái rõ ràng ngay sau khi gửi.
9. Dashboard hiển thị số dư hoặc nguồn lực khả dụng liên quan đến cược để người dùng biết giới hạn hiện tại.
10. Người dùng có thể xem danh sách cược đang mở, cược đã chốt và lịch sử cược trước đó.
11. Khi dữ liệu trận đấu hoặc tỷ lệ cược thay đổi, giao diện cần phản ánh cập nhật đó ở mức hợp lý.
12. Người dùng có thể đăng xuất hoặc được đưa về trang an toàn nếu phiên làm việc không còn hợp lệ.
13. Nếu đây là môi trường demo, giao diện phải thể hiện rõ dữ liệu mô phỏng thay vì dữ liệu thật.

## UX Expectations
- **Loading**: Khi vào dashboard hoặc tải dữ liệu trận đấu, phải có trạng thái loading rõ ràng thay vì màn hình trống.
- **Error**: Nếu dữ liệu không tải được, phiên hết hạn, hoặc cược không hợp lệ, phải hiển thị thông báo ngắn gọn, cụ thể và có hướng xử lý tiếp theo.
- **Success**: Sau khi đặt cược thành công, cần có phản hồi tức thời và cập nhật ngay vào danh sách cược hoặc lịch sử.
- Giao diện cần ưu tiên tốc độ đọc thông tin vì người dùng phải nhìn odds và trận đấu rất nhanh.
- Các thành phần quan trọng như số tiền cược, nút xác nhận và trạng thái cược phải nổi bật hơn các thông tin phụ.
- Trải nghiệm phải ổn trên desktop và không vỡ layout trên mobile.

## Edge Cases
| Case | Expected Behavior |
|---|---|
| Phiên đăng nhập hết hạn khi vừa vào dashboard | Điều hướng về login hoặc yêu cầu đăng nhập lại, không cho tiếp tục thao tác trên dữ liệu cũ. |
| Tỷ lệ cược thay đổi ngay trước lúc xác nhận | Hiển thị cảnh báo và yêu cầu người dùng xác nhận lại trước khi chốt cược. |
| Số tiền cược vượt quá giới hạn khả dụng | Chặn thao tác và báo rõ lý do người dùng không thể đặt mức đó. |
| Người dùng nhấn xác nhận nhiều lần | Ngăn double-submit và chỉ ghi nhận một lần đặt cược. |
| Mất kết nối khi gửi yêu cầu đặt cược | Thông báo lỗi mạng rõ ràng và cho phép thử lại an toàn. |
| Dữ liệu trận đấu bị trống hoặc lỗi từ nguồn cấp | Hiển thị trạng thái không có dữ liệu thay vì làm hỏng toàn bộ dashboard. |
| Người dùng mở dashboard trên thiết bị nhỏ | Layout phải co giãn tốt, không che mất nút xác nhận hoặc bet slip. |

## Security Expectations
- Chỉ người dùng đã xác thực mới được truy cập dashboard và thao tác đặt cược.
- Các thao tác đặt cược phải được bảo vệ khỏi giả mạo phiên hoặc submit không hợp lệ.
- Dữ liệu đầu vào như số tiền cược, lựa chọn kèo và bộ lọc phải được kiểm tra hợp lệ trước khi chấp nhận.
- Các hành động nhạy cảm phải có xác nhận rõ ràng để giảm rủi ro thao tác nhầm hoặc lạm dụng.
- Hệ thống phải ngăn việc người dùng sử dụng trạng thái cũ của odds hoặc dữ liệu trận đấu để đặt cược sai lệch.
- Nếu có tiền thật, phải có yêu cầu tuân thủ và bảo vệ người dùng tương ứng với lĩnh vực betting.
- Dữ liệu cá nhân, số dư và lịch sử cược phải được bảo vệ khỏi truy cập trái phép.

## Out of Scope
- Thiết kế API hoặc flow kỹ thuật tích hợp.
- Quyết định database schema.
- Xây dựng cổng đăng ký tài khoản.
- Xây dựng nạp/rút tiền chi tiết.
- Xây dựng admin panel hoặc hệ thống quản trị nhà cái.
- Hỗ trợ nhiều môn thể thao khác ngoài bóng đá.
- Phân tích thuật toán odds hoặc nguồn dữ liệu thể thao.

## Open Questions
1. Đây là giao diện đặt cược thật hay chỉ là demo/mô phỏng?
2. Có liên quan tiền thật, nạp/rút tiền hay chỉ là điểm/credit nội bộ?
3. Phạm vi chỉ là bóng đá hay có thể mở rộng sang các môn khác sau này?
4. Có yêu cầu live betting theo thời gian thực hay chỉ cược trước trận?
5. Thị trường vận hành có ràng buộc pháp lý nào cần phản ánh vào sản phẩm không?
