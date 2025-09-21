import json
import vertexai
from vertexai import GenerativeModel

PROJECT_ID = "pitchscope-7f989"
LOCATION = "asia-south1"
vertexai.init(project=PROJECT_ID, location=LOCATION)

def analyze_text_with_gemini(text_content):
    prompt = f"""
    Analyze the following pitch deck text and provide a structured analysis.
    Return ONLY a JSON object as described.
    ---
    {text_content}
    ---
    """
    model = GenerativeModel("gemini-1.5-flash-001")
    response = model.generate_content(prompt)

    try:
        json_text = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(json_text)
    except (json.JSONDecodeError, AttributeError) as e:
        print(f"Error decoding Gemini response: {e}")
        print(f"Raw response: {response.text}")
        return None
