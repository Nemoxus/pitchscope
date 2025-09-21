import firebase_admin
from firebase_admin import firestore

def save_analysis_to_firestore(file_name, analysis_data):
    db = firestore.client()
    doc_id = file_name.split('/')[-1].rsplit('.', 1)[0]
    doc_ref = db.collection('analyses').document(doc_id)

    analysis_data['originalFile'] = file_name
    analysis_data['timestamp'] = firestore.SERVER_TIMESTAMP
    doc_ref.set(analysis_data)

    print(f"Saved analysis to Firestore with doc ID: {doc_id}")
