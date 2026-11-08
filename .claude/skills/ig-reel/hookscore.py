#!/usr/bin/env python3
"""
hookscore.py - score the first line of a Reel on the five things strong hooks
have in common, and rank a batch of them against each other.

What this is:  five local heuristics, computed on your machine from the text
alone. They measure properties that hooks which hold attention tend to share -
a length you can say in under three seconds, a concrete marker, something at stake,
the payload at the front rather than the back, and a viewer to aim it at.

What this is NOT:  a view predictor. It was tested against 74 real short-form
hooks, transcribed from the first three seconds of the top eight and bottom
eight performers on five channels. Separating a real hook from a deliberately
bad one it does well: AUC 0.83, and 9 of 10 written-to-be-bad hooks scored
below the real median. Separating a good creator's hits from that same
creator's misses it barely does at all: AUC 0.56, where 0.50 is a coin flip.

So use it for what it measured well. It catches greetings, preambles, hooks
with nothing concrete in them and hooks that take five seconds to say. It will
not tell you which of two decent hooks will travel, and nothing that reads text
can, because that is decided by your face, your edit, your audio and who
Instagram shows it to. Trust the retention graph over this script.

Each check returns 0 to 100. Higher is better.

Usage
  python3 hookscore.py hooks.txt              # one hook per line, ranked
  python3 hookscore.py --hook "I lost $18,000 on one missing contract."
  pbpaste | python3 hookscore.py -
  python3 hookscore.py hooks.txt --json
  python3 hookscore.py hooks.txt --lang de   # German hooks (auto-detected too)

German (--lang de, or detected automatically): German number words and
units, euro amounts, German stakes words, openers, greetings and preambles,
and du/ihr/Sie as viewer address. Capitalised nouns are NOT counted as names
in German, because every German noun is capitalised; only all-caps words,
CamelCase brands and words with digits count. The thresholds are the same,
but the scores were calibrated on English hooks, so compare German hooks
with each other rather than reading 50 as a hard line.
"""

import argparse
import json
import re
import statistics
import sys

WORD_RE = re.compile(r"[A-Za-zÄÖÜäöüß0-9$€%'’-]+")
NUMBER_RE = re.compile(
    r"\$\s?\d[\d,]*(?:\.\d+)?"                       # money, whole
    r"|\b\d[\d,]*(?:\.\d+)?\s?"                      # a figure, with or
    r"(?:%|k\b|x\b|hrs?\b|hours?\b|mins?\b|minutes?\b"  # without a unit
    r"|days?\b|weeks?\b|months?\b|years?\b)?",
    re.IGNORECASE)
PROPER_RE = re.compile(r"(?<!^)\b[A-Z][a-z]{2,}\b")
HASHTAG_RE = re.compile(r"(?:^|\s)#\w+")
EMOJI_RE = re.compile(r"[\U0001F300-\U0001FAFF☀-➿]")

# ---------------------------------------------------------------- German --
DE_NUMBER_RE = re.compile(
    r"\d[\d.,]*\s?(?:€|eur\b|euro\b)"                 # 18.000 €
    r"|€\s?\d[\d.,]*"                                  # €18.000
    r"|\b\d[\d.,]*\s?"                                # a figure, with or
    r"(?:%|k\b|x\b|std\b|stunden?\b|min\b|minuten?\b"  # without a unit
    r"|sek\b|sekunden?\b|tagen?\b|tage\b|wochen?\b|monaten?\b|monate\b"
    r"|jahren?\b|jahre\b|mal\b|prozent\b)?",
    re.IGNORECASE)
# Only unmistakable names: ALLCAPS, CamelCase brands, words with digits.
DE_PROPER_RE = re.compile(r"\b(?:[A-ZÄÖÜ]{2,}[A-ZÄÖÜ0-9]*|[A-ZÄÖÜ][a-zäöüß]+[A-ZÄÖÜ]\w*|[A-Za-z]+\d\w*)\b")
DE_NUMBER_WORD_RE = re.compile(
    r"^(?:null|ein|eins|zwei|drei|vier|fünf|sechs|sech|sieben|sieb|acht|neun"
    r"|zehn|elf|zwölf|zwan|zig|ßig|und|hundert|tausend)+$")
