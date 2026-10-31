# 17. DEPENDENCY AUDIT Security Report

## Status: PASS (SPRING BOOT 3.5 & REACT 19 ĐÃ CẬP NHẬT)

## Findings
1. **Backend Dependencies (Maven `pom.xml`):**
   - Spring Boot: `3.5.0`
   - Spring Framework: `6.2.7`
   - Hibernate ORM: `6.6.15.Final`
   - JJWT: `0.12.6` (Thư viện JWT chuẩn mới, loại bỏ các lỗ hổng parser cũ)
   - PostgreSQL Driver: `42.7.5`
2. **Frontend Dependencies (NPM `package.json`):**
   - React: `19.0.0`
   - Vite: `8.3.5`
   - Lucide React, TailwindCSS

## What's at risk
- Các lỗ hổng bảo mật đã công bố (CVE) trong các thư viện phụ thuộc của bên thứ ba (như Log4Shell trong log4j hoặc Prototype Pollution trong các gói npm cũ).

## What's already secure
- Dự án sử dụng các phiên bản hiện đại của Spring Boot 3 và React 19, không sử dụng các thư viện đã bị cảnh báo lỗ hổng nghiêm trọng.

## Recommendations
- Định kỳ chạy `npm audit` và theo dõi cảnh báo từ Dependabot trên GitHub.

## Remediation Implemented
- Đã thẩm định cây phụ thuộc Maven và NPM: Không phát hiện phụ thuộc nào có CVE Critical đang bị khai thác.

## Verification Results
- Build Maven và Build Vite hoàn thành 100% không có xung đột phụ thuộc.
