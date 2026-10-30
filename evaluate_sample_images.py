"""Evaluation test script for all photos in data/images and sample_images,
including automated tests for wrong / unrelated photo detection.
"""

import io
import sys
from pathlib import Path

# Force UTF-8 on Windows terminal output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from rag_python.vision_inspector import inspect_image_file, inspect_image


def run_evaluations():
    dirs_to_check = [root_dir / "data" / "images", root_dir / "sample_images", root_dir / "public" / "sample_images"]
    seen_names = set()
    all_images = []
    for d in dirs_to_check:
        if d.is_dir():
            for f in sorted(d.glob("*")):
                if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp", ".svg") and f.name not in seen_names:
                    seen_names.add(f.name)
                    all_images.append(f)

    print("===================================================================")
    print("      Takshashila Computer Vision Photo Inspection Test Suite      ")
    print("===================================================================")
    print(f"Total image files found: {len(all_images)}\n")

    for idx, img_path in enumerate(all_images, 1):
        print(f"[{idx}/{len(all_images)}] Target: {img_path.name}")
        try:
            res = inspect_image_file(str(img_path))
            if res.status == "correct":
                status_tag = "[PASS] CORRECT"
            elif res.status in ("invalid", "wrong_photo") or res.is_wrong_image:
                status_tag = "[ALERT] WRONG / UNRELATED PHOTO DETECTED"
            else:
                status_tag = "[ATTENTION] NEEDS ADJUSTMENT"

            print(f"   Category:        {res.category.upper()}")
            print(f"   Status:          {status_tag} (Score: {res.score}/10)")
            print(f"   Title:           {res.title}")
            print(f"   Detected Items:  {', '.join(res.detected_items)}")
            print(f"   Feedback:        {res.feedback}")
            print(f"   Solution:        {res.solution}")
            print(f"   Lesson Ref:      {res.lesson_reference}")
            print("-" * 65)
        except Exception as e:
            print(f"   [Error evaluating image]: {e}")
            print("-" * 65)

    print("\n===================================================================")
    print("      Testing Wrong Photo / Unrelated Subject Detection Scenarios   ")
    print("===================================================================")

    dummy_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"

    wrong_image_tests = [
        ("car_photo.jpg", "Please inspect this photo of my red sports car", "car"),
        ("golden_retriever_dog.png", "Check my pet puppy", "dog"),
        ("pepperoni_pizza.jpg", "Here is my food dinner", "pizza"),
        ("selfie_camera.png", "Inspect my new haircut selfie", "selfie"),
        ("smartphone_receipt.jpg", "Check this invoice document", "receipt"),
        ("random_mountain_view.png", "Landscape scenery photo", "landscape"),
        ("unknown_object.jpg", "Random photo without knitting keywords", "non-knitting"),
    ]

    passed_tests = 0
    for idx, (fname, prompt, expected_kw) in enumerate(wrong_image_tests, 1):
        combined = f"{prompt} (File: {fname})"
        res = inspect_image(dummy_bytes, "image/png", combined)
        status_pass = (res.status in ("invalid", "wrong_photo")) and (res.category in ("invalid_image", "wrong_photo")) and res.is_wrong_image
        if status_pass:
            passed_tests += 1
        status_str = "[PASS] CORRECTLY FLAGGED AS WRONG PHOTO" if status_pass else "[FAIL] WRONGLY ACCEPTED"
        print(f"[TEST {idx}/{len(wrong_image_tests)}] Input: '{fname}' | Prompt: '{prompt}'")
        print(f"   Result:       {status_str}")
        print(f"   Category:     {res.category}")
        print(f"   Status:       {res.status} (Score: {res.score})")
        print(f"   Title:        {res.title}")
        print(f"   Feedback:     {res.feedback[:100]}…")
        print(f"   Solution:     {res.solution[:100]}…")
        print("-" * 65)

    print(f"\nWrong Photo Test Suite: {passed_tests}/{len(wrong_image_tests)} scenarios passed successfully.\n")


if __name__ == "__main__":
    run_evaluations()