DE_NUMBER_WORD_EXCLUDE = {"ein", "eins", "und", "acht", "elf"}
DE_SPOKEN_NUMBERS = {
    "million", "millionen", "milliarde", "milliarden", "dutzend", "halb",
    "hälfte", "doppelt", "doppelte", "dreifach", "zehnfach", "verdoppelt",
}
DE_MONEY_WORDS = {
    "euro", "euros", "eur", "cent", "franken", "prozent", "umsatz", "gewinn",
    "gehalt", "miete", "millionär", "kohle", "kosten", "rechnung", "honorar",
}
DE_STAKES = {
    "hör", "hört", "stopp", "nie", "niemals", "falsch", "fehler", "verloren",
    "verlieren", "verliert", "kostet", "kosten", "gekostet", "pleite", "kaputt",
    "gescheitert", "scheitern", "niemand", "keiner", "kein", "keine", "keinen",
    "nicht", "nichts", "aufgehört", "gekündigt", "kündigen", "rausgeworfen",
    "gefeuert", "gelöscht", "löschen", "ersetzt", "ersetzen", "gratis",
    "kostenlos", "bezahlt", "gespart", "sparen", "verboten", "illegal",
    "schlimmste", "schlimmster", "hasse", "gehasst", "verschwendet",
    "verschwendung", "abzocke", "lüge", "gelogen", "wahrheit", "geheim",
    "geheimnis", "versteckt", "geklaut", "bevor", "bis", "statt", "stattdessen",
    "aber", "außer", "problem", "risiko", "gefahr", "warnung", "bereue",
    "bereut", "wünschte", "solltest", "sollte", "noch", "schon", "bereits",
    "nur", "ohne", "gegen", "eigentlich", "erst", "endlich", "zuerst",
}
DE_WEAK_OPENERS = [
    "also", "ok", "okay", "hey", "hallo", "hi", "leute", "na", "moin",
    "servus", "heute", "im grunde", "ehrlich gesagt", "ehrlich", "schau mal",
    "hör zu", "ähm", "äh", "einfach", "lass", "lasst", "ich wollte", "ich will",
    "eines der", "einer der", "hast du", "habt ihr", "weißt du", "bist du",
    "kennst du", "in diesem", "im heutigen", "das ding", "es gibt", "das ist",
    "es ist", "als", "wenn es", "du weißt", "so", "ja", "willkommen",
]
DE_IMPERATIVES = {
    "hör", "hört", "stopp", "klau", "klaut", "kopier", "kopiere", "lösch",
    "lösche", "probier", "probiere", "teste", "schau", "lies", "speicher",
    "speichere", "nutz", "nutze", "bau", "baue", "mach", "mache", "schreib",
    "schreibe", "schick", "schicke", "nimm", "starte", "fang", "kündige",
    "nie", "niemals", "immer", "tu", "check", "vergiss", "merk", "spar",
}
DE_DEALBREAKERS = [
    (re.compile(r"(?i)^\s*(?:hör auf zu scrollen|nicht (?:weiter)?scrollen|stopp?,? nicht scrollen|scroll nicht)"),
     "Opens with \"hör auf zu scrollen\". Asking for attention proves you have not earned it."),
    (re.compile(r"(?i)\b(?:in diesem (?:video|reel)|im heutigen (?:video|reel)|heute zeig(?:e)? ich|ich zeig(?:e)? (?:dir|euch|ihnen)|ich werde (?:dir|euch) zeigen)\b"),
     "Video preamble. Delete it and open on the payoff."),
    (re.compile(r"(?i)^\s*(?:hey|hallo|hi|moin|servus|na|willkommen|grüß (?:dich|euch))\b[ ,!]"),
     "Greeting. Nobody came to the feed to be greeted."),
]
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


def is_de_number_word(w):
    return (w in DE_SPOKEN_NUMBERS
            or (w not in DE_NUMBER_WORD_EXCLUDE and DE_NUMBER_WORD_RE.match(w) is not None))


