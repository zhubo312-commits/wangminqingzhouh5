#!/usr/bin/env python3
"""Generate the provisional Xingming character seed from pinned public data.

The generator intentionally separates two stroke-count concepts:

* ``bihua`` is the runtime compatibility value. It comes from CNS11643's
  standard Taiwan glyph stroke count, with the two captured golden cases as
  explicit compatibility overrides.
* ``kx_bihua`` is the historical Kangxi radical plus residual-stroke total,
  derived from Unicode 15.0 ``kRSKangXi``. The runtime does not use it yet.

No naming-school five-element classification or long-form dictionary prose is
invented. Unverified ``wx`` values are emitted as ``待核验``.
"""

from __future__ import annotations

import argparse
import hashlib
import unicodedata
from collections import defaultdict
from pathlib import Path
from zipfile import ZipFile


EXPECTED_SHA256 = {
    "unihan_current": "f7a48b2b545acfaa77b2d607ae28747404ce02baefee16396c5d2d7a8ef34b5e",
    "unihan_kangxi": "24b154691fc97cb44267b925d62064297086b3f896b57a8181c7b6d42702a026",
    "cjk_radicals": "826f83be25cd18fb8a5015a514704504e1982e840ea14d058bf583e1cc620c83",
    "cns_properties": "3d56ef14cc8099893245dac58fe4718d2fa64812b9159352a98a4588ad3efa5c",
    "cns_mappings": "4502fcf7b433d679dee51127298929543ec7f4aa99be93cd219df1552bc3d2bf",
}

CURRENT_PROPERTIES = {
    "kKangXi",
    "kMandarin",
    "kRSUnicode",
    "kSimplifiedVariant",
    "kTotalStrokes",
    "kTraditionalVariant",
}

