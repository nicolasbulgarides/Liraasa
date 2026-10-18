# Liraasa Voice Lab: Windows 10/11 + NVIDIA RTX 4080

## What you get

A local browser UI where you type Liraasa, select Swahili/Italian/Spanish as a *pronunciation approximation*, optionally upload a clean, permitted voice sample, and generate downloadable WAV speech. This is **not** a trained Liraasa-native model. Liraasa's adjacent-vowel hiatus, penultimate stress and some consonants may be wrong.

## Prerequisites

- NVIDIA driver up to date; check GPU by running `nvidia-smi` in Windows PowerShell.
- Install Python 3.11 (check "Add Python to PATH"), and Git for Windows.
- Internet on first install and model download; enough free disk space for package/weights.

## Installation (PowerShell)

Put `liraasa_voice_lab.py` in `C:\LiraasaVoice` then run:

```powershell
cd C:\LiraasaVoice
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install "git+https://github.com/resemble-ai/chatterbox.git"
.\.venv\Scripts\python.exe -c "import torch; print(torch.__version__, torch.cuda.is_available()); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU only')"
```

If `torch.cuda.is_available()` prints `False`, and you have a supported recent NVIDIA driver, reinstall the CUDA PyTorch build compatible with Chatterbox's pinned torch version:

```powershell
.\.venv\Scripts\python.exe -m pip install --upgrade --force-reinstall torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cu124
.\.venv\Scripts\python.exe -c "import torch; print(torch.cuda.is_available(), torch.version.cuda)"
```

If it is still False, check NVIDIA drivers rather than trying to train a model.

Launch:

```powershell
.\.venv\Scripts\python.exe liraasa_voice_lab.py
```

This installs the current GitHub code because the older PyPI release does not include the V3 `t3_model` loader argument. The browser should open to a localhost address. If not, copy the `http://127.0.0.1:...` address from the console into your browser. Do not expose this local server publicly. On future runs, the launch command is all you need.

## Test sentences

- `Maivo amora taivo.` (I love you.)
- `Maivo po tavki ralnora.` (I almost fell.)
- `Li veluri po hiro lirala.` (The stars began to sing.)

Try the same sentence with Swahili, Italian, and Spanish settings and compare which better approximates your ideal Liraasa pronunciation. Keep your original spelling and make a separate notes file of errors before attempting spelling rewrites.

## Important caveats

- Chatterbox is multilingual, but `language_id="sw"` means Swahili phonetics learned from training data, not Liraasa's phonology.
- Its text API is **not** a guaranteed IPA-phoneme interface. Adding a phonetic front-end is a separate project, and a native front-end needs a speech model that can accept / be trained on that representation.
- For cloning, only use your own voice or a voice with clear permission. A voice sample changes timbre, not the underlying language rules.
- For an actual Liraasa voice, record a phonetically complete corpus with accurate text and fine-tune a suitable model, for example F5-TTS with its character-tokenizer fine-tuning UI. This needs significantly more work than zero-shot cloning.

## Sources and further documentation

- Official Chatterbox: https://github.com/resemble-ai/chatterbox
- Official PyTorch 2.6 CUDA wheels: https://docs.pytorch.org/get-started/previous-versions/
- F5-TTS fine-tuning (separate stage): https://github.com/SWivid/F5-TTS
