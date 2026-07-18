"""from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
import io
import pdfplumber
import fitz
import pytesseract
from PIL import Image

from app.models.marksheet import MarksheetRecord
from app.services.marksheet_parser import parse_marksheet_with_groq
from app.database import get_db

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

router = APIRouter()
def clean_and_extract_pdf_bytes(file_bytes: bytes) -> str:
    # Attempt 1: pdfplumber with table extraction (better for marksheets)
    raw_text = ""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                # Try extracting tables first
                tables = page.extract_tables()
                if tables:
                    for table in tables:
                        for row in table:
                            if row:
                                cleaned_row = [str(cell).strip() if cell else "" for cell in row]
                                raw_text += " | ".join(cleaned_row) + "\n"
                # Also get plain text
                text = page.extract_text()
                if text:
                    raw_text += text + "\n"
    except Exception as e:
        print(f"[pdfplumber Error] {str(e)}")

    if raw_text.strip():
        print("[Extractor] Success via pdfplumber.")
        print("=== FULL OCR TEXT ===\n", raw_text)
        return raw_text

    # Attempt 2: OCR fallback for scanned PDFs
    print("[Extractor] Trying OCR fallback...")
    ocr_text = ""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page_num in range(len(doc)):
            page = doc[page_num]
            # Higher DPI = better OCR accuracy for tables
            mat = fitz.Matrix(400 / 72, 400 / 72)
            pix = page.get_pixmap(matrix=mat)
            img_bytes = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_bytes))
            # PSM 6 = assume a single uniform block of text (better for tables)
            custom_config = r'--oem 3 --psm 6'
            page_text = pytesseract.image_to_string(image, lang="eng", config=custom_config)
            if page_text:
                ocr_text += page_text + "\n"
        doc.close()
        print("[Extractor] OCR complete.")
        print("=== FULL OCR TEXT ===\n", ocr_text)
    except Exception as e:
        print(f"[OCR Error] {str(e)}")

    return ocr_text
"""  
"""
def clean_and_extract_pdf_bytes(file_bytes: bytes) -> str:
    # Attempt 1: pdfplumber for text-based PDFs
    raw_text = ""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    raw_text += text + "\n"
    except Exception as e:
        print(f"[pdfplumber Error] {str(e)}")

    if raw_text.strip():
        print("[Extractor] Success via pdfplumber.")
        return raw_text

    # Attempt 2: OCR fallback for scanned PDFs
    print("[Extractor] Trying OCR fallback...")
    ocr_text = ""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page_num in range(len(doc)):
            page = doc[page_num]
            mat = fitz.Matrix(300 / 72, 300 / 72)
            pix = page.get_pixmap(matrix=mat)
            img_bytes = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_bytes))
            page_text = pytesseract.image_to_string(image, lang="eng")
            if page_text:
                ocr_text += page_text + "\n"
        doc.close()
        print("[Extractor] OCR complete.")
    except Exception as e:
        print(f"[OCR Error] {str(e)}")

    return ocr_text 

"""    

