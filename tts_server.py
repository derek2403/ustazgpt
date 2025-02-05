from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer
import torch
import io
import time
from huggingface_hub import HfApi, hf_hub_download
import os
import soundfile as sf

app = Flask(__name__)

# Configure CORS to allow everything
CORS(app, 
     resources={r"/*": {
         "origins": ["http://localhost:3000"],  # Your Next.js frontend
         "methods": ["GET", "POST", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "Accept"],
         "supports_credentials": True
     }})

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Increase timeout for model loading
os.environ['HF_HUB_DOWNLOAD_TIMEOUT'] = '1000'
os.environ['TRANSFORMERS_REQUEST_TIMEOUT'] = '1000'

print("Loading model and tokenizer...")
device = "cuda:0" if torch.cuda.is_available() else "cpu"

def load_model_with_retry(max_retries=3):
    for attempt in range(max_retries):
        try:
            model = ParlerTTSForConditionalGeneration.from_pretrained(
                "mesolitica/malaysian-parler-tts-mini-v1",
                local_files_only=False,
                trust_remote_code=True
            ).to(device)
            return model
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            print(f"Attempt {attempt + 1} failed, retrying in 5 seconds...")
            time.sleep(5)

def load_tokenizer_with_retry(max_retries=3):
    for attempt in range(max_retries):
        try:
            tokenizer = AutoTokenizer.from_pretrained(
                "mesolitica/malaysian-parler-tts-mini-v1",
                trust_remote_code=True
            )
            return tokenizer
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            print(f"Attempt {attempt + 1} failed, retrying in 5 seconds...")
            time.sleep(5)

print("Loading model...")
model = load_model_with_retry()
print("Loading tokenizer...")
tokenizer = load_tokenizer_with_retry()
print(f"Model and tokenizer loaded. Using device: {device}")

@app.route('/')
def health_check():
    return jsonify({"status": "healthy", "message": "TTS server is running"})

@app.route('/tts', methods=['POST', 'OPTIONS'])
def text_to_speech():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        print("Received request")
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
            
        text = request.json.get('text')
        if not text:
            return jsonify({"error": "No text provided"}), 400
            
        print(f"Processing text: {text[:100]}...")
        
        description = 'Anwar Ibrahim'
        
        input_ids = tokenizer(description, return_tensors="pt").to(device)
        prompt_input_ids = tokenizer(text, return_tensors="pt").to(device)
        print("Tokenization complete")

        generation = model.generate(
            input_ids=input_ids.input_ids,
            attention_mask=input_ids.attention_mask,
            prompt_input_ids=prompt_input_ids.input_ids,
            prompt_attention_mask=prompt_input_ids.attention_mask,
        )
        print("Generation complete")

        audio_arr = generation.cpu().numpy().squeeze()
        print(f"Audio array shape: {audio_arr.shape}")
        
        buffer = io.BytesIO()
        sf.write(buffer, audio_arr, 44100, format='WAV')
        buffer.seek(0)
        print("Audio processing complete")
        
        response = send_file(
            buffer,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='speech.wav'
        )
        return response
        
    except Exception as e:
        print(f"Error in text_to_speech: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting TTS server on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)