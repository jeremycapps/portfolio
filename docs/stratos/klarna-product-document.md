# Klarna AI Support — Product Document

**Written as of the decision point: early 2024, immediately after the first-month results.**
Only evidence public at that date is used below. What became known afterwards is confined
to the closing section and is marked. It checks the read; it is not an input to it.

**The decision on the table:** the assistant is handling two-thirds of support chats in its
first month. Do we widen its mandate — route more of the complex queue to it — while human
support capacity continues to shrink?

---

# 📆 Basic Gantt

| **Phase** | **Name** | **Time Box** | **Start – Due Dates / Notes** |
| --- | --- | --- | --- |
| 1 | Understand the Problem | 1–2 weeks | Separate what the launch metrics establish from what the next commitment depends on; locate the escalation dependency; name the grain at which quality is unmeasured. |
| 2 | Define the Smallest Bet | 1 week | The bet is not more automation. It is the measurement that would let us authorize more automation. |
| 3 | Build, Test, and Learn | 2–4 weeks / cycle | Instrument the complex segment before widening the mandate. One hypothesis per cycle. |
| 4 | Launch, Watch, and Decide | 60 days after instrumentation lands | Run the narrowed scope on live traffic; decide the next increment against thresholds set in advance. |

---

# 🔍 Phase 1 — Understand the Problem

## Step 1: Initial Brainstorm(s)

### Problem Notes

- **The reported metrics are real, and they answer a different question than the one being asked.**
    - Two-thirds of chats handled, 2.3M conversations, resolution time 11 min → 2 min, 23 markets,
      aggregate satisfaction reported on par with human agents, $40M projected profit improvement.
    - Every one of those measures **throughput and cost**. None measures **outcome on the cases
      where a wrong answer is expensive**.
    - The decision is not "is the assistant working?" It is "is it safe to give it more, and to
      keep removing the people it hands work to?" Nothing above speaks to the second half.
- **The automation is L1-tier by design.**
    - Anything the assistant cannot resolve transfers to a person. This is not a defect; it is the
      intended architecture.
    - It means the assistant's success and the human queue's load are **coupled**. Deflecting the
      simple two-thirds concentrates the remaining third — the judgment-heavy, high-severity
      third — onto human capacity.
- **The two moves are being decided together, and they point opposite ways.**
    - Move A: widen the assistant's mandate. Move B: continue reducing human support capacity.
    - Each is defensible alone. Together they increase the load on the exception path while
      reducing the capacity that serves it.
- **Queueing parallel**
    - Deflection reduces arrivals on the easy queue. It does nothing for the hard queue except
      remove servers from it.
    - Utilization (ρ) is the variable that matters, and waiting time does not degrade linearly —
      it goes vertical as ρ approaches 1. A hard queue at 70% utilization and the same queue at
      94% are not "somewhat different." They are different systems.
    - Average resolution time across both queues will keep looking excellent while this happens,
      because the easy queue dominates the volume.
- **The aggregate is doing the hiding.**
    - "Satisfaction on par with human agents" is a blended number across all contact types.
    - The segments that carry the downside — fraud, disputes, hardship, account closure — are a
      small share of volume and a large share of consequence. They cannot move a blended average
      enough to be visible in it.
    - This is a **measurement-grain** problem, not an AI-quality problem. We do not know that
      quality is bad. We know we have not measured it where it matters.

## Step 2: Assumptions Mapping

#### Guidance

- High Importance (viability of the next increment) <> Low Importance
- High evidence (observed in live operation) <> Low evidence
    - HI - HE: Core constraints that should shape the decision now.
    - HI - LE: Critical assumptions to test before authorizing anything.
    - LI - HE: Known conveniences that can wait.
    - LI - LE: Defer.

#### Assumptions Template

| **Assumption Category** | **Description** | **Rating System** |
| --- | --- | --- |
| Desirability | Do customers in high-severity situations accept an AI-first path, or does it cost us trust exactly where trust is dearest? | Importance, Evidence Axis |
| Viability | Do the projected savings survive the cost of remediation and capacity rebuild if complex-case quality is worse than assumed? | Importance, Evidence Axis |
| Feasibility | Can the exception path absorb a larger complex share at reduced headcount? | Importance, Evidence Axis |
| Adaptability | If we are wrong, can we reverse — is there capacity and institutional knowledge left to reverse into? | Importance, Evidence Axis |

