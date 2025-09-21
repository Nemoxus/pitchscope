from firebase_functions import storage_fn, options
from ocr import extract_text_from_pdf
from gemini import analyze_text_with_gemini
from firestore_utils import save_analysis_to_firestore
import firebase_admin

if not firebase_admin._apps:
    firebase_admin.initialize_app()

@storage_fn.on_object_finalized(
    bucket="pitchscope-7f989.firebasestorage.app",
    region="asia-south1",
    timeout_sec=540,
    memory=options.MemoryOption.GB_1
)
def analyze_pitch_deck_v3(event: storage_fn.CloudEvent) -> None:
    bucket_name = event.data.bucket
    file_name = event.data.name
    print(f"Processing file: {file_name} from bucket: {bucket_name}.")

    if not file_name.startswith('uploads/') or not file_name.lower().endswith('.pdf'):
        print(f"Ignoring file: {file_name}. Not a PDF in 'uploads/' folder.")
        return

    text_content = extract_text_from_pdf(bucket_name, file_name)
    if not text_content:
        print("Text extraction failed.")
        return

    analysis = analyze_text_with_gemini(text_content)
    if not analysis:
        print("Gemini analysis failed.")
        return

    save_analysis_to_firestore(file_name, analysis)
    print("Process completed successfully!")
