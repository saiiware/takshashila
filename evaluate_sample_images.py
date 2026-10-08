"""Evaluation test script for all photos in data/images and sample_images."""

import io
import sys
from pathlib import Path

# Force UTF-8 on Windows terminal output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from rag_python.vision_inspector import inspect_image_file


def run_evaluations():
    dirs_to_check = [root_dir / "data" / "images", root_dir / "sample_images"]
    all_images = []
    for d in dirs_to_check:
        if d.is_dir():
            for f in sorted(d.glob("*")):
                if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"):
                    all_images.append(f)

    print("===================================================================")
    print("      Takshashila Computer Vision Photo Inspection Test Suite      ")
    print("===================================================================")
    print(f"Total image files found: {len(all_images)}\n")

    for idx, img_path in enumerate(all_images, 1):
        print(f"[{idx}/{len(all_images)}] Target: {img_path.name}")
        try:
            res = inspect_image_file(str(img_path))
            status_tag = "[PASS] CORRECT" if res.status == "correct" else "[ATTENTION] NEEDS ADJUSTMENT"
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


if __name__ == "__main__":
    run_evaluations()

