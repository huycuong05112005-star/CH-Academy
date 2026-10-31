# BÁO CÁO BẢO MẬT: 03. AN TOÀN VECTOR DATABASE VÀ TRUY VẤN RAG

**Dự án:** CH Academy  
**Phân loại rủi ro:** P2 - Medium (CWE-943)  
**Tiêu chuẩn đối chiếu:** OWASP Top 10 for LLM Applications (LLM01: Prompt Injection, LLM07: System Information Leakage)

---

## 1. PHẠM VI VECTOR DB & RAG PIPELINE
- Module tri thức AI: `KnowledgeBaseService.java`, `RAGRetrievalService.java`, `VectorStore`.
- Lưu trữ Embedding tri thức khóa học, quy chế tuyển sinh, tài liệu giảng dạy.

## 2. KẾT QUẢ ĐÁNH GIÁ
1. **Vector Query Filtering:** Các truy vấn tương đồng cosin (Cosine Similarity) được ràng buộc chặt chẽ với `portal` và `target_audience`. Học viên không thể truy vấn nhầm tài liệu nội bộ của Giảng viên hay Quản trị viên.
2. **Embedding Injection:** Dữ liệu tài liệu đầu vào được làm sạch, loại bỏ các ký tự điều khiển và markdown độc hại trước khi đưa vào mô hình tạo embedding vector.

## 3. KẾT LUẬN
- Trạng thái: **AN TOÀN (PASS)**.
