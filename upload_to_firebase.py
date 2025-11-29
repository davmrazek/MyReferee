import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import pandas as pd

# 1. Initialize Firebase
# Make sure the JSON file name matches exactly what you downloaded
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

# 2. Read the CSV
csv_file = "matches.csv"
print(f"Reading {csv_file}...")
df = pd.read_csv(csv_file)

# Optional: Clean data before upload
# Ensure all fields are strings or numbers, no weird NaN values
df = df.fillna("") 

# 3. Upload loop
collection_name = "matches"
print(f"Uploading to collection: '{collection_name}'...")

batch = db.batch()
counter = 0

for index, row in df.iterrows():
    # Convert the row to a dictionary (JSON format)
    record = row.to_dict()
    
    # Create a unique ID for the document.
    # We combine Date + Field + Time to ensure we don't duplicate matches if we run this twice.
    # Example ID: "2025-04-12_LITVI_18:00"
    # We strip spaces just in case
    doc_id = f"{record['Date']}_{record['Field']}_{record['Time']}".replace(" ", "")
    
    doc_ref = db.collection(collection_name).document(doc_id)
    batch.set(doc_ref, record)
    counter += 1

    # Firebase batches allow 500 writes at a time.
    if counter % 400 == 0:
        batch.commit()
        batch = db.batch()
        print(f"   Saved {counter} matches so far...")

# Commit any remaining matches
batch.commit()
print(f"SUCCESS! Uploaded {counter} matches to Firestore.")