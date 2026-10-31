# BÁO CÁO PHÂN ĐỊNH KIẾN TRÚC: KHO TRI THỨC VÀ QUY TRÌNH XỬ LÝ TÀI LIỆU (CHUNK PIPELINE)
**Dự án:** CH Academy  
**Thời gian:** 31/10/2026  

---

## 1. MỤC TIÊU VÀ SỰ CẦN THIẾT CỦA VIỆC TÁCH BIỆT
Trong các hệ thống RAG quy mô lớn, việc đồng nhất giữa "Kho tri thức" (Knowledge Base) và "Quy trình xử lý tài liệu" (Document Ingestion Pipeline) dẫn đến sự nhập nhằng trong quản trị phân quyền (Access Control) và khó khăn trong việc theo dõi vòng đời dữ liệu.

- **Kho tri thức (Knowledge Base):** Là đơn vị logic gom nhóm tài liệu theo nghiệp vụ, xác định đối tượng người dùng có quyền tra cứu (`PUBLIC`, `INTERNAL`, `TEACHER_ONLY`, `ADMIN_ONLY`, `COURSE_SCOPED`, `CLASS_SCOPED`), và phân công cho các AI Agent phù hợp.
- **Tài liệu & Chunking (Document Pipeline):** Là quy trình kỹ thuật chuyển đổi từ file phi cấu trúc (PDF, DOCX, CSV, TXT, PPTX) sang các đoạn văn bản (chunks), sinh vector embedding (1536 chiều) và lưu vào Vector Database.

---

## 2. BẢNG SO SÁNH CHI TIẾT HAI MODULE

| Tiêu chí so sánh | Phân hệ: Kho tri thức (Tab 3) | Phân hệ: Tài liệu & Chunking (Tab 4) |
| :--- | :--- | :--- |
| **Bản chất kiến trúc** | Tầng Quản trị Nghiệp vụ (Business Layer) | Tầng Dữ liệu & Xử lý Kỹ thuật (ETL & Embedding Pipeline) |
| **Thuộc tính quản lý** | ID, Tên kho, Mã kho, Mô tả, Phạm vi truy cập (Scope), Trạng thái, Danh sách AI Agent liên kết. | Tên tệp tin, Định dạng tệp (.pdf, .docx, .xlsx...), Dung lượng byte, Trạng thái xử lý vòng đời, Số lượng chunks, Thời điểm lập chỉ mục. |
| **Vòng đời trạng thái** | `ACTIVE`, `INACTIVE`, `ARCHIVED` | `PENDING` → `EXTRACTING` → `CHUNKING` → `EMBEDDING` → `INDEXED` (hoặc `ERROR`). |
| **Tác vụ Quản trị viên** | Tạo mới kho, Chỉnh sửa thông tin, Phân quyền truy cập, Gán Agent, Xóa kho tri thức. | Tải file mới lên, Xem danh sách phân đoạn (Xem Chunks), Re-index từng tài liệu, Re-index toàn bộ kho, Xóa tài liệu. |
| **Độ chi tiết dữ liệu (Granularity)**| Mức độ Repository tổng quát (Tổng số tài liệu, Tổng số chunks). | Mức độ Document & Chunk (Vị trí phân đoạn, độ dài token, Vector embedding, metadata JSON). |

---

## 3. THIẾT KẾ CSDL VÀ DÒNG CHẢY DỮ LIỆU (DATA FLOW)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant UI as Giao diện Tài liệu & Chunking
    participant API as AiStudioAdminController
    participant Ingestion as DocumentIngestionService
    participant Parser as Apache Tika / PDFBox
    participant Splitter as RecursiveCharacterTextSplitter
    participant Embedder as text-embedding-3-small (1536d)
    participant DB as PostgreSQL pgvector

    Admin->>UI: Tải lên tài liệu (PDF / DOCX) vào Kho tri thức
    UI->>API: POST /admin/ai/knowledge-bases/{kbId}/documents (Multipart)
    API->>Ingestion: Khởi tạo tiến trình lập chỉ mục tài liệu
    Ingestion->>DB: Ghi nhận trạng thái: EXTRACTING
    Ingestion->>Parser: Trích xuất nội dung văn bản thuần
    Parser-->>Ingestion: Văn bản và cấu trúc trang
    Ingestion->>DB: Cập nhật trạng thái: CHUNKING
    Ingestion->>Splitter: Phân đoạn (Chunk size: 500 tokens, Overlap: 50)
    Splitter-->>Ingestion: Danh sách phân đoạn (Chunks)
    Ingestion->>DB: Cập nhật trạng thái: EMBEDDING
    Ingestion->>Embedder: Gửi batch text sinh Vector Embedding
    Embedder-->>Ingestion: Danh sách 1536-dimensional vectors
    Ingestion->>DB: Lưu vào bảng ai_kb_chunks & HNSW index
    Ingestion->>DB: Hoàn tất trạng thái: INDEXED
    API-->>UI: Trả về tài liệu hoàn thiện & số lượng chunks
```

---

## 4. TÍNH NĂNG SOI PHÂN ĐOẠN (CHUNK INSPECTOR)
Quản trị viên có thể bấm **"Xem Chunks"** trên từng tài liệu để kiểm tra:
1. Thứ tự phân đoạn (`Chunk #1`, `Chunk #2`...).
2. Chiều dài ký tự và ước lượng token.
3. Vị trí phân đoạn trong văn bản gốc.
4. Trạng thái lập chỉ mục Vector: `Vectorized: 1536 dims (PostgreSQL pgvector)`.
5. Đoạn trích dẫn thực tế để đảm bảo chất lượng nội dung trước khi đưa vào phục vụ RAG.