class Lang:
    """The language-dependent word lists, picked once per run."""
    def __init__(self, code):
        self.code = code
        if code == "de":
            self.number_re, self.proper_re = DE_NUMBER_RE, DE_PROPER_RE
            self.money = DE_MONEY_WORDS
            self.stakes, self.weak, self.imperatives = DE_STAKES, DE_WEAK_OPENERS, DE_IMPERATIVES
            self.wps = 2.5               # ~150 wpm: German words run longer
            self.dealbreakers = DE_DEALBREAKERS + DEALBREAKERS[3:]
            self.you_re = r"\b(du|dir|dich|dein\w*|ihr|euch|euer|eure\w*|sie|ihnen)\b"
            self.me_re = r"\b(ich|mir|mich|mein\w*|wir|uns|unser\w*)\b"
        else:
            self.number_re, self.proper_re = NUMBER_RE, PROPER_RE
            self.money = MONEY_WORDS
            self.stakes, self.weak, self.imperatives = STAKES, WEAK_OPENERS, IMPERATIVES
            self.wps = 2.75              # ~165 wpm
            self.dealbreakers = DEALBREAKERS
            self.you_re = r"\b(you|your|you're|youre|yourself)\b"
            self.me_re = r"\b(i|my|me|we|our)\b"

    def is_number_word(self, w):
        return is_de_number_word(w) if self.code == "de" else w in SPOKEN_NUMBERS

    def has_price(self, text):
        if self.code == "de":
            return re.search(r"€\s?\d|\d[\d.,]*\s?(?:€|euro\b|eur\b)", text, re.I) is not None
        return re.search(r"\$\s?\d", text) is not None


LANG = None   # set in run()


# Spoken hooks say their numbers out loud. "Zero dollars" and "twenty grand"
# are as concrete as "$0" and "$20,000", and counting only digits missed them.
# "one" and "first" are deliberately absent: they are filler far more often
# than they are a quantity.
SPOKEN_NUMBERS = {
    "zero", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "fifteen", "twenty", "thirty", "forty", "fifty",
    "sixty", "seventy", "eighty", "ninety", "hundred", "thousand", "million",
    "billion", "dozen", "half", "twice", "triple",
}
MONEY_WORDS = {
    "dollars", "dollar", "bucks", "grand", "percent", "cents",
    "millionaire", "billionaire", "revenue", "profit", "salary", "rent",
}

# Words that put something on the line. A hook with none of these is a
# statement; a hook with one is a reason to keep watching.
STAKES = {
    "stop", "never", "wrong", "mistake", "mistakes", "lost", "lose", "losing",
    "cost", "costs", "broke", "broken", "failed", "failure", "fail", "nobody",
    "no", "not", "don't", "dont", "doesn't", "didn't", "can't", "won't",
    "quit", "quitting", "fired", "deleted", "delete", "killed", "kills", "kill",
    "replaced", "replaces", "cut", "beat", "free", "paid", "charged", "hired",
    "saved", "first",
    "banned", "illegal", "worst", "hate", "hated", "wasted", "waste", "scam",
    "lie", "lied", "lying", "truth", "secret", "hidden", "stole", "stolen",
    "before", "until", "instead", "but", "except", "unless", "problem",
    "risk", "danger", "warning", "regret", "wish", "should", "shouldn't",
    "still", "already", "only", "without", "versus", "vs", "actually",
}

# Openers that spend the first second saying nothing.
WEAK_OPENERS = [
    "so", "ok", "okay", "hey", "hi", "hello", "guys", "yo", "alright",
    "welcome", "today", "basically", "honestly", "look", "listen", "um",
    "just", "let", "lets", "let's", "i wanted", "i want", "one of",
    "have you", "did you", "do you", "are you", "in this", "in today",
    "the thing", "a lot", "there is", "there are", "this is", "it is",
    "as a", "when it", "if you've", "you know",
]

# Imperatives that earn the front position.
IMPERATIVES = {
    "stop", "steal", "copy", "delete", "try", "watch", "read", "save",
    "use", "build", "make", "write", "send", "take", "start", "quit",
    "never", "always", "don't", "dont", "do", "put", "run", "check",
}

DEALBREAKERS = [
    (re.compile(r"(?i)^\s*(?:stop scrolling|don'?t scroll)"),
     "Opens with \"stop scrolling\". Asking for attention proves you have not earned it."),
    (re.compile(r"(?i)\b(?:in (?:this|today'?s) (?:video|reel)|i'?m going to show you|i'?ll show you how)\b"),
     "Video preamble. Delete it and open on the payoff."),
    (re.compile(r"(?i)^\s*(?:hey |hi |what'?s up |welcome )"),
     "Greeting. Nobody came to the feed to be greeted."),
    (HASHTAG_RE,
     "Hashtag in the hook. Hashtags belong at the bottom of the caption, if anywhere."),
    (EMOJI_RE,
     "Emoji in the hook. On-screen text at hook size has room for words or for an emoji, not both."),
]


