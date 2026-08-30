# Parsers, PDF Processing, and OCR Ingestion Engine

## 1. Input Processing Architecture

The timetable ingestion subsystem supports four primary input modalities with automated format detection:

| Format | Ingestion Engine | Input Media | Fallback & Preprocessing |
| :--- | :--- | :--- | :--- |
| **TEXT / CSV** | `TextTimetableParser` | Raw ASCII/UTF-8 strings, multiline blocks, CSV records | Tokenizes delimiters (`\t`, `,`, `\|`, multi-space) |
| **JSON** | `JsonTimetableParser` | JSON object / array | Validates with `Zod` Canonical Payload Schema |
| **PDF** | `PdfTimetableParser` | Binary `.pdf` buffers, digital text streams | Extracts text glyphs via `pdf-parse`, parses line matrix |
| **IMAGE / OCR**| `ImageOcrTimetableParser`| Binary `.png`/`.jpg`/`.webp` buffers, base64 data URIs | Tesseract.js optical character recognition engine |

---

## 2. OCR Preprocessing & Confidence Scoring

1. **Matrix Extraction**: The OCR engine detects tabular rows and columns, isolating station codes, arrival times, departure times, and platform numbers.
2. **Confidence Classification**:
   - $\text{Confidence} \ge 0.90 \implies \text{HIGH\_CONFIDENCE}$
   - $0.70 \le \text{Confidence} < 0.90 \implies \text{MEDIUM\_CONFIDENCE}$
   - $\text{Confidence} < 0.70 \implies \text{LOW\_CONFIDENCE}$
3. **Mandatory Human Review**: Any import job deriving data from `OCR_EXTRACTED` sources or containing `LOW_CONFIDENCE` stops is automatically flagged with `REVIEW_REQUIRED` status.
