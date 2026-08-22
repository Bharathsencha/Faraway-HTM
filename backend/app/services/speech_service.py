import os
import tempfile
import io
import time

# Lazy loading variables
_stt_model = None
_tts_model = None
_tts_tokenizer = None

def _get_device_and_compute():
    try:
        import torch
        device = "cuda" if torch.cuda.is_available() else "cpu"
        compute_type = "float16" if torch.cuda.is_available() else "int8"
    except ImportError:
        device = "cpu"
        compute_type = "int8"
    return device, compute_type

def _get_stt_model():
    global _stt_model
    if _stt_model is None:
        from faster_whisper import WhisperModel
        _device, _stt_compute_type = _get_device_and_compute()
        print(f"Loading faster-whisper STT model on {_device}...")
        # Using base model for good balance of speed and accuracy locally
        model_size = "base" 
        _stt_model = WhisperModel(model_size, device=_device, compute_type=_stt_compute_type)
        print("Faster-whisper STT model loaded successfully.")
    return _stt_model

def _get_tts_model():
    global _tts_model, _tts_tokenizer
    if _tts_model is None:
        _device, _ = _get_device_and_compute()
        print(f"Loading Parler-TTS model on {_device}...")
        from parler_tts import ParlerTTSForConditionalGeneration
        from transformers import AutoTokenizer
        
        model_id = "parler-tts/parler-tts-mini-v1"
        _tts_model = ParlerTTSForConditionalGeneration.from_pretrained(model_id).to(_device)
        _tts_tokenizer = AutoTokenizer.from_pretrained(model_id)
        print("Parler-TTS model loaded successfully.")
    return _tts_model, _tts_tokenizer

def transcribe_audio_file(audio_path):
    """
    Transcribes audio using local faster-whisper.
    """
    model = _get_stt_model()
    
    # Transcribe the file
    segments, info = model.transcribe(
        audio_path,
        beam_size=5,
        language="en",
        condition_on_previous_text=False
    )
    
    # Aggregate text
    transcript = " ".join([segment.text.strip() for segment in segments])
    return transcript

def generate_speech(text, description=None):
    """
    Generates TTS audio using local Parler-TTS.
    Returns the binary WAV data.
    """
    import soundfile as sf
    model, tokenizer = _get_tts_model()
    _device, _ = _get_device_and_compute()
    
    if not description:
        description = "A male speaker with a professional voice delivers his words clearly and concisely, in a very confined sounding environment with clear audio quality."
        
    input_ids = tokenizer(description, return_tensors="pt").input_ids.to(_device)
    prompt_input_ids = tokenizer(text, return_tensors="pt").input_ids.to(_device)

    # Generate audio
    generation = model.generate(input_ids=input_ids, prompt_input_ids=prompt_input_ids)
    audio_arr = generation.cpu().numpy().squeeze()
    sample_rate = model.config.sampling_rate

    # Write to memory buffer
    buffer = io.BytesIO()
    sf.write(buffer, audio_arr, sample_rate, format='WAV')
    buffer.seek(0)
    
    return buffer.read()