def clamp(n):
    return max(0.0, min(100.0, n))


def words(text):
    # "$18,000" is one word when it is spoken, so it is one word here too.
    return WORD_RE.findall(re.sub(r"(?<=\d),(?=\d)", "", text))


def check_length(text):
    """A hook has to land before the thumb moves. Roughly two seconds."""
    w = words(text)
    n = len(w)
    secs = n / LANG.wps                  # ~165 wpm English, ~150 German
    chars = len(text.strip())
    if 5 <= n <= 12:
        score = 100.0
    elif n < 5:
        score = clamp(100 - (5 - n) * 20)
    else:
        score = clamp(100 - (n - 12) * 11)
    if chars > 60:                       # two lines of big on-screen text
        score -= 12
    return clamp(score), f"{n} words, {chars} chars, ~{secs:.1f}s spoken (want 5-12 words)"


def check_specificity(text):
    """One concrete thing beats three abstract ones."""
    nums = [n.strip() for n in LANG.number_re.findall(text) if n.strip()]
    propers = set(LANG.proper_re.findall(text))
    low = [w.lower().strip("'’") for w in words(text)]
    spoken = [w for w in low if LANG.is_number_word(w) or w in LANG.money]
    hits = len(nums) + len(propers) + len(spoken)
    score = 15.0 if hits == 0 else clamp(45 + hits * 30)
    found = ", ".join(nums[:2] + sorted(propers)[:2] + spoken[:2])
    return score, (f"{hits} concrete marker(s)" + (f": {found}" if found else
                   " - no number, no name, nothing checkable"))


def check_stakes(text):
    """Tension, cost, negation. Something the viewer might lose."""
    w = [x.lower().strip("'’") for x in words(text)]
    hits = [x for x in w if x in LANG.stakes]
    markers = sorted(set(hits))
    if LANG.has_price(text):
        markers.append("a price")
    n = len(markers)
    score = {0: 20.0, 1: 70.0}.get(n, 100.0)
    detail = f"{n} tension marker(s)" + (f": {', '.join(markers[:4])}" if markers else
                                         " - nothing is at stake in this line")
    return clamp(score), detail


def check_frontload(text):
    """The interesting word cannot be in position nine."""
    w = words(text)
    if not w:
        return 0.0, "empty"
    low = [x.lower().strip("'’") for x in w]
    opener = " ".join(low[:2])
    penalty = 0
    hit_opener = None
    for weak in LANG.weak:
        if opener.startswith(weak) or low[0] == weak:
            penalty, hit_opener = 30, weak
            break
    payload = None
    for i, token in enumerate(low):
        if (token in LANG.stakes or LANG.is_number_word(token) or token in LANG.money
                or LANG.number_re.match(w[i])
                or ((i or LANG.code == "de") and LANG.proper_re.fullmatch(w[i]))):
            payload = i
            break
    if payload is None:
        base = 30.0
        where = "no payload word anywhere in the line"
    elif payload <= 3:
        base = 100.0
        where = f"payload at word {payload + 1}"
    elif payload <= 6:
        base = 70.0
        where = f"payload at word {payload + 1}, could move forward"
    else:
        base = 40.0
        where = f"payload at word {payload + 1}, too late"
    detail = where + (f"; weak opener \"{hit_opener}\"" if hit_opener else "")
    return clamp(base - penalty), detail


def check_address(text):
    """Aimed at one viewer, or floating in the air."""
    low = text.lower()
    w = [x.lower().strip("'’") for x in words(text)]
    if re.search(LANG.you_re, low):
        return 100.0, "speaks to the viewer"
    if w and w[0] in LANG.imperatives:
        return 90.0, f"imperative opener (\"{w[0]}\")"
    if re.search(LANG.me_re, low):
        return 70.0, "first person, no viewer named"
    return 35.0, "third person, nobody in the room"


CHECKS = ["LENGTH", "SPECIFICITY", "STAKES", "FRONTLOAD", "ADDRESS"]