"""
@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_marksheet(
    file: UploadFile = File(...),
    user_id: int = 1,
    db: Session = Depends(get_db)
):
    filename = file.filename
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext != "pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF files are supported."
        )

    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    raw_pdf_text = clean_and_extract_pdf_bytes(file_bytes)
    print("=== FULL OCR TEXT ===\n", raw_pdf_text)
    #print("=== OCR TEXT SAMPLE ===", raw_pdf_text[:500])  # ADD THIS


    if not raw_pdf_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract text from PDF. Please ensure Tesseract OCR is installed."
        )

    try:
        llm_response = parse_marksheet_with_groq(raw_pdf_text)
        print("=== GROQ RESPONSE ===", llm_response)  # ADD THIS LINE HERE
        parsed_subjects = llm_response.get("subjects", [])
        target_semester = llm_response.get("semester_detected", 1)

        if not parsed_subjects:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No subjects could be parsed from the document."
            )

        db.query(MarksheetRecord).filter(
            MarksheetRecord.user_id == user_id,
            MarksheetRecord.semester == target_semester
        ).delete(synchronize_session=False)

        saved_records = []
        for subject in parsed_subjects:
            try:
                marks_obtained = float(subject.get("total_marks", 0) or 0)
            except (ValueError, TypeError):
                marks_obtained = 0.0

            try:
                max_marks = float(subject.get("max_marks") or 100)
            except (ValueError, TypeError):
                max_marks = 100.0

           # percentage = (marks_obtained / max_marks) * 100 if max_marks > 0 else 0.0
            #grade_str = str(subject.get("grade", "")).strip().upper()
            #is_failed = grade_str in ["F", "FF", "FAIL"] or marks_obtained < (max_marks * 0.40)
            #needs_focus = not is_failed and (marks_obtained < (max_marks * 0.65))
            grade_str = str(subject.get("grade", "")).strip().upper()

        # Grade-based classification (for universities that use grade systems)

        grade_str = str(subject.get("grade", "")).strip().upper()

# Grade-based classification (for universities that use grade systems)
FAILED_GRADES = {"F", "FF", "FAIL"}
STRONG_GRADES = {"O", "A", "A+", "A-"}
FOCUS_GRADES  = {"B", "B+", "B-", "C", "C+", "D", "E", "P"}
IGNORE_GRADES = {"AC", "AB", ""}

if grade_str in IGNORE_GRADES:
    # Skip audit/non-credit subjects entirely
    continue

is_failed    = grade_str in FAILED_GRADES
needs_focus  = (not is_failed) and (grade_str in FOCUS_GRADES)

# For percentage — use credit points if available, else estimate from grade
crd_pts = subject.get("credit_points") or subject.get("crd_pts")
try:
    marks_obtained = float(crd_pts) if crd_pts is not None else 0.0
except (ValueError, TypeError):
    marks_obtained = 0.0

max_marks = 30.0  # Max credit points for a 3-credit subject in SPPU
percentage = round((marks_obtained / max_marks) * 100, 2) if max_marks > 0 else 0.0
            record = MarksheetRecord(
                user_id=user_id,
                semester=target_semester,
                subject_name=subject.get("subject_name", "Unknown Subject").strip(),
                subject_code=subject.get("subject_code", "N/A").strip(),
                marks_obtained=marks_obtained,
                max_marks=max_marks,
                percentage=round(percentage, 2),
                grade=grade_str,
                is_failed=is_failed,
                needs_focus=needs_focus
            )
            db.add(record)
            saved_records.append(record)

        db.commit()

        failed_subjects = [r.subject_name for r in saved_records if r.is_failed]
        focus_subjects = [r.subject_name for r in saved_records if r.needs_focus]

        return {
            "message": "Marksheet uploaded and analyzed successfully.",
            "semester_detected": target_semester,
            "total_subjects_parsed": len(saved_records),
            "critical_alerts": {
                "failed_subjects": failed_subjects,
                "low_focus_subjects": focus_subjects
            },
            "data": [
                {
                    "subject_code": r.subject_code,
                    "subject_name": r.subject_name,
                    "marks_obtained": r.marks_obtained,
                    "max_marks": r.max_marks,
                    "percentage": r.percentage,
                    "grade": r.grade,
                    "is_failed": r.is_failed,
                    "needs_focus": r.needs_focus
                } for r in saved_records
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[API Error] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

"""

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
import io
import pdfplumber
import fitz
import pytesseract
from PIL import Image

from app.models.marksheet import MarksheetRecord
from app.services.marksheet_parser import parse_marksheet_with_groq
from app.database import get_db

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

router = APIRouter()

FAILED_GRADES = {"F", "FF", "FAIL"}
STRONG_GRADES = {"O", "A", "A+", "A-"}
FOCUS_GRADES  = {"B", "B+", "B-", "C", "C+", "D", "E", "P"}
IGNORE_GRADES = {"AC", "AB", ""}