#### Actual

- **Aggregate satisfaction is a valid proxy for complex-case quality.**
  *(Viability; Importance: High; Evidence: Low)*
  Test: split satisfaction and resolution outcome by contact driver. If complex-segment quality
  tracks the blend, the proxy holds. This is the single assumption the whole commitment rests on
  and it currently has no evidence either way.
- **The exception path has slack to absorb a larger complex share.**
  *(Feasibility; Importance: High; Evidence: Low)*
  Test: measure utilization and backlog age on the human queue, by segment, before the increment.
- **Reducing capacity is reversible if we are wrong.**
  *(Adaptability; Importance: High; Evidence: Low)*
  Test: what is the rehire-and-retrain lead time for a disputes or hardship specialist? If it is
  months, the capacity decision is far less reversible than the automation decision, and the two
  should not be authorized together.
- **Customers in high-severity situations are as well served as the average.**
  *(Desirability; Importance: High; Evidence: Low)*
  Test: outcome and complaint rate on fraud, disputes, hardship, and account closure specifically.
- **Deflection rate is a good health metric for the system as a whole.**
  *(Viability; Importance: Medium; Evidence: Medium)*
  Test: it is not — it measures the assistant, not the system the assistant sits in. Backlog age
  on the receiving queue is the health metric, and it is currently unreported.

**Everything load-bearing is High Importance / Low Evidence.** That is the finding of this phase.

## Step 3: JTBD Interviews

#### Guidance

- Focus on the job of resolving a consequential problem, not the job of using a chat interface.
- Do not ask whether customers like the assistant. Ask what happens to someone whose problem the
  assistant could not solve.
- Interview the receiving humans, not only the sponsors.

#### Template

| **Situation** | **Job to be done** | **Success criterion** |
| --- | --- | --- |
| (Fill) | (Fill) | (Fill) |
| (Fill) | (Fill) | (Fill) |
| (Fill) | (Fill) | (Fill) |

#### Actual (hypotheses)

- **Customer with a routine question** (balance, order status, returns): Get an accurate answer
  without waiting → Answered in one exchange, no follow-up needed. *The assistant is already
  winning this job decisively; this is the two-thirds.*
- **Customer in a dispute, fraud, or hardship situation**: Reach someone who can actually decide,
  and be believed → Case resolved correctly, once, without having to re-explain. *Speed is not
  the success criterion here. Correctness and being heard are. An assistant that is fast and
  wrong is worse than a queue.*
- **Support specialist receiving escalations**: Handle a caseload that is now uniformly hard,
  with fewer colleagues → Close cases correctly without the backlog growing. *This population's
  work got harder and its headcount got smaller in the same quarter. Nobody is measuring what
  that did.*
- **Executive sponsor**: Decide whether to widen the mandate → Authorize an increment that will
  not have to be reversed. *Currently being served a dashboard that cannot answer this.*
- **The assistant itself**: Resolve or hand off → Hand off with enough context that the human
  does not restart. *Handoff quality is unmeasured and is the seam where the two systems meet.*

## Step 4: Assumptions > JTBD Synthesis

#### Actual

- The assistant is genuinely excellent at the job the volume is made of, and that is not in question.
- The commitment under discussion is not about that job. It is about the small-volume,
  high-consequence job — and about the people who do it.
- **The binding constraint is human exception capacity, not model quality.** The model can be
  perfect and this commitment can still fail, because the failure mode is a starved queue rather
  than a wrong answer.
- The two decisions on the table have very different reversibility. Widening the assistant's
  mandate can be rolled back in a release. Losing specialist staff cannot. **Decisions with
  different reversibility should not be authorized in the same motion.**
- Nothing above requires believing the AI programme is a mistake. It requires believing the
  evidence does not yet reach the grain the decision depends on.

## Step 5: Problem Statement

#### Actual

- Klarna is deciding whether to widen an AI assistant's mandate and continue reducing human
  support capacity, on evidence that measures throughput and cost across all contact types but
  measures outcome for none of them separately.
- The organisation currently answers this with a deflection-and-satisfaction dashboard, aggregate
  CSAT, and a projected savings figure — all of which are real, and none of which can distinguish
  a system that is working from a system whose failures are concentrated in a segment too small
  to move a blended average.