def run(text, lang="en"):
    global LANG
    LANG = Lang(detect_lang(text) if lang == "auto" else lang)
    results = {
        "LENGTH": check_length(text),
        "SPECIFICITY": check_specificity(text),
        "STAKES": check_stakes(text),
        "FRONTLOAD": check_frontload(text),
        "ADDRESS": check_address(text),
    }
    flags = [msg for pattern, msg in LANG.dealbreakers if pattern.search(text)]
    scores = [results[c][0] for c in CHECKS]
    # The weakest property caps the hook, same logic as detect.py: one bad
    # property is enough for the thumb to keep moving.
    overall = statistics.mean(scores) * 0.6 + min(scores) * 0.4 - len(flags) * 15
    overall = clamp(overall)
    verdict = "STRONG" if overall >= 70 and min(scores) >= 55 and not flags else (
        "OK" if overall >= 50 else "WEAK")
    return results, overall, verdict, flags


def bar(score, width=24):
    filled = round(score / 100 * width)
    return "#" * filled + "." * (width - filled)


def render_one(text, results, overall, verdict, flags, out=sys.stdout):
    print("\nHOOK SCORE", file=out)
    print("=" * 62, file=out)
    print(f"  \"{text.strip()}\"\n", file=out)
    for name in CHECKS:
        score, detail = results[name]
        print(f"  {name:<13} {bar(score)} {score:5.1f}", file=out)
        print(f"  {'':<13} {detail}", file=out)
    print("-" * 62, file=out)
    print(f"  {'HOOK SCORE':<13} {bar(overall)} {overall:5.1f}   {verdict}", file=out)
    for f in flags:
        print(f"\n  DEALBREAKER  {f}", file=out)
    if verdict != "STRONG":
        weakest = min(CHECKS, key=lambda c: results[c][0])
        print(f"\n  Weakest property: {weakest}. Fix that one and re-run.", file=out)
    print("", file=out)


def render_table(rows, out=sys.stdout):
    print("\nHOOK RANKING\n" + "=" * 78, file=out)
    for i, r in enumerate(rows, 1):
        mark = "->" if i == 1 else "  "
        hook = r["hook"] if len(r["hook"]) <= 62 else r["hook"][:59] + "..."
        print(f"{mark} {r['score']:5.1f} {r['verdict']:<7} {hook}", file=out)
        print(f"        weakest: {r['weakest']} ({r['checks'][r['weakest']]['score']:.0f})", file=out)
        for f in r["flags"]:
            print(f"        dealbreaker: {f}", file=out)
    print("\nShoot the top one. If the top one is under 50, none of these are the hook.\n",
          file=out)


def main():
    ap = argparse.ArgumentParser(description="Score a Reel hook on five properties.")
    ap.add_argument("input", nargs="?", default="-", help="file with one hook per line, or -")
    ap.add_argument("--hook", help="score a single hook given on the command line")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--lang", choices=["auto", "en", "de"], default="auto",
                    help="hook language (default: auto-detect per hook)")
    args = ap.parse_args()

    if args.hook:
        lines = [args.hook]
    else:
        raw = sys.stdin.read() if args.input == "-" else open(args.input, encoding="utf-8").read()
        lines = [l.strip() for l in raw.splitlines() if l.strip()]
    if not lines:
        print("nothing to score", file=sys.stderr)
        sys.exit(2)

    payload = []
    for line in lines:
        results, overall, verdict, flags = run(line, args.lang)
        payload.append({
            "hook": line,
            "lang": LANG.code,
            "checks": {k: {"score": round(v[0], 1), "detail": v[1]} for k, v in results.items()},
            "weakest": min(CHECKS, key=lambda c: results[c][0]),
            "flags": flags,
            "score": round(overall, 1),
            "verdict": verdict,
        })

    if args.json:
        print(json.dumps(payload if len(payload) > 1 else payload[0], indent=2, ensure_ascii=False))
        return

    if len(payload) == 1:
        results, overall, verdict, flags = run(lines[0], args.lang)
        render_one(lines[0], results, overall, verdict, flags)
    else:
        render_table(sorted(payload, key=lambda r: -r["score"]))

    sys.exit(0 if max(p["score"] for p in payload) >= 70 else 1)


if __name__ == "__main__":
    main()
