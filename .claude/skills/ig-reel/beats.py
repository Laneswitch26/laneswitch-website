#!/usr/bin/env python3
"""
beats.py - turn a Reel script into a timed beat sheet before you record it.

Estimates how long each line takes to say, stacks them into timecodes, and
flags the four things that kill a Reel in the edit: a hook that runs past the
three-second mark, a beat long enough for the viewer to leave, a run of lines
with nothing concrete in them, and a total length that does not match what you
said you were making.

The timings are an estimate from word count at a words-per-minute rate. They
are close enough to plan an edit and not a substitute for recording it. Set
your own rate with --wpm once you have timed yourself reading a script out
loud: most people land between 150 and 200, and the default here is 165.

Usage
  python3 beats.py script.txt
  python3 beats.py script.txt --target 30
  python3 beats.py script.txt --wpm 185 --target 45
  pbpaste | python3 beats.py -
  python3 beats.py script.txt --json
  python3 beats.py script.txt --lang de     # German script (auto-detected too)

German (--lang de, or detected automatically): umlauts count as letters, the
default rate drops to 150 wpm because German words run longer, euro amounts
and German number words count as concrete, capitalised nouns do not (every
German noun is capitalised), and the loop check matches word stems, so
"Minute" in the hook and "Minuten" at the end still count as a loop.
"""

import argparse
import json
import re
import sys

WORD_RE = re.compile(r"[A-Za-zÄÖÜäöüß0-9$€%'’-]+")
SENT_RE = re.compile(r"[^.!?]+[.!?]*")
CONCRETE_RE = re.compile(r"\$\s?\d|\b\d[\d,.]*\b|(?<!^)\b[A-Z][a-z]{2,}\b", re.MULTILINE)
STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "if", "of", "to", "in", "on", "for",
    "with", "that", "this", "it", "is", "are", "was", "were", "be", "been",
    "you", "your", "i", "my", "me", "we", "our", "they", "them", "he", "she",
    "so", "just", "not", "no", "do", "did", "does", "have", "has", "had",
    "will", "can", "at", "as", "by", "from", "out", "up", "off", "one", "all",
}

DE_CONCRETE_RE = re.compile(
    r"€\s?\d|\d[\d.,]*\s?(?:€|euro\b|eur\b)|\b\d[\d,.]*\b"
    r"|\b(?:[A-ZÄÖÜ]{2,}[A-ZÄÖÜ0-9]*|[A-ZÄÖÜ][a-zäöüß]+[A-ZÄÖÜ]\w*)\b")
DE_NUMBER_WORD_RE = re.compile(
    r"^(?:null|ein|eins|zwei|drei|vier|fünf|sechs|sech|sieben|sieb|acht|neun"
    r"|zehn|elf|zwölf|zwan|zig|ßig|und|hundert|tausend)+$")
DE_NUMBER_WORD_EXCLUDE = {"ein", "eins", "und", "acht", "elf"}
DE_CONCRETE_WORDS = {
    "million", "millionen", "milliarde", "milliarden", "dutzend", "hälfte",
    "doppelt", "dreifach", "euro", "cent", "prozent", "franken",
}
DE_STOPWORDS = {
    "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem",
    "einer", "und", "oder", "aber", "wenn", "von", "zu", "zum", "zur", "in",
    "im", "an", "am", "auf", "für", "mit", "dass", "dies", "diese", "dieser",
    "es", "ist", "sind", "war", "waren", "sein", "gewesen", "du", "dein",
    "deine", "dir", "dich", "ich", "mein", "meine", "mir", "mich", "wir",
    "uns", "unser", "sie", "ihr", "euch", "er", "so", "nur", "nicht", "kein",
    "keine", "tun", "hat", "habe", "hab", "haben", "hatte", "wird", "werden",
    "kann", "bei", "als", "aus", "raus", "hoch", "ab", "eins", "alle", "alles",
    "jetzt", "noch", "auch", "schon", "dann", "da", "hier",
}
DE_HINT_WORDS = {
    "ich", "du", "der", "die", "das", "und", "nicht", "ist", "ein", "eine",
    "mit", "für", "auf", "wie", "mein", "dein", "habe", "hab", "jetzt", "wir",
    "sind", "war", "noch", "nur", "auch", "dir", "mich", "dich", "euch",
}
EN_HINT_WORDS = {
    "the", "and", "i", "you", "is", "a", "my", "your", "it", "of", "to", "for",
    "with", "was", "are", "this", "that", "now", "we", "just",
}