- Existing reporting fails because it measures the assistant rather than the system the assistant
  sits inside: it has no line for quality by contact driver, no line for how long escalated cases
  wait, and no line for utilization on the human capacity that receives every case the assistant
  cannot close.

---

# 📐 Phase 2 — Define the Smallest Bet

## Step 1: Minimum Lovable Product

#### Guidance

- The instinct here is to bet on more automation. That is the wrong bet: it is the expensive,
  least-reversible move and we have no evidence to size it.
- **The smallest bet is the measurement that would let us authorize the automation.** It is cheap,
  it is fast, and it is the thing standing between a guess and a decision.
- Lovable, for an executive team, means: the next scaling decision stops being an argument.

#### 1-Page Brief (filled)

- **Problem Statement**: Leadership cannot tell whether the assistant is safe to widen, because
  quality is reported at a grain that cannot show failure where failure is expensive.
- **North Star Metric**: **Resolution quality on high-severity contact drivers** — fraud,
  disputes, hardship, account closure — reported separately from the blend, alongside backlog age
  on the queue that receives them. When these two numbers exist and hold, the next increment is
  authorizable. Until they exist, it is not.
- **User Journey**
    - A contact arrives and is classified by driver, not just by channel.
    - The assistant resolves it, or transfers it — and the transfer is recorded as an event with
      a timestamp and a reason.
    - The receiving human queue is instrumented: depth, age, and utilization by segment.
    - Outcome is recorded per segment: resolved, reopened, escalated further, complained.
    - A weekly view shows quality and backlog **by driver**, against a floor set in advance.
    - Any breach of the floor triggers a named owner, not a discussion.
- **MLP**: Segment-level outcome reporting for the four high-severity contact drivers, plus
  instrumentation of the escalated queue (age, depth, utilization), plus a declared capacity floor
  with a rollback rule attached. No new automation, no new model work, no dashboard programme.
  The mandate stays where it is — at the scale already demonstrated — while this is built.
- **Assumptions**
    - If quality by segment is visible, the scaling decision becomes routine rather than contested.
    - If backlog age is visible, capacity reduction becomes a decision with a number attached
      rather than a target inherited from a plan.
    - If a floor and a rollback rule exist before launch, we can move faster afterwards, not slower.
- **Fit Signal**
    - Leadership can answer: what is our resolution quality on disputes, specifically?
    - Leadership can answer: how long is a hardship case waiting after transfer?
    - Leadership can answer: what utilization is the exception queue running at?
    - Leadership can answer: at what number do we stop, and who calls it?
    - A specialist can answer: is my queue getting worse, and can I show it?
    - The next increment can be authorized or declined **without anyone re-litigating the first one**.

---

# 🎨 Phase 3 — Build, Test, and Learn

#### Guidance

- One hypothesis per cycle.
- Every cycle has to produce a number that did not exist before it.
- Nothing here widens the assistant's mandate. That is the decision these cycles are for.

#### Cycles

| **Cycle** | **Hypothesis** | **Build** | **Learn** |
| --- | --- | --- | --- |
| 1 | Contacts can be reliably classified by driver, not just channel. | Contact-driver taxonomy + classification on live traffic; hand-label a sample to measure classifier accuracy. | Whether we can even ask segment-level questions. Everything downstream depends on this. |
| 2 | Quality differs by segment. | Split satisfaction, reopen rate, and resolution outcome by driver. | Whether the blended number was hiding anything. A null result here is a real and valuable answer. |
| 3 | The escalated queue has a health signal. | Instrument depth, age, and utilization on the human queue, by segment. | Whether the exception path has slack — the feasibility assumption, tested directly. |
| 4 | Handoff quality is measurable. | Record transfer events with reason and context payload; measure re-explanation rate after transfer. | Whether the seam between the two systems is losing information. |
| 5 | A floor can be set that people will actually act on. | Declare a capacity floor and a backlog-age ceiling; wire an alert to a named owner; run one deliberate drill. | Whether the control is real or decorative. An untested floor is not a control. |

#### Actual (planned)

