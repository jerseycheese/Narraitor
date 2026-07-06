# Append-only correction block

Paste at the end of the doc/section/issue containing the wrong claim. Do not edit the original claim beyond adding a pointer: `(see CORRECTION below, <date>)`.

```markdown
---
CORRECTION (<YYYY-MM-DD>, <author/session>):
- Earlier claim: "<verbatim or tight paraphrase>"
- Why it was wrong: <root cause of the error - stale source, unverified memory, changed code>
- Actual state: <the verified fact>
- Evidence: <command + output / file:line / PR / CI run>
- Follow-ups: <docs or memories that repeat the wrong claim and still need marking>
---
```