def detect_lang(text):
    """'de' if the text reads as German, else 'en'."""
    low = [w.lower() for w in WORD_RE.findall(text)]
    if not low:
        return "en"
    de = sum(w in DE_HINT_WORDS for w in low) + 2 * len(re.findall(r"[äöüß]", text.lower()))
    en = sum(w in EN_HINT_WORDS for w in low)
    return "de" if de > en else "en"


def de_concrete(text):
    n = len(DE_CONCRETE_RE.findall(text))
    for w in WORD_RE.findall(text):
        w = w.lower()
        if w in DE_CONCRETE_WORDS or (w not in DE_NUMBER_WORD_EXCLUDE
                                      and DE_NUMBER_WORD_RE.match(w)):
            n += 1
    return n


def de_stem(w):
    """Crude German stem, enough to match Minute/Minuten, Vorlage/Vorlagen."""
    for end in ("ern", "en", "er", "es", "e", "n", "s"):
        if len(w) - len(end) >= 4 and w.endswith(end):
            return w[:-len(end)]
    return w


HOOK_WINDOW = 3.0        # seconds. Past this, the thumb has already decided.
MAX_BEAT = 4.0           # seconds on one idea with no change on screen.
ABSTRACT_RUN = 3         # beats in a row with nothing checkable in them.


def words(text):
    # "$18,000" is one word when it is spoken, so it is one word here too.
    return WORD_RE.findall(re.sub(r"(?<=\d),(?=\d)", "", text))


def pretty(token):
    """Put the thousands separator back for display."""
    return re.sub(r"(\d)(?=(\d{3})+$)", r"\1,", token)


def tc(seconds):
    m, s = divmod(seconds, 60)
    return f"{int(m)}:{s:04.1f}"


def split_beats(raw, wps):
    """One line is one beat, unless a line is too long to be one."""
    beats = []
    for line in [l.strip() for l in raw.splitlines()]:
        if not line:
            continue
        if len(words(line)) / wps <= MAX_BEAT * 1.5:
            beats.append(line)
            continue
        # Long paragraph: break it at sentence ends so the timings mean
        # something, and let the report say it was split.
        parts = [p.strip() for p in SENT_RE.findall(line) if p.strip()]
        buf = ""
        for part in parts:
            candidate = (buf + " " + part).strip()
            if buf and len(words(candidate)) / wps > MAX_BEAT:
                beats.append(buf)
                buf = part
            else:
                buf = candidate
        if buf:
            beats.append(buf)
    return beats