# These are the only character-level naming-school values confirmed by the two
# captured upstream responses. They deliberately take precedence over public
# glyph stroke counts for runtime parity.
GOLDEN_OVERRIDES = {
    "李": {"strokes": 7, "element": "木", "pinyin": "li"},
    "明": {"strokes": 8, "element": "火", "pinyin": "ming"},
    "歐": {"strokes": 15, "element": "土", "pinyin": "ou", "simplified": "欧"},
    "陽": {"strokes": 12, "element": "土", "pinyin": "yang", "simplified": "阳"},
    "子": {"strokes": 3, "element": "水", "pinyin": "zi"},
    "涵": {"strokes": 12, "element": "水", "pinyin": "han"},
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def verify_inputs(paths: dict[str, Path]) -> None:
    mismatches = []
    for key, path in paths.items():
        if not path.is_file():
            mismatches.append(f"{key}: missing {path}")
            continue
        actual = sha256(path)
        expected = EXPECTED_SHA256[key]
        if actual != expected:
            mismatches.append(f"{key}: expected {expected}, got {actual}")
    if mismatches:
        raise SystemExit("Source verification failed:\n" + "\n".join(mismatches))


def load_unihan(path: Path, wanted: set[str]) -> dict[int, dict[str, str]]:
    result: dict[int, dict[str, str]] = defaultdict(dict)
    with ZipFile(path) as archive:
        for name in archive.namelist():
            if not name.startswith("Unihan_") or not name.endswith(".txt"):
                continue
            for line in archive.read(name).decode("utf-8").splitlines():
                if not line or line.startswith("#"):
                    continue
                code_point, property_name, value = line.split("\t", 2)
                if property_name in wanted:
                    result[int(code_point[2:], 16)][property_name] = value
    return result


def load_cns_unicode_mappings(path: Path) -> dict[int, str]:
    result: dict[int, str] = {}
    with ZipFile(path) as archive:
        for name in archive.namelist():
            if not name.startswith("Unicode/CNS2UNICODE_") or not name.endswith(".txt"):
                continue
            for line in archive.read(name).decode("utf-8").splitlines():
                if not line:
                    continue
                cns_code, unicode_hex = line.split("\t", 1)
                code_point = int(unicode_hex, 16)
                previous = result.setdefault(code_point, cns_code)
                if previous != cns_code:
                    raise ValueError(f"Multiple CNS mappings for U+{code_point:04X}: {previous}, {cns_code}")
    return result


def load_cns_property(path: Path, name: str) -> dict[str, str]:
    with ZipFile(path) as archive:
        return {
            key: value
            for line in archive.read(name).decode("utf-8").splitlines()
            if line
            for key, value in [line.split("\t", 1)]
        }


def load_radicals(path: Path) -> dict[int, int]:
    result: dict[int, int] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#"):
            continue
        radical_number, _, equivalent_ideograph = [part.strip() for part in line.split(";")]
        if radical_number.endswith("'"):
            continue
        result[int(radical_number)] = int(equivalent_ideograph, 16)
    missing = sorted(set(range(1, 215)) - result.keys())
    if missing:
        raise ValueError(f"Missing canonical Kangxi radicals: {missing}")
    return result


def first_variant(value: str | None) -> str | None:
    if not value:
        return None
    token = value.split()[0]
    return chr(int(token[2:], 16))


def plain_pinyin(value: str | None) -> str:
    if not value:
        return "待考"
    preferred = value.split()[0].lower()
    decomposed = unicodedata.normalize("NFD", preferred)
    without_tones = "".join(
        character
        for character in decomposed
        if unicodedata.combining(character) == 0 or character == "\N{COMBINING DIAERESIS}"
    )
    return unicodedata.normalize("NFC", without_tones)


def kangxi_totals(
    radical_stroke_value: str | None,
    radical_strokes: dict[int, int],
) -> str:
    if not radical_stroke_value:
        return ""
    totals: list[int] = []
    for value in radical_stroke_value.split():
        radical_text, residual_text = value.split(".", 1)
        radical_number = int(radical_text.rstrip("'"))
        total = radical_strokes[radical_number] + int(residual_text)
        if total > 0 and total not in totals:
            totals.append(total)
    return ",".join(str(total) for total in totals)


def sql_text(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def build_rows(
    current: dict[int, dict[str, str]],
    historical: dict[int, dict[str, str]],
    radicals: dict[int, int],
    cns_codes: dict[int, str],
    cns_strokes: dict[str, str],
) -> tuple[list[tuple[str, ...]], dict[str, int]]:
    radical_strokes = {
        number: int(current[code_point]["kTotalStrokes"])
        for number, code_point in radicals.items()
    }
    rows: list[tuple[str, ...]] = []
    stats = defaultdict(int)

    for code_point in sorted(current):
        properties = current[code_point]
        if not 0x4E00 <= code_point <= 0x9FFF or "kKangXi" not in properties:
            continue
        # A simplified-only glyph is represented by its traditional row's jtz
        # value, avoiding an exact-zi match that would prevent normalization.
        if "kTraditionalVariant" in properties and "kSimplifiedVariant" not in properties:
            stats["simplified_only_skipped"] += 1
            continue

        traditional = chr(code_point)
        override = GOLDEN_OVERRIDES.get(traditional, {})
        simplified = str(override.get("simplified") or first_variant(properties.get("kSimplifiedVariant")) or traditional)
        pinyin = str(override.get("pinyin") or plain_pinyin(properties.get("kMandarin")))
        cns_code = cns_codes.get(code_point)
        public_strokes = int(cns_strokes[cns_code]) if cns_code in cns_strokes else int(properties["kTotalStrokes"])
        strokes = int(override.get("strokes", public_strokes))
        element = str(override.get("element", "待核验"))

        rs_unicode = properties.get("kRSUnicode", "")
        radical_number = int(rs_unicode.split()[0].split(".", 1)[0].rstrip("'")) if rs_unicode else 0
        radical = chr(radicals[radical_number]) if radical_number else ""
        kx_strokes = kangxi_totals(historical.get(code_point, {}).get("kRSKangXi"), radical_strokes)

        if cns_code in cns_strokes:
            stats["cns_stroke_rows"] += 1
        else:
            stats["unihan_stroke_fallback_rows"] += 1
        if kx_strokes:
            stats["kangxi_stroke_rows"] += 1
        if pinyin == "待考":
            stats["unknown_pinyin_rows"] += 1
        if traditional in GOLDEN_OVERRIDES:
            stats["golden_rows"] += 1

        rows.append((
            simplified,
            traditional,
            pinyin,
            "",
            radical,
            str(strokes),
            pinyin,
            "",
            "",
            element,
            "",
            kx_strokes,
        ))

    stats["rows"] = len(rows)
    return rows, dict(stats)


def validate_rows(rows: list[tuple[str, ...]]) -> None:
    by_traditional = {row[1]: row for row in rows}
    if len(by_traditional) != len(rows):
        raise ValueError("Generated zi values are not unique")
    expected = {
        "李": ("李", 7, "木", "7"),
        "明": ("明", 8, "火", "8"),
        "歐": ("欧", 15, "土", "15"),
        "陽": ("阳", 12, "土", "17"),
        "子": ("子", 3, "水", "3"),
        "涵": ("涵", 12, "水", "12"),
    }
    for character, (simplified, strokes, element, kangxi_strokes) in expected.items():
        row = by_traditional[character]
        actual = (row[0], int(row[5]), row[9], row[11])
        wanted = (simplified, strokes, element, kangxi_strokes)
        if actual != wanted:
            raise ValueError(f"Golden row mismatch for {character}: expected {wanted}, got {actual}")


def render_sql(rows: list[tuple[str, ...]], stats: dict[str, int]) -> str:
    header = [
        "-- GENERATED FILE. DO NOT EDIT BY HAND.",
        "-- Unicode Unihan 17.0.0 + historical kRSKangXi from Unihan 15.0.0",
        "-- CNS11643 Properties/MappingTables release 20260805",
        "-- Runtime bihua: CNS11643 with captured golden overrides; kx_bihua: Unicode kRSKangXi-derived.",
        "-- Naming-school wx is '待核验' except for the six captured golden characters.",
        f"-- rows={stats['rows']}, cns_strokes={stats['cns_stroke_rows']}, "
        f"unihan_fallbacks={stats['unihan_stroke_fallback_rows']}, kangxi_strokes={stats['kangxi_stroke_rows']}",
        "",
    ]
    columns = "(jtz, zi, py, wubi, bushou, bihua, pinyin, jijie, xiangjie, wx, jx, kx_bihua)"
    statements: list[str] = []
    chunk_size = 500
    for start in range(0, len(rows), chunk_size):
        values = []
        for row in rows[start:start + chunk_size]:
            serialized = [sql_text(value) for value in row]
            serialized[5] = row[5]
            values.append("    (" + ", ".join(serialized) + ")")
        statements.append(f"INSERT INTO chinese_dictionary {columns}\nVALUES\n" + ",\n".join(values) + ";")
    return "\n".join(header + statements) + "\n"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--unihan-current", required=True, type=Path)
    parser.add_argument("--unihan-kangxi", required=True, type=Path)
    parser.add_argument("--cjk-radicals", required=True, type=Path)
    parser.add_argument("--cns-properties", required=True, type=Path)
    parser.add_argument("--cns-mappings", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    paths = {
        "unihan_current": args.unihan_current,
        "unihan_kangxi": args.unihan_kangxi,
        "cjk_radicals": args.cjk_radicals,
        "cns_properties": args.cns_properties,
        "cns_mappings": args.cns_mappings,
    }
    verify_inputs(paths)
    current = load_unihan(args.unihan_current, CURRENT_PROPERTIES)
    historical = load_unihan(args.unihan_kangxi, {"kRSKangXi"})
    radicals = load_radicals(args.cjk_radicals)
    cns_codes = load_cns_unicode_mappings(args.cns_mappings)
    cns_strokes = load_cns_property(args.cns_properties, "CNS_stroke.txt")
    rows, stats = build_rows(current, historical, radicals, cns_codes, cns_strokes)
    validate_rows(rows)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(render_sql(rows, stats), encoding="utf-8", newline="\n")
    print("Generated", args.output)
    for key in sorted(stats):
        print(f"{key}={stats[key]}")


if __name__ == "__main__":
    main()
