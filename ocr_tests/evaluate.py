from pathlib import Path
import csv
import re

from jiwer import wer, cer


BASE_DIR = Path(__file__).resolve().parent

GROUND_TRUTH_DIR = BASE_DIR / "ground_truth"
OCR_RESULTS_DIR = BASE_DIR / "results"

OUTPUT_FILE = BASE_DIR / "accuracy_results.csv"


def normalize_text(text: str) -> str:
    """
    Normalize OCR and ground-truth text before comparison.
    """

    text = text.lower()

    # Normalize whitespace
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def read_text(path: Path) -> str:
    if not path.exists():
        return ""

    return path.read_text(
        encoding="utf-8",
        errors="ignore"
    ).strip()


def calculate_accuracy(error_rate: float) -> float:
    """
    Convert an error rate into an approximate accuracy percentage.
    """

    accuracy = (1 - error_rate) * 100

    return max(0.0, accuracy)


def evaluate_sample(ground_truth_file: Path):

    filename = ground_truth_file.name

    result_file = OCR_RESULTS_DIR / filename

    actual_text = read_text(ground_truth_file)
    ocr_text = read_text(result_file)

    if not actual_text:
        return None

    if not ocr_text:
        return {
            "image": filename,
            "actual_characters": len(actual_text),
            "actual_words": len(actual_text.split()),
            "ocr_characters": 0,
            "ocr_words": 0,
            "cer": 1.0,
            "wer": 1.0,
            "character_accuracy": 0.0,
            "word_accuracy": 0.0,
            "status": "OCR returned no text",
        }

    actual_normalized = normalize_text(actual_text)
    ocr_normalized = normalize_text(ocr_text)

    character_error_rate = cer(
        actual_normalized,
        ocr_normalized
    )

    word_error_rate = wer(
        actual_normalized,
        ocr_normalized
    )

    character_accuracy = calculate_accuracy(
        character_error_rate
    )

    word_accuracy = calculate_accuracy(
        word_error_rate
    )

    return {
        "image": filename,
        "actual_characters": len(actual_normalized),
        "actual_words": len(actual_normalized.split()),
        "ocr_characters": len(ocr_normalized),
        "ocr_words": len(ocr_normalized.split()),
        "cer": round(character_error_rate, 4),
        "wer": round(word_error_rate, 4),
        "character_accuracy": round(character_accuracy, 2),
        "word_accuracy": round(word_accuracy, 2),
        "status": "Completed",
    }


def main():

    OCR_RESULTS_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    results = []

    ground_truth_files = sorted(
        GROUND_TRUTH_DIR.glob("*.txt")
    )

    if not ground_truth_files:
        print("No ground-truth files found.")
        return

    for ground_truth_file in ground_truth_files:

        result = evaluate_sample(
            ground_truth_file
        )

        if result:
            results.append(result)

    with OUTPUT_FILE.open(
        "w",
        newline="",
        encoding="utf-8"
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=results[0].keys()
        )

        writer.writeheader()
        writer.writerows(results)

    print("\nOCR Accuracy Evaluation")
    print("=" * 50)

    for result in results:

        print(
            f"{result['image']}: "
            f"Character Accuracy = "
            f"{result['character_accuracy']}%, "
            f"Word Accuracy = "
            f"{result['word_accuracy']}%"
        )

    average_character_accuracy = (
        sum(r["character_accuracy"] for r in results)
        / len(results)
    )

    average_word_accuracy = (
        sum(r["word_accuracy"] for r in results)
        / len(results)
    )

    print("\nOverall Results")
    print("=" * 50)

    print(
        f"Average Character Accuracy: "
        f"{average_character_accuracy:.2f}%"
    )

    print(
        f"Average Word Accuracy: "
        f"{average_word_accuracy:.2f}%"
    )

    print(
        f"\nResults saved to: "
        f"{OUTPUT_FILE}"
    )


if __name__ == "__main__":
    main()