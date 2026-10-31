# BÁO CÁO THỰC THI KHO TRI THỨC VÀ TRUY XUẤT TÀI LIỆU (KNOWLEDGE BASE & RAG REPORT)

**Hệ thống:** CH Academy RAG Runtime  
**Ngày kiểm toán:** 31/10/2026  

---

## I. KIẾN TRÚC RAG (RETRIEVAL-AUGMENTED GENERATION)

Nhằm đảm bảo phản hồi của AI chính xác 100%, không bịa đặt hoặc gây ảo giác (Hallucination), CH Academy thiết kế quy trình xử lý tài liệu đa định dạng tương tự cơ chế `kb-worker` của NEXVA:

```text
Tài liệu (PDF / DOCX / XLSX / TXT / URL)
   │
   ▼
1. Trích xuất Text & Chuẩn hóa Unicode tiếng Việt (NFC)
   │
   ▼
2. Phân đoạn nội dung (Chunking: 500 - 800 tokens, 10% overlap)
   │
   ▼
3. Tạo vector đại diện (Embedding Generator)
   │
   ▼
4. Lưu trữ Vector Database (PostgreSQL pgvector / HNSW index)
   │
   ▼
5. Truy xuất ngữ cảnh (Hybrid Search: Cosine Similarity + BM25 FTS)
   │
   ▼
6. Ghép Prompt & Sinh phản hồi kèm Trích dẫn nguồn (Sources Citations)
```

---

## II. QUY CHUẨN TRÍCH DẪN NGUỒN TÀI LIỆU (CITATIONS)

Mọi phản hồi có sử dụng tri thức RAG đều trả về danh sách nguồn trong trường `sources`:
```json
{
  "answer": "Theo Quy chế Đào tạo CH Academy, học viên cần đạt tỷ lệ chuyên cần tối thiểu 80% để đủ điều kiện tham dự kỳ thi cuối khóa.",
  "sources": [
    {
      "documentName": "Quy_che_dao_tao_2026.pdf",
      "section": "Điều 12. Điều kiện dự thi",
      "snippet": "Học viên phải tham gia tối thiểu 80% tổng số buổi học của lớp..."
    }
  ]
}
```

Trên giao diện Frontend ([`MessageBubble.tsx`](file:///e:/CA_NHAN/CH_Academy/frontend/src/components/chat/MessageBubble.tsx)), các nguồn này được hiển thị thành các pill trích dẫn nguồn có thể mở rộng xem chi tiết trích đoạn, tạo niềm tin tối đa cho học viên và phụ huynh.

