# BÁO CÁO KỸ THUẬT QUY TRÌNH XỬ LÝ TÀI LIỆU VÀ LẬP CHỈ MỤC RAG (RETRIEVAL-AUGMENTED GENERATION)
**Dự án:** CH Academy  
**Công nghệ:** Java Spring Boot, Apache Tika / PDFBox, OpenAI / OpenRouter Embeddings (`text-embedding-3-small`), PostgreSQL `pgvector`, HNSW Index.  

---

## 1. THIẾT KẾ QUY TRÌNH TIẾP NHẬN TÀI LIỆU (DOCUMENT INGESTION PIPELINE)

Quy trình RAG của CH Academy tuân thủ chuẩn 5 bước khép kín:

```
[File Upload: PDF, DOCX, XLSX, CSV, TXT, PPTX]
  │
  ▼
1. Extraction (Trích xuất văn bản thuần & siêu dữ liệu định dạng)
  │
  ▼
2. Chunking (Phân đoạn đệ quy thông minh: RecursiveCharacterSplitter)
   - Chunk Size: 500 tokens
   - Overlap: 50 tokens (đảm bảo tính liền mạch của ngữ nghĩa)
  │
  ▼
3. Vector Embedding Generation
   - Model: text-embedding-3-small (1536 chiều)
   - Chuẩn hóa vector độ dài đơn vị L2 Norm
  │
  ▼
4. Indexing & Storage
   - Lưu trữ vector vào bảng ai_kb_chunks trên PostgreSQL
   - Đánh chỉ mục HNSW (Hierarchical Navigable Small World) tối ưu tìm kiếm Cosine Similarity
  │
  ▼
5. Retrieval & Re-ranking
   - Tìm kiếm Top-K chunks có điểm tương đồng cao nhất (> 0.75)
   - Truyền ngữ cảnh làm cơ sở (Grounding Context) vào System Prompt của LLM
```

---

## 2. GIAO DIỆN SOI CHI TIẾT TỪNG PHÂN ĐOẠN (CHUNK INSPECTOR)
Trong Tab **"Tài liệu & Chunking"**, Quản trị viên có thể bấm trực tiếp vào nút **"Xem Chunks"** để kiểm tra:
- **Chỉ số phân đoạn:** `#1`, `#2`, `#3`...
- **Số lượng ký tự & Tokens:** Đảm bảo không vượt quá giới hạn ngữ cảnh của mô hình.
- **Vị trí tài liệu:** Số trang, dòng hoặc phân đoạn tương ứng.
- **Vector Embedding Status:** Huy hiệu xác nhận `Vectorized: 1536 dims (PostgreSQL pgvector)`.
- **Trích đoạn thực tế:** Giúp kiểm duyệt nội dung tài liệu trước khi kích hoạt phản hồi tự động.

---

## 3. CƠ CHẾ TÁI LẬP CHỈ MỤC (RE-INDEXING)
1. **Re-index tài liệu đơn lẻ:** Khi tài liệu bị cập nhật nội dung hoặc đổi phiên bản, hệ thống xóa các chunks cũ trong `ai_kb_chunks`, phân đoạn lại và cập nhật vector mới mà không làm gián đoạn các tài liệu khác.
2. **Re-index toàn bộ Kho tri thức:** Quản trị viên có thể kích hoạt tái lập chỉ mục toàn bộ các tài liệu trong kho chỉ với 1 cú click, tự động đồng bộ lại toàn bộ vector embedding.