def analyse(raw, wpm=None, target=None, lang="auto"):
    if lang == "auto":
        lang = detect_lang(raw)
    if wpm is None:
        wpm = 150 if lang == "de" else 165
    wps = wpm / 60.0
    beats = split_beats(raw, wps)
    if not beats:
        return None

    rows, clock = [], 0.0
    for i, text in enumerate(beats):
        n = len(words(text))
        dur = n / wps
        rows.append({
            "n": i + 1,
            "start": round(clock, 2),
            "dur": round(dur, 2),
            "words": n,
            "text": text,
            "concrete": de_concrete(text) if lang == "de" else len(CONCRETE_RE.findall(text)),
            "label": "",
            "flags": [],
        })
        clock += dur
    total = clock

    # Label the structural positions a Reel is actually built around.
    for r in rows:
        if r["n"] == 1 or r["start"] + r["dur"] <= HOOK_WINDOW:
            r["label"] = "HOOK"
    rows[-1]["label"] = "CTA" if rows[-1]["label"] != "HOOK" else "HOOK/CTA"
    half = total / 2
    for r in rows:
        if not r["label"] and r["start"] <= half < r["start"] + r["dur"]:
            r["label"] = "MID"

    notes = []
    if rows[0]["dur"] > HOOK_WINDOW:
        rows[0]["flags"].append(f"hook runs {rows[0]['dur']:.1f}s, past the {HOOK_WINDOW:.0f}s mark")
        notes.append(f"Beat 1 takes {rows[0]['dur']:.1f}s to say. Cut it to "
                     f"{int(HOOK_WINDOW * wps)} words or fewer, or the hook lands after "
                     "the decision has been made.")
    if rows[0]["concrete"] == 0:
        notes.append("Beat 1 has no number and no name in it. Hooks without something "
                     "checkable are the ones that get scrolled.")

    for r in rows:
        if r["dur"] > MAX_BEAT:
            r["flags"].append(f"{r['dur']:.1f}s on one beat")
    long_beats = [r["n"] for r in rows if r["dur"] > MAX_BEAT]
    if long_beats:
        notes.append(f"Beat(s) {', '.join(map(str, long_beats))} run past {MAX_BEAT:.0f}s. "
                     "Either split the line or change what is on screen inside it. "
                     "A static frame is where people leave.")

    run, start = 0, None
    for r in rows:
        if r["concrete"] == 0:
            run += 1
            start = start if start is not None else r["n"]
            if run == ABSTRACT_RUN:
                notes.append(f"Beats {start}-{r['n']} have nothing concrete in them. "
                             "Put a number, a name or a price in one of them.")
        else:
            run, start = 0, None

    # Does the last line hand you back to the first one?
    if lang == "de":
        def keyset(text):
            return {de_stem(w.lower()): w.lower() for w in words(text)
                    if w.lower() not in DE_STOPWORDS}
        f, l = keyset(rows[0]["text"]), keyset(rows[-1]["text"])
        loop = sorted(pretty(l[k]) for k in f.keys() & l.keys())
    else:
        first = {w.lower() for w in words(rows[0]["text"]) if w.lower() not in STOPWORDS}
        last = {w.lower() for w in words(rows[-1]["text"]) if w.lower() not in STOPWORDS}
        loop = sorted(pretty(w) for w in first & last)
    if loop:
        notes.append(f"Loops: the last beat repeats \"{', '.join(loop[:3])}\" from the hook. "
                     "Second watches are free reach.")
    else:
        notes.append("No loop. The last beat shares no word with the hook, so the video "
                     "ends flat. Echoing one word from beat 1 is the cheapest replay you get.")

    if target:
        delta = total - target
        if abs(delta) <= target * 0.1:
            notes.append(f"Length is on target ({total:.1f}s against {target}s).")
        elif delta > 0:
            notes.append(f"{delta:.1f}s over target. Cut about {int(delta * wps)} words.")
        else:
            notes.append(f"{-delta:.1f}s under target. Either add {int(-delta * wps)} words "
                         "or shoot it short. Short is usually right.")

    return {
        "wpm": wpm, "target": target, "lang": lang,
        "total_seconds": round(total, 2),
        "total_words": sum(r["words"] for r in rows),
        "beats": rows,
        "notes": notes,
    }


def render(a, out=sys.stdout):
    head = (f"BEAT SHEET  ·  {a['total_words']} words  ·  ~{a['total_seconds']:.1f}s "
            f"at {a['wpm']:g} wpm" + (f"  ·  target {a['target']}s" if a["target"] else ""))
    print("\n" + head, file=out)
    print("=" * max(len(head), 72), file=out)
    for r in a["beats"]:
        label = f"{r['label']:<8}" if r["label"] else " " * 8
        print(f"  {tc(r['start'])}  {r['dur']:4.1f}s  {label}{r['text']}", file=out)
        for f in r["flags"]:
            print(f"  {'':>6}  {'':>5}  {'':<8}^ {f}", file=out)
    print("-" * max(len(head), 72), file=out)
    for n in a["notes"]:
        print(f"  - {n}", file=out)
    print("", file=out)


def main():
    ap = argparse.ArgumentParser(description="Time a Reel script into a beat sheet.")
    ap.add_argument("input", nargs="?", default="-", help="script file, or - for stdin")
    ap.add_argument("--wpm", type=float, default=None,
                    help="speaking rate (default 165, or 150 for German)")
    ap.add_argument("--lang", choices=["auto", "en", "de"], default="auto",
                    help="script language (default: auto-detect)")
    ap.add_argument("--target", type=float, help="target length in seconds")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    raw = sys.stdin.read() if args.input == "-" else open(args.input, encoding="utf-8").read()
    a = analyse(raw, wpm=args.wpm, target=args.target, lang=args.lang)
    if not a:
        print("empty script", file=sys.stderr)
        sys.exit(2)
    if args.json:
        print(json.dumps(a, indent=2, ensure_ascii=False))
    else:
        render(a)
    sys.exit(0)


if __name__ == "__main__":
    main()