- Cycle 1: Driver classification → validate we can segment at all.
- Cycle 2: Segment quality → test the load-bearing assumption from Phase 1.
- Cycle 3: Queue health → test feasibility of absorbing more.
- Cycle 4: Handoff integrity → test the coupling point between assistant and specialist.
- Cycle 5: Floor + rollback drill → test that the control fires.

---

# 🧩 Phase 4 — Launch, Watch, and Decide

#### Note

This is not a launch of new capability. It is a controlled run of the **existing** capability at
its **current** scope, with the instrumentation from Phase 3 live, for long enough to produce a
trend rather than a snapshot.

#### Plan

- **Launch shape**: Hold the mandate at the demonstrated scope. Hold capacity reduction on the
  specialist segments. Run 60 days — two consecutive 30-day operating cycles — with segment
  quality, backlog age, and capacity utilization all observed.
- **Candidate first segments**
    - Disputes (highest volume of the high-severity set).
    - Fraud (highest consequence).
    - Hardship (highest reputational and regulatory exposure).
    - Account closure (clearest irreversibility).
- **Watch**
    - Does resolution quality on each high-severity driver hold against the blended number?
    - Is backlog age on the escalated queue stable, improving, or growing?
    - What utilization is the exception queue actually running at, and what is the trend?
    - Are transferred cases being re-explained by customers?
    - Do complaints or regulatory contacts concentrate in any one driver?
    - Does the capacity floor hold without heroics?
- **Decide**
    - **Widen the mandate** only into drivers where segment quality is observed and holding, and
      only by an increment the measured queue slack can absorb.
    - **Resume capacity reduction** only where the floor has held across both cycles, and never on
      a segment whose quality line is still missing.
    - **Reverse** on a breach of the declared floor — the rule is set now, in advance, precisely so
      it is not renegotiated under pressure later.
    - **Do not** treat the absence of complaints as evidence of quality. Silence in a segment we
      are not measuring is not a signal.
    - Re-run the savings case at the end against realized figures, net of remediation and any
      capacity rebuild. A projection is not an outcome.

#### The recommendation this produces

**Hold the next scope increment — not the AI programme.** The assistant continues at its
demonstrated scope and continues to be a genuine success at the job the volume is made of. What is
held is the *increment*: more of the complex queue, and further reduction of the people who receive
it. The hold has an explicit expiry — the two operating cycles above — and an explicit exit: the
segment-quality and queue-health numbers that do not exist yet.

**Binding constraint:** human exception capacity.
**Where this should be fixed:** the business case, before commitment — not operations, after launch.

---

## Source discipline

Everything above is reasoned from what was public at the decision date:

| Used | Source | Status |
| --- | --- | --- |
| 2.3M conversations, two-thirds of chats, 11 → 2 min, 23 markets | Klarna press release, 2024-02-27 | OBSERVED (company-reported) |
| $40M projected profit improvement, CSAT "on par", repeat inquiries −25% | Klarna press release, 2024-02-27 | ESTIMATED — projected and unsegmented |
| Automation is L1-tier; complex cases always transfer | The Pragmatic Engineer, 2024-02-29 | OBSERVED — independent, contemporaneous |
| Complex-segment quality, high-severity outcomes, escalated backlog age | — | **UNKNOWN.** Not measured, not reported |

**Deliberately excluded:** the specific headcount figures (5,000 → 3,800, target 2,000) come from
2025 reporting and cannot inform a decision dated early 2024. The outsourcing of ~750 support roles
in Sep–Oct 2023 and the backlog growth that reportedly followed would strengthen this document
considerably — that evidence predates the launch, and would move "the exception path has slack"
from *untested* to *contradicted*. **It is left out pending verification of its publication date.**
If the reporting postdates February 2024 it cannot be used here, and the discipline of this document
matters more than the strength of any single point in it.

---

## What happened afterwards

> **HINDSIGHT · 2025.** This section is a check on the read above. It is not an input to it.

In 2025 Klarna's CEO said cost had become too predominant in the support strategy and that lower
quality followed. The company began rebuilding a route back to human agents — for the disputes,
fraud, and hardship cases this document identifies as the unmeasured segment.

The test is not whether this document predicted a headline. It is whether the missing evidence and
the binding constraint were identifiable **before** the exposure grew. They were: every gap named
in Phase 1 is visible in the February 2024 material, and every one of them is a measurement that
could have been built in a matter of weeks.
