# backend/app/services/ocr_service.py

import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import json
import os
from typing import Dict, Any, List
from groq import Groq
from app.config import settings

# --- CRITICAL CONFIGURATION: EXPLICITLY LINK TESSERACT BINARY ---
tesseract_default_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
if os.path.exists(tesseract_default_path):
    pytesseract.pytesseract.tesseract_cmd = tesseract_default_path
# -----------------------------------------------------------------

class OCRService:
    def __init__(self):
        # Read key safely from environment variable or settings
        self.api_key = os.getenv("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", None)
        self.client = Groq(api_key=self.api_key) if self.api_key else None

    def extract_text_from_pdf(self, file_bytes: bytes) -> str:
        """Extracts raw text from a digitally native or scanned PDF file."""
        text = ""
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            for page in doc:
                text += page.get_text()
                
        if not text.strip():
            with fitz.open(stream=file_bytes, filetype="pdf") as doc:
                for page in doc:
                    pix = page.get_pixmap()
                    img_data = pix.tobytes("png")
                    image = Image.open(io.BytesIO(img_data))
                    text += pytesseract.image_to_string(image)
        return text

    def extract_text_from_image(self, file_bytes: bytes) -> str:
        """Extracts raw text from an image file (PNG, JPG, JPEG)."""
        image = Image.open(io.BytesIO(file_bytes))
        return pytesseract.image_to_string(image)

    def parse_text_with_ai(self, raw_text: str) -> List[Dict[str, Any]]:
        """Uses Groq to transform messy text into a structured JSON database array."""
        if not self.client:
            print("[OCR Service] Warning: GROQ_API_KEY not found. Using structured mock fallback data parser.")
            return self._get_mock_parsed_data(raw_text)

        prompt = f"""
        You are an expert academic data extraction AI. Analyze the raw text from an uploaded student marksheet and extract performance details.

        Extract all subjects present in the text into a JSON array of objects. Each object MUST contain these exact keys:
        1. "semester" (Integer, e.g., 1, 2)
        2. "subject_name" (String full name of course)
        3. "subject_code" (String code, e.g., "CS-101", or null)
        4. "marks_obtained" (Float/Number score achieved)
        5. "max_marks" (Float/Number, usually 100.0)
        6. "percentage" (Float/Number percentage achieved)
        7. "grade" (String letter grade, e.g., "A", "B", "F")
        8. "is_failed" (Boolean true/false based on grade or low score)
        9. "needs_focus" (Boolean true if score is less than 60.0, otherwise false)

        Raw Marksheet Text:
        ---
        {raw_text}
        ---

        Respond ONLY with a valid JSON array of objects. Do not include markdown code blocks, labels, backticks, or extra conversational text.
        """

        try:
            response = self.client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[
                    {"role": "system", "content": "You are a database response parser. You output ONLY a raw JSON array. No markdown, no triple backticks, no explanations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1
            )
            
            cleaned_response = response.choices[0].message.content.strip()
            
            # Remove any markdown JSON formatting wraps if the model added them
            if "```" in cleaned_response:
                cleaned_response = cleaned_response.split("```")[1]
                if cleaned_response.startswith("json"):
                    cleaned_response = cleaned_response[4:]
                cleaned_response = cleaned_response.strip()

            parsed_list = json.loads(cleaned_response)
            
            # --- DATABASE RECONCILIATION LAYER ---
            # Ensure every dictionary item matches database constraints perfectly
            validated_list = []
            if isinstance(parsed_list, list):
                for item in parsed_list:
                    if not isinstance(item, dict):
                        continue
                        
                    # Standardize fields to avoid SQL Database insertion errors
                    validated_item = {
                        "semester": int(item.get("semester", 1) or 1),
                        "subject_name": str(item.get("subject_name", "Unknown Course")),
                        "subject_code": str(item.get("subject_code") or "GEN-000"),
                        "marks_obtained": float(item.get("marks_obtained", 0.0) or 0.0),
                        "max_marks": float(item.get("max_marks", 100.0) or 100.0),
                        "percentage": float(item.get("percentage", 0.0) or 0.0),
                        "grade": str(item.get("grade", "P")),
                        "is_failed": bool(item.get("is_failed", False)),
                        "needs_focus": bool(item.get("needs_focus", False))
                    }
                    validated_list.append(validated_item)
                    
            return validated_list

        except Exception as e:
            print(f"[OCR Service] Error during Groq AI parsing or DB mapping: {str(e)}")
            return []

    def process_marksheet_upload(self, file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
        """Main orchestrator function to handle file type routing and data extraction."""
        ext = filename.split(".")[-1].lower()
        
        if ext == "pdf":
            raw_text = self.extract_text_from_pdf(file_bytes)
        elif ext in ["png", "jpg", "jpeg"]:
            raw_text = self.extract_text_from_image(file_bytes)
        else:
            raise ValueError("Unsupported file format. Please upload a PDF or an Image.")
        
        if not raw_text.strip():
            raise ValueError("Could not extract any readable text from the document.")

        return self.parse_text_with_ai(raw_text)

    def _get_mock_parsed_data(self, raw_text: str) -> List[Dict[str, Any]]:
        return [
            {"semester": 1, "subject_name": "Mathematics I", "subject_code": "MATH101", "marks_obtained": 32.0, "max_marks": 100.0, "percentage": 32.0, "grade": "F", "is_failed": True, "needs_focus": True},
            {"semester": 1, "subject_name": "Object Oriented Programming", "subject_code": "CS102", "marks_obtained": 55.0, "max_marks": 100.0, "percentage": 55.0, "grade": "C", "is_failed": False, "needs_focus": True},
            {"semester": 1, "subject_name": "Digital Electronics", "subject_code": "EC103", "marks_obtained": 88.0, "max_marks": 100.0, "percentage": 88.0, "grade": "A", "is_failed": False, "needs_focus": False}
        ]