def clean_and_extract_pdf_bytes(file_bytes: bytes) -> str:
    raw_text = ""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                if tables:
                    for table in tables:
                        for row in table:
                            if row:
                                cleaned_row = [str(cell).strip() if cell else "" for cell in row]
                                raw_text += " | ".join(cleaned_row) + "\n"
                text = page.extract_text()
                if text:
                    raw_text += text + "\n"
    except Exception as e:
        print(f"[pdfplumber Error] {str(e)}")

    if raw_text.strip():
        print("[Extractor] Success via pdfplumber.")
        print("=== FULL TEXT ===\n", raw_text)
        return raw_text

    print("[Extractor] Trying OCR fallback...")
    ocr_text = ""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page_num in range(len(doc)):
            page = doc[page_num]
            mat = fitz.Matrix(400 / 72, 400 / 72)
            pix = page.get_pixmap(matrix=mat)
            img_bytes = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_bytes))
            custom_config = r'--oem 3 --psm 6'
            page_text = pytesseract.image_to_string(image, lang="eng", config=custom_config)
            if page_text:
                ocr_text += page_text + "\n"
        doc.close()
        print("[Extractor] OCR complete.")
        print("=== FULL OCR TEXT ===\n", ocr_text)
    except Exception as e:
        print(f"[OCR Error] {str(e)}")

    return ocr_text


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_marksheet(
    file: UploadFile = File(...),
    user_id: int = 1,
    db: Session = Depends(get_db)
):
    filename = file.filename
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext != "pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF files are supported."
        )

    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    raw_pdf_text = clean_and_extract_pdf_bytes(file_bytes)

    if not raw_pdf_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract text from PDF. Please ensure Tesseract OCR is installed."
        )

    try:
        #llm_response = parse_marksheet_with_groq(raw_pdf_text)
        llm_response = parse_marksheet_with_groq(file_bytes=file_bytes)
        print("=== GROQ RESPONSE ===", llm_response)
        parsed_subjects = llm_response.get("subjects", [])
        target_semester = llm_response.get("semester_detected", 1)

        if not parsed_subjects:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No subjects could be parsed from the document."
            )

        db.query(MarksheetRecord).filter(
            MarksheetRecord.user_id == user_id,
            MarksheetRecord.semester == target_semester
        ).delete(synchronize_session=False)

        saved_records = []
        for subject in parsed_subjects:
            grade_str = str(subject.get("grade", "")).strip().upper()

            if grade_str in IGNORE_GRADES:
                print(f"[Skipping AC/ignored subject] {subject.get('subject_name')}")
                continue

            is_failed   = grade_str in FAILED_GRADES
            needs_focus = (not is_failed) and (grade_str in FOCUS_GRADES)

            crd_pts = subject.get("credit_points") or subject.get("crd_pts")
            try:
                marks_obtained = float(crd_pts) if crd_pts is not None else 0.0
            except (ValueError, TypeError):
                marks_obtained = 0.0

            max_marks  = 30.0
            percentage = round((marks_obtained / max_marks) * 100, 2) if max_marks > 0 else 0.0

            record = MarksheetRecord(
                user_id=user_id,
                semester=target_semester,
                subject_name=subject.get("subject_name", "Unknown Subject").strip(),
                subject_code=subject.get("subject_code", "N/A").strip(),
                marks_obtained=marks_obtained,
                max_marks=max_marks,
                percentage=percentage,
                grade=grade_str,
                is_failed=is_failed,
                needs_focus=needs_focus
            )
            db.add(record)
            saved_records.append(record)

        db.commit()

        failed_subjects = [r.subject_name for r in saved_records if r.is_failed]
        focus_subjects  = [r.subject_name for r in saved_records if r.needs_focus]

        return {
            "message": "Marksheet uploaded and analyzed successfully.",
            "semester_detected": target_semester,
            "total_subjects_parsed": len(saved_records),
            "critical_alerts": {
                "failed_subjects": failed_subjects,
                "low_focus_subjects": focus_subjects
            },
            "data": [
                {
                    "subject_code": r.subject_code,
                    "subject_name": r.subject_name,
                    "marks_obtained": r.marks_obtained,
                    "max_marks": r.max_marks,
                    "percentage": r.percentage,
                    "grade": r.grade,
                    "is_failed": r.is_failed,
                    "needs_focus": r.needs_focus
                } for r in saved_records
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[API Error] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")