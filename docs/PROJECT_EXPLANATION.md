# Explaining EcoSort to a faculty evaluator

This guide gives every teammate an accurate, plain-language explanation. For a live walkthrough use [DEMO_SCRIPT.md](../DEMO_SCRIPT.md); for the academic rationale use [UHV_EXPLANATION.md](../UHV_EXPLANATION.md).

## The problem and proposed response

**Waste Management — Group 2:** “Garbage dumped in open areas without segregation or collection systems (Vellangallur).”

The assigned scenario describes households disposing of mixed organic, plastic and other waste in open plots/roadsides because separation and collection coordination are missing. **That is the project brief, not independently verified information about actual Vellangallur services.** EcoSort is a proposed community-based coordination system, not a claim that a real municipal service is operating.

Segregation alone is insufficient: separated bags can still accumulate if nobody collects them. Reporting alone is also insufficient: a complaint does not move waste. A complete response needs household habits, a way to request help, a responsible worker, and a record of what happened next.

EcoSort models this chain:

**Separate → request → assign → collect → record destination → show completion.**

## Who does what?

- **Resident:** reads manual separation guidance, submits a household pickup with location/quantity and explicit segregation confirmation, or separately reports existing dumping. Follows the request history.
- **Panchayat Administrator:** reviews the request, selects a collector, checks arrangements outside the software and monitors unfinished/collected work. Can reject a request with a reason.
- **Collector:** sees assigned jobs, starts work, then explicitly confirms physical collection and records an intended destination or actual handover. A photo is optional, not automatic proof.

The resident sees updated completion and the administrator sees derived statistics. These are different responsibilities over shared records, not three unrelated apps.

## What the demonstration simulates

Instant role entry chooses fictional people instead of authenticating real users. Requests, assignments and confirmations change real application state, but the described physical collection is a classroom simulation. Photos, names and locations must remain synthetic. Browser storage preserves the demo in the same browser/origin; it does not connect separate devices.

Optional Supabase-connected code supports real accounts, PostgreSQL storage, role-scoped access and private images. Its hosted Auth/Storage and cross-device workflow have not yet been verified with credentials. Embedded database tests and local browser tests do not erase that limitation.

## Questions and short answers

### Why did you build EcoSort?

To connect responsible separation with collection coordination and an accountable record, rather than stopping at a complaint about visible waste.

### How is it different from a complaint app?

The main journey starts with a household pickup and continues through assignment, collector confirmation and destination recording. Existing dumping has its own reporting form.

### What happens after a resident submits a request?

It becomes Pending. An administrator reviews and assigns it; the assigned collector starts it, then records collection and destination. Submission is not a guaranteed appointment.

### Who assigns collection workers?

A provisioned Panchayat Administrator. The software checks the collector role but does not independently check availability, equipment or qualifications; a real operator must do that.

### How do you prevent false collection claims?

Only the assigned collector can confirm an in-progress job, with explicit confirmation, timestamp, destination and optional evidence. History makes the actor/action traceable. These controls reduce unauthorized changes, **not dishonesty by an authorized person**. Independent physical verification is not implemented.

### Why three roles?

Residents request and track, administrators coordinate, and collectors report work done. Separate permissions make responsibility clear and limit access to private records.

### Where is information stored?

Demo uses the browser's localStorage. Connected mode uses Supabase PostgreSQL and private Storage for images; Supabase Auth manages identity. Connected login tokens stay in memory and reload requires signing in again.

### What happens if the internet is unavailable?

After dependencies are installed, the locally served demo and offline coordinate map still work. Keep the local server running. Online streets/navigation and connected Supabase need internet. It is not an offline-installed PWA or a connected offline-sync solution.

### Is it actually deployed in Vellangallur?

No deployment or municipal partnership is verified. Vellangallur is the assigned scenario. The deliverable is a local demonstration and optional connected implementation requiring further integration testing and operational arrangements.

### Does Collected mean recycled?

No. It means a collector recorded physical collection. An intended destination is not handover; collector-reported handover is not independently verified recycling or treatment.

### Does it use AI to recognize waste?

No. Category choice is manual and the segregation guide is editable educational content. No inference, prediction or automatic classification is implemented.

### Are the dashboard numbers live public statistics?

No. They are calculations over the records visible in the current workspace. Demo records are fictional; charts count requests, not actual waste mass, environmental impact or distinct households.

### How does this connect to human values?

**Responsibility:** separate waste and report truthfully. **Cooperation:** coordinate households, workers and administrators. **Participation:** give residents practical actions and visibility. **Harmony with nature:** support careful separation and appropriate handling without inventing environmental outcomes.

### What would actual deployment require?

Local consultation and accepted-material rules; trained collectors, safe transport and authorized destinations; trusted account provisioning; hosted security/integration tests; privacy, retention, backups and correction procedures. Software supports those agreements; it cannot create them.

## One-minute explanation

“Our assigned problem is mixed waste dumped without a coordinated collection chain. EcoSort begins at the household: learn segregation and request a pickup. An administrator assigns a collector, who starts the job and explicitly records collection and destination. The resident can follow that history, and the Panchayat workspace shows operational totals. Existing dumping can also be reported separately. Our demo uses fictional records stored in the browser; it does not claim a real municipal partnership or verified recycling. The human-values focus is responsible action and cooperation, supported by technology rather than replaced by it.”
