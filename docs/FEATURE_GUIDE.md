# Feature guide: using the three workspaces

This guide describes implemented screens and expected results. Use [Start here](START_HERE.md) to launch the demo, or [Demo script](../DEMO_SCRIPT.md) for a short presentation. Every screenshot below uses synthetic data.

## Resident

![Resident overview in the local demo](images/resident-overview.webp)

| Screen                                     | What you can do                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Overview (`/resident`)                     | Start a pickup, report dumping, open guidance and see your pending/active/collected counts and recent records.           |
| Request pickup (`/resident/pickup`)        | Choose one separated category, approximate quantity, ward and address; explicitly confirm segregation.                   |
| Report dumping (`/resident/dumping`)       | Describe an existing public site separately from a household pickup; Mixed/Unknown categories are allowed.               |
| Segregation guide (`/resident/guide`)      | Read category examples, storage advice and cautions; it is manual guidance, not image AI.                                |
| My requests (`/resident/requests`)         | Search ID/category/location; filter status, ward, category, request type or follow-up; browse eight results per page.    |
| Request details (`/resident/requests/:id`) | Inspect timeline, assignment, submitted photo and collection/destination; cancel your own Pending request with a reason. |

### Submit a household pickup

1. Read the guide and separate the material outside the app. In a demo, describe a simulated household only.
2. Choose a category other than Mixed/Unknown and enter a quantity such as `2 separated bags`.
3. Select a ward and give an address/landmark of 5–300 characters.
4. Optionally add a photo, description (up to 2,000 characters), preferred date or coordinates. A preferred date is a request, **not a guaranteed appointment**.
5. Check the segregation confirmation and submit. The new record has an ECO display label and **Pending** status; the full underlying ID is a UUID.

Missing required inputs produce validation messages. Coordinates must be supplied together: latitude −90 to 90 and longitude −180 to 180, or both absent. Blank coordinates are not `0,0`.

### Report existing dumping

Use **Spot open dumping?**, not the pickup form. Enter a site description of at least 10 characters and its address; segregation confirmation is not required. Quantity may be unestimated. Reporting does not itself assign a worker or claim cleanup happened. Review, assignment and collection remain separate steps.

### Photos, location and privacy

- Photos are optional JPEG/PNG/WebP files, non-empty and at most 2 MB. Invalid type/content/size is rejected on submission; a preview alone is not validation. Avoid faces, identifying documents and real household details in demos.
- You may type an address without GPS. **Use my current location** can be denied; use manual coordinates or a map pin instead. Browser geolocation generally requires localhost or HTTPS.
- Demo maps begin as a labeled offline coordinate grid. **Online map tiles** needs internet. Pins in demo are not real incident evidence.
- **Open external navigation** sends the destination to Google Maps; it is not an in-app routing system.

## Collector

![Collector active tasks in the local demo](images/collector-tasks.webp)

`/collector` shows **Active jobs** (Assigned/In Progress) and **Collected** tabs for your authorized assignments, not a community directory. Open **View details** for address, material, timeline and available actions. **Navigate** opens an external map.

### Start and finish a job

1. An administrator must assign it to you. Unassigned jobs cannot be started/completed by guessing URLs.
2. Click **Start collection**: Assigned becomes **In Progress**. Starting is not proof that waste was collected.
3. Click **Confirm collection** on the task card, or **Confirm physical collection** in its details.
4. Choose destination type and a name of 3–200 characters. Choose **Intended destination — not yet handed over**, or **Actual handover** only if actually delivered. Notes (up to 2,000 characters) and a proof photo are optional.
5. Explicitly confirm physical collection, then **Mark collected & save destination**. The timestamp, collection record, completed assignment and Collected status are saved together in the database (or one demo snapshot).

E-waste/hazardous jobs require the `authorized_hazardous` destination type. The software does not certify training, inspect the destination or automatically verify handover. Completed records cannot be reopened or corrected through the UI. An intended destination cannot later be upgraded through a separate handover workflow; no such feature exists yet.

## Panchayat Administrator

![Panchayat dashboard in the local demo](images/panchayat-dashboard.webp)

| Screen                                  | What it shows or does                                                                                                                  |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Overview (`/admin`)                     | Total, Pending, active, Collected and unassigned counts; follow-up queue summary; category chart, completion rate and recent requests. |
| All requests (`/admin/requests`)        | Pickups and dumping reports with shared search/filters/pagination. Open a row to inspect submitted evidence and recorded destination.  |
| Assignments (`/admin/assignments`)      | Pending/Assigned jobs needing assignment or reassignment before work starts.                                                           |
| Request details (`/admin/requests/:id`) | Choose an authorized collector, confirm assignment, review collection, or reject an unfinished job with a 5–500 character reason.      |
| Waste map (`/admin/map`)                | Private operational markers for requests with valid coordinates. Use All requests for records with none.                               |
| Analytics (`/admin/analytics`)          | Completion rate, category/ward counts, 14-day UTC submission activity and self-reported segregation count.                             |

### Assign a collector

Open the Pending request, select a collector, click **Assign collector**, then **Confirm assignment**. The status becomes Assigned and the collector gains job access. You must check real availability, transport and waste-specific handling arrangements yourself. Reassignment replaces the old active assignment and revokes that collector's request access unless another qualifying assignment exists. Once work is In Progress, reassignment is locked.

Statistics derive from stored records, not live municipal feeds. Completion excludes Cancelled/Rejected records from its denominator. Category and ward charts count requests, not kilograms or residents. **Segregated pickup requests** counts confirmed pickup requests, not distinct households. See [calculation details](ARCHITECTURE.md#statistics-and-map-behavior).

## Shared pages and access

- **Profile** (`/profile`): edit name (2–80 characters), phone (7–20 digits/spaces/parentheses/hyphens, optional leading `+`, at least seven digits) and ward. Role cannot be edited here.
- **About** (`/about`): assigned scenario and human-values explanation; available publicly too.
- **Sign in / signup**: demo shows instant synthetic-role entry, not account creation. Connected mode offers email/password and resident-only signup. No password recovery or OTP UI exists.
- **Sign out** ends the selected identity; it does not erase demo requests. Mobile users can reach shared account links through Profile.

Loading, no-results and workspace-error states are deliberate. If persistence fails, do not assume a successful collection from a clicked button: inspect the error and stored status. Confirmed reset replaces demo data irreversibly; [Troubleshooting](TROUBLESHOOTING.md) explains recovery options.

## Complete expected journey

Resident submits → Pending → administrator assigns → Assigned → assigned collector starts → In Progress → collector confirms and records destination → Collected → resident timeline and dashboard update. A separate dumping report can follow this lifecycle but is still labeled as dumping throughout. **Collected never means independently verified recycling/treatment.**
