from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Dict, List, Optional

from docx import Document

# Matches headings like "Level1_Unit 3", "Level 2 Unit 1", etc.
LEVEL_RE = re.compile(r"^Level\s*(\d+)\s*[_\s]*Unit\s*(\d+)", re.IGNORECASE)
SENTENCE_RE = re.compile(r"^Sentence[s]?:", re.IGNORECASE)
SIGHT_RE = re.compile(r"^Sight\s*words?[:：]?\s*(.*)$", re.IGNORECASE)
# English + Chinese on the same line, with or without spacing between them.
ENG_ZH_RE = re.compile(
    r"^(?P<eng>[A-Za-z][A-Za-z\s\-']*?)[\s\u3000]*?(?P<zh>[\u4e00-\u9fff].*)$"
)


@dataclass
class WordEntry:
    english: str
    chinese: Optional[str] = None


@dataclass
class UnitData:
    unit: int
    words: List[WordEntry]
    sight_words: List[str]
    sentences: List[str]


def parse_simple_words(text: str) -> List[str]:
    tokens = re.split(r"[,\s，]+", text.strip())
    return [token for token in tokens if token]


def split_vocab_line(text: str) -> Optional[WordEntry]:
    """Split a line into English and Chinese parts."""
    match = ENG_ZH_RE.match(text)
    if match:
        eng = " ".join(match.group("eng").split())
        zh = match.group("zh").strip()
        return WordEntry(english=eng, chinese=zh)

    parts = text.split(None, 1)
    if not parts:
        return None
    english = parts[0].strip()
    chinese = parts[1].strip() if len(parts) > 1 else None
    return WordEntry(english=english, chinese=chinese)


def parse_document(doc_path: Path) -> Dict[int, List[UnitData]]:
    doc = Document(doc_path)
    levels: Dict[int, List[UnitData]] = {}

    current_level: Optional[int] = None
    current_unit: Optional[UnitData] = None
    mode = "words"
    waiting_for_sight_words = False

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            mode = "words"
            continue

        level_match = LEVEL_RE.match(text)
        if level_match:
            level_num = int(level_match.group(1))
            unit_num = int(level_match.group(2))
            current_level = level_num
            current_unit = UnitData(unit=unit_num, words=[], sight_words=[], sentences=[])
            levels.setdefault(level_num, []).append(current_unit)
            mode = "words"
            waiting_for_sight_words = False
            continue

        if current_unit is None:
            continue

        sight_match = SIGHT_RE.match(text)
        if sight_match:
            payload = sight_match.group(1).strip()
            if payload:
                current_unit.sight_words.extend(parse_simple_words(payload))
            else:
                waiting_for_sight_words = True
            mode = "words"
            continue

        if waiting_for_sight_words:
            current_unit.sight_words.extend(parse_simple_words(text))
            waiting_for_sight_words = False
            continue

        if SENTENCE_RE.match(text):
            mode = "sentences"
            continue

        if mode == "sentences":
            current_unit.sentences.append(text)
            continue

        if mode == "words":
            entry = split_vocab_line(text)
            if entry:
                current_unit.words.append(entry)

    return levels


def build_serializable(levels: Dict[int, List[UnitData]]) -> Dict[str, List[dict]]:
    ordered = {}
    for level, units in sorted(levels.items()):
        ordered[f"level_{level}"] = [
            {
                "unit": unit.unit,
                "words": [asdict(word) for word in unit.words],
                "sight_words": unit.sight_words,
                "sentences": unit.sentences,
            }
            for unit in units
        ]
    return ordered


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract words and sentences grouped by level from a DOCX file."
    )
    parser.add_argument(
        "docx",
        nargs="?",
        default="Vocabulary.docx",
        type=Path,
        help="Path to the vocabulary docx file (defaults to Vocabulary.docx).",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="Optional path to write the extracted JSON. Prints to stdout if omitted.",
    )
    args = parser.parse_args()

    if not args.docx.exists():
        raise SystemExit(f"File not found: {args.docx}")

    levels = parse_document(args.docx)
    payload = build_serializable(levels)
    output_text = json.dumps(payload, ensure_ascii=False, indent=2)

    if args.output:
        args.output.write_text(output_text, encoding="utf-8")
    else:
        print(output_text)


if __name__ == "__main__":
    main()
