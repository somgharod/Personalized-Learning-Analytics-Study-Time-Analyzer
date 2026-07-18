from groq import Groq
import fitz
import base64
import os
import json

groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

DEFAULT_PARSE_RESPONSE = {"semester_detected": 1, "subjects": []}

VISION_PROMPT = """
You are an expert academic data extraction engine.
Analyze this image of a university marksheet carefully.

Extract all subject records into this exact JSON structure:
{
  "semester_detected": int,
  "subjects": [
    {
      "subject_code": "string",
      "subject_name": "string",
      "total_marks": null,
      "max_marks": null,
      "grade": "string",
      "credit_points": int or null
    }
  ]
}

Rules:
1. This is an Indian university grade-based marksheet (SPPU/similar).
2. Grades are: O, A, A+, B, B+, C, D, E, P, F, FF, AC
3. CRD.PTS column = credit points (numbers like 27, 24, 09, 00)
4. Extract subjects from ALL semesters visible (SEM.:1, SEM.:2 etc.)
5. Set semester_detected to the HIGHEST semester number found.
6. For each subject include which semester it belongs to if possible.
7. DO NOT skip any subject row.
8. AC grade = audit course, still include it.
9. Return ONLY valid JSON. No markdown, no explanation.
"""


def pdf_to_base64_images(file_bytes: bytes) -> list:
    """Convert each PDF page to a base64 image for vision API."""
    images = []
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page_num in range(len(doc)):
            page = doc[page_num]
            mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for clarity
            pix = page.get_pixmap(matrix=mat)
            img_bytes = pix.tobytes("png")
            b64 = base64.standard_b64encode(img_bytes).decode("utf-8")
            images.append(b64)
        doc.close()
    except Exception as e:
        print(f"[PDF to Image Error] {e}")
    return images


def parse_marksheet_with_groq(file_bytes: bytes = None, raw_text: str = None) -> dict:
    """
    Parse marksheet using Groq vision (image input) for scanned PDFs.
    Falls back to text if file_bytes not provided.
    """
    try:
        if file_bytes is not None:
            # Use vision API — send page images directly to Groq
            images = pdf_to_base64_images(file_bytes)
            if not images:
                return DEFAULT_PARSE_RESPONSE.copy()

            # Build message with all page images
            content = [{"type": "text", "text": VISION_PROMPT}]
            for b64_img in images:
                content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{b64_img}"
                    }
                })

            response = groq_client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[{"role": "user", "content": content}],
                temperature=0.0,
                response_format={"type": "json_object"},
                max_tokens=4096
            )

        else:
            # Fallback: text-based parsing
            response = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": VISION_PROMPT},
                    {"role": "user", "content": f"Parse this marksheet text:\n\n{raw_text}"}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.0,
                response_format={"type": "json_object"}
            )

        content_str = response.choices[0].message.content
        if not content_str or not content_str.strip():
            return DEFAULT_PARSE_RESPONSE.copy()

        parsed = json.loads(content_str)
        parsed.setdefault("semester_detected", 1)
        parsed.setdefault("subjects", [])
        if not isinstance(parsed["subjects"], list):
            parsed["subjects"] = []
        return parsed

    except Exception as e:
        print(f"[Groq Error] {e}")
        return DEFAULT_PARSE_RESPONSE.copy()