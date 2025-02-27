import sys
import whisper

model = whisper.load_model("base")

def transcribe_audio(file_path):
    result = model.transcribe(file_path)
    return result["text"]



if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3.11 transcribe.py <caminho_do_arquivo>")
        sys.exit(1)

    file_path = sys.argv[1]
    transcription = transcribe_audio(file_path)
    print(transcription)