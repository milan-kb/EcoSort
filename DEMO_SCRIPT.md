# EcoSort: 3–5 minute college demonstration

## Before presenting

- Install dependencies in advance; run `npm run dev` and open the printed local URL.
- Choose **Panchayat Administrator**, click **Reset demo**, and confirm. This restores fictional examples. No internet or account is needed.
- Leave online map tiles disabled if the classroom has no internet. Do not enter real household information.
- Tell the audience: “The Vellangallur description is our assigned problem scenario, not a verified statement about current municipal services. Every example here is synthetic.”

## 0:00–0:35 — The real problem

“A complaint alone does not move waste. EcoSort connects household segregation, pickup coordination, physical collection and a recorded destination. Software supports people; it does not create collectors, facilities or municipal partnerships.”

Switch the visible **Demo role** selector to **Resident**. Point out the main pickup action, secondary dumping report, guide and real stored request statuses.

## 0:35–1:30 — Start at the household

1. Open **Segregation guide**. Briefly show Organic, Plastic and E-waste/hazardous guidance. Explain that dry waste is not automatically recyclable and hazardous waste must be handled separately.
2. Return to **Overview** and click **Request waste pickup**.
3. Choose **Plastic**, quantity **2 separated bags**, **Ward 3**, and address **Demo household 7, classroom lane**. Optional details: **Clean empty containers kept separately**.
4. Leave GPS/photo/date optional. Check the explicit segregation confirmation and submit.
5. Show the unique **ECO-…** ID and Pending timeline. “A preferred date is a request, not a guaranteed appointment. The job needs review and assignment.”

## 1:30–2:15 — Coordinate with accountability

1. Switch to **Administrator**. Observe that total and pending counts include the new request.
2. Open **All requests**, search **classroom lane**, and open the result.
3. Select **Ravi Kumar · Ward 3**, click **Assign collector**, and confirm the dialog.
4. Show the Assigned timeline and collector name. “In a real deployment, an administrator must check worker availability, equipment and category-specific authorization.”

## 2:15–3:10 — Record physical collection

1. Switch to **Collector · Ravi Kumar**. Find the new job in assigned tasks. The other collector does not see it.
2. Click **Start collection**. Open the job details and choose **Confirm physical collection** (the task card also offers **Confirm collection**).
3. Keep **Intended destination — not yet handed over**. Choose **Sorting / material recovery**, enter **Demo sorting point — fictional**, and optionally add notes.
4. Check the explicit physical collection confirmation. Explain that you are simulating this physical event for the classroom.
5. Click **Mark collected & save destination**. Show the timestamp and **Intended destination only** record.

“Collected is not the same as recycled. An intended destination is not a confirmed handover, and even a recorded handover is not independent proof of treatment.”

## 3:10–4:00 — Close the loop

1. Switch to **Resident** → **My requests** → find the new request. Show **Collected**, the completed timeline and collection confirmation.
2. Refresh the page. The record persists in this browser.
3. Switch to **Administrator**. Collected count and completion rate have updated from the same underlying records.
4. Optionally show **Waste map** and **Analytics**. Point out “Synthetic pins” and the offline coordinate-view label. Charts are derived, not hardcoded.

## 4:00–4:30 — Human values and honest boundaries

“Responsibility means separating waste and making truthful confirmations. Cooperation means coordinating residents, collectors and administrators. Participation means households can act, not only complain. Harmony with nature means careful separation and appropriate handling.”

Mention that open dumping has a **separate report form** for existing public sites, including a manual location option if GPS is denied. End with: “Real collection workers and authorized destinations are still essential. Technology makes responsible action easier to coordinate and account for.”

If asked about production: “Supabase SQL, RLS and integration code are included. Embedded PostgreSQL checks exercise the policies, but hosted authentication and storage still require project credentials and end-to-end verification.”
