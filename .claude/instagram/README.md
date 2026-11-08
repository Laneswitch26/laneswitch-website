# Instagram-Skills für LANE SWITCH

Die 13 Skills in `.claude/skills/ig-*` lädt Claude Code automatisch in jeder
Sitzung mit diesem Repo. Sie gehören nicht zur Website: GitHub Pages
veröffentlicht Ordner, die mit einem Punkt beginnen (`.claude/`), nicht.

Quelle: [Jakeschincariol/instagram-agent-skill](https://github.com/Jakeschincariol/instagram-agent-skill)
(MIT-Lizenz, siehe `LICENSE-instagram-agent-skill`), Stand `d03c56b`.
Angepasst:

- `ig-reel/hookscore.py` und `ig-reel/beats.py` verstehen Deutsch (automatisch
  erkannt, oder `--lang de`). Für englische Texte rechnen sie genau wie das Original.
- `ig-reel/SKILL.md` hat einen Abschnitt „German Reels“.
- Arbeitsdateien liegen hier in `.claude/instagram/` statt in `~/.claude/instagram/`,
  damit sie Cloud-Sitzungen überleben, wenn man sie committet.

## Arbeitsdateien in diesem Ordner

| Datei | Kommt von | Inhalt |
|---|---|---|
| `voice.md` | `/ig-reel`, `/ig-plan` beim ersten Lauf | Wie du sprichst, Du/Sie, Wörter, die du nie benutzt |
| `swipe.md` | `/ig-viral` | Welche Hook-Formeln in deiner Nische gerade funktionieren |
| `plan.md` | `/ig-plan` | Wochenplan |
| `log.md` | `/ig-reel`, `/ig-comment` nach „ja“ | Was gepostet wurde, für `/ig-audit` |

**Achtung: Das Repo ist öffentlich.** Alles, was hier committet wird, kann jeder
auf GitHub lesen (nicht auf laneswitch.de). Keine Kundendaten, DMs oder
Namen von Fahrschüler:innen committen.

`voice.template.md` ist die Vorlage für `voice.md`.
