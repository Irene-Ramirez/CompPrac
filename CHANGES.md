# Dashboard Additions (Milestone 4)

These changes add four features and fix one tab bug. Nothing in the existing
data files was changed, and `script.js` has only a three-line fix (see "Tab fix").

## Files

| File | Status | Purpose |
|---|---|---|
| `additions.js` | New | All JavaScript for the new features |
| `additions.css` | New | All styles for the new features |
| `data/jaxport_lane_top_ports.json` | New | Leading U.S. port and its share for each of the 100 lanes |
| `data/jaxport_model_steps.json` | New | R² for the three regression models (Milestone Report 3) |
| `data/jaxport_error_by_group.json` | New | Neural network error by group (dashboard files and Milestone Report 3) |
| `index.html` | Edited | New HTML blocks, each wrapped in `ADDITION START` / `ADDITION END` comments |
| `script.js` | Edited | Tab fix only, marked with a `FIX` comment |

## What was added

1. **Key takeaways box** (Overview tab): four summary points at the top of the page.
2. **Rank and growth cards** (Overview tab): Jacksonville's 2025 growth vs. the market (+34.7% vs. +3.8%) and its rank among the 28 ports (13th, up from 15th). Calculated from the existing port and quarterly data files.
3. **What Explains Trade Value chart** (Predictive Models tab): R² as volume, weight and commodity type are added (55.15%, 63.19%, 80.95%).
4. **Prediction Error by Group chart and Data-Quality Caution** (Predictive Models tab): error for Jacksonville, all ports, HS26 and HS71, plus a note on extreme trade values.
5. **Leading U.S. Port column and concentration finding** (Opportunities tab): which port handles the most 2025 volume in each lane. Lanes where one port handles more than half are shown in orange.

## Tab fix

The tab code listed section ids that did not exist in `index.html`
(`overview-section`, `directions-section`, `commodities-section`), so Sections 1–3
appeared on every tab. The fix adds `id="overview-section"` to Section 1 in
`index.html` and corrects the other two ids in `script.js`. Sections 1–3 now
appear only on the Overview tab.

## How to remove

- **Everything:** delete `additions.js`, `additions.css` and the three new data
  files, then delete every block between `ADDITION START` and `ADDITION END` in
  `index.html`.
- **One feature:** delete only its `ADDITION` block in `index.html`. The other
  features keep working, because each one checks that its own HTML exists.
- **The tab fix:** undo the two marked `FIX` changes (not recommended).

Committing each feature separately on GitHub also lets any one be undone with
"Revert" later.
