# Documentation screenshot notes

These images document the actual EcoSort demo, not design mockups. All depicted users, phone numbers, locations and operational figures are fictional.

| Curated image                                        | Source QA capture                 | Content                                               |
| ---------------------------------------------------- | --------------------------------- | ----------------------------------------------------- |
| [resident-overview.webp](resident-overview.webp)     | `qa-artifacts/resident-1440.png`  | Resident overview, pickup action and recent requests. |
| [collector-tasks.webp](collector-tasks.webp)         | `qa-artifacts/collector-1440.png` | Assigned task cards and collection actions.           |
| [panchayat-dashboard.webp](panchayat-dashboard.webp) | `qa-artifacts/admin-1440.png`     | Operational counts and category chart.                |

The originals were captured by the final QA visual browser test and visually checked before selection. Curated copies are resized to a maximum width of 1,200 pixels and encoded as WebP for repository size; full-page content is preserved. They may show dated seed values rather than your current session.

The original `qa-artifacts/` is intentionally ignored/generated and need not exist in a fresh copy. These three documentation images live outside it so the README remains usable. There is no image-processing dependency added to the app.

To refresh them, run the demo-mode [visual tests](../TESTING.md), choose representative synthetic captures, inspect for secrets/personal data and regenerate only these curated copies. Keep filenames and alt text in sync with [README](../../README.md) and [Feature guide](../FEATURE_GUIDE.md). Do not include real account sessions or signed image URLs.
