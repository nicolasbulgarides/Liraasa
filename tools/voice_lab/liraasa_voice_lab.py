"""Liraasa Voice Lab: local Chatterbox Multilingual V3 pronunciation experiments.

Important: This is a pretrained-language approximation, NOT a Liraasa-native G2P/TTS engine.
Start: python liraasa_voice_lab.py
"""
from functools import lru_cache
import os
import tempfile

import gradio as gr
import soundfile as sf
import torch
from chatterbox.mtl_tts import ChatterboxMultilingualTTS


@lru_cache(maxsize=1)
def get_model():
    if not torch.cuda.is_available():
        raise gr.Error("CUDA not detected. Install CUDA-enabled PyTorch and verify nvidia-smi.")
    print("Loading Chatterbox Multilingual V3 on", torch.cuda.get_device_name(0))
    return ChatterboxMultilingualTTS.from_pretrained(device="cuda", t3_model="v3")


def speak(text: str, language: str, reference_audio: str | None):
    text = (text or "").strip()
    if not text:
        raise gr.Error("Please enter some Liraasa text.")
    if len(text) > 1000:
        raise gr.Error("Use a short passage (up to 450 characters) for the first experiments.")

    model = get_model()
    opts = {}
    if reference_audio and os.path.isfile(reference_audio):
        opts["audio_prompt_path"] = reference_audio
    try:
        with torch.inference_mode():
            wav = model.generate(text, language_id=language, **opts)
        audio = wav.detach().cpu().float().squeeze().numpy()
        output = tempfile.NamedTemporaryFile(prefix="liraasa_", suffix=".wav", delete=False)
        output.close()
        sf.write(output.name, audio, int(model.sr))
        return output.name
    except gr.Error:
        raise
    except Exception as exc:
        raise gr.Error(f"Speech generation failed: {type(exc).__name__}: {exc}") from exc


with gr.Blocks(title="Liraasa Voice Lab") as app:
    gr.Markdown(
        "# Liraasa Voice Lab 🎙️\n"
        "Run a pretrained multilingual voice **locally on your RTX 4080**. "
        "This is a pronunciation experiment, *not* yet a native Liraasa speech model. "
        "The first generate command may download model weights and take a while."
    )
    txt = gr.Textbox(
        label="Liraasa text",
        lines=5,
        value="Maivo amora taivo.\nMaivo po tavki ralnora.",
        info="Start with short lines. The model may merge adjacent vowels or mispronounce c, j, h, and consonant clusters.",
    )
    with gr.Row():
        language = gr.Dropdown(
            choices=[("Swahili (recommended starting point)", "sw"),
                     ("Italian (alternative)", "it"),
                     ("Spanish (alternative)", "es")],
            value="sw", label="Pronunciation basis"
        )
        reference_audio = gr.Audio(
            sources=["upload"], type="filepath", label="Optional consented voice reference (clean ~10s audio)"
        )
    btn = gr.Button("Speak Liraasa", variant="primary")
    result = gr.Audio(type="filepath", label="Generated speech (play or download)")
    btn.click(speak, [txt, language, reference_audio], result)
    gr.Markdown(
        "**What to listen for:** Liraasa has five pure vowels, separate adjacent vowels, "
        "and penultimate stress. These pretrained voices do not enforce those rules. "
        "Your original lexicon is not modified."
    )

if __name__ == "__main__":
    app.launch(server_name="127.0.0.1", share=False, inbrowser=True)
