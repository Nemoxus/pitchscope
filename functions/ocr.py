from google.cloud import vision, storage
import json, re

def extract_text_from_pdf(bucket_name, file_name):
    client = vision.ImageAnnotatorClient()
    gcs_source_uri = f"gs://{bucket_name}/{file_name}"
    feature = vision.Feature(type_=vision.Feature.Type.DOCUMENT_TEXT_DETECTION)
    gcs_source = vision.GcsSource(uri=gcs_source_uri)
    input_config = vision.InputConfig(gcs_source=gcs_source, mime_type='application/pdf')

    async_request = vision.AsyncAnnotateFileRequest(
        features=[feature], input_config=input_config
    )

    operation = client.async_batch_annotate_files(requests=[async_request])
    print("Waiting for Vision AI operation to complete...")
    operation.result(timeout=420)

    storage_client = storage.Client()
    match = re.match(r'gs://([^/]+)/(.+)', operation.output_config.gcs_destination.uri)
    output_bucket_name = match.group(1)
    output_prefix = match.group(2)

    output_bucket = storage_client.get_bucket(output_bucket_name)
    full_text = ""
    for blob in output_bucket.list_blobs(prefix=output_prefix):
        if blob.content_type == "application/json":
            response = json.loads(blob.download_as_string())
            for page_response in response['responses']:
                if 'fullTextAnnotation' in page_response:
                    full_text += page_response['fullTextAnnotation']['text']
        blob.delete()

    return full_text
