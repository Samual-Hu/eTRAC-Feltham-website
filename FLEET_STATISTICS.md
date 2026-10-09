# Fleet overview and train history

The primary overview cards count recording sessions and carriage passages, including repeat visits. Secondary notes show distinct units and carriages summed once per unique unit: 701/0 = 10, 450 and 458 = 8 (the configured formation convention for this demonstration). Captures count each recording time; matching A/B recordings at the same minute are presented together.

Dates default to calendar days. Select “Overnight · 19:00–07:00” and 19 August to include 19 August 19:00 through 20 August 06:59. Actual recording timestamps remain visible. This is a viewing window, not an inferred operational date or direction of travel.

Wash-entry records count sessions whose source folder contains the `wash` token: evidence of entry into an operating wash plant. These images show pre-wash surfaces, not the result of washing. Wash-entry history includes only marked sessions; morning departures do not receive a wash-status label.

Cleanliness percentages use the most recent explicitly assessed carriage surface per unit/side/serial within the selection. Unassessed records are excluded; no denominator produces a dash rather than a fabricated percentage. Surface issue totals instead sum all panorama annotations in the selected period, including repeated observations across dates; they do not count distinct physical defects. Percentages are rounded independently.

Train history shows all panorama inspection records for the selected unit. Its issue totals count annotations across inspections, not distinct persistent physical defects. Green (Compliant) is above amber (Marginal), which is above red (Non-compliant). Hollow points indicate no explicit assessment, and line segments do not bridge missing assessments. Every point links to the relevant event and carriage. Wash history also includes video recordings.

Material names may include `_wash` before the upload batch suffix, e.g. `701013_260820_0019_B_wash_0904`. Upload batch dates do not change recording dates. Repeated same-day video visits have distinct event identifiers; established panorama identifiers remain unchanged.

Local check: `node test_fleet.cjs` verifies repeat-visit separation, the 10 new batches, the reference overnight totals (10 captures, 7 units, 64 distinct carriages, 7 wash-entry records), and carriage history links.
