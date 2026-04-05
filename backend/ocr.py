import sys
import json
import os

def extract_text(file_path):
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        return extract_from_pdf(file_path)
    else:
        return extract_from_image(file_path)


def extract_from_pdf(file_path):
    import pdfplumber

    texts = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                for line in text.split("\n"):
                    line = line.strip()
                    if line:
                        texts.append(line)
    return texts


def extract_from_image(file_path):
    # For image files (jpg, png) - uses easyocr
    import easyocr
    reader = easyocr.Reader(['en'], gpu=False)
    result = reader.readtext(file_path)
    texts = [text for (_, text, confidence) in result if confidence > 0.7]
    return texts


if __name__ == "__main__":
    file_path = sys.argv[1]
    texts = extract_text(file_path)
    print(json.dumps({"text": texts}))