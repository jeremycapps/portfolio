---
title: "Production RAG, Personal Corpus"
slug: production-rag-personal-corpus
date: 2026-09-28
summary: "The chatbot on this site is not a demo. It is a production-grade retrieval-augmented agent — grounded answers, abstention, a review-gated evidence pipeline, versioned claims. The engineering is what an enterprise deploys on its own data. The only difference is the corpus: I built it on the one I have complete access to and authority over — my own work logs."
kind: article
status: "System note · September 2026"
---

## The claim

The assistant on this site is a product, not a demo. It is a production-grade
retrieval-augmented generation (RAG) agent, built to the reliability bar a company
would require before letting a model answer on its behalf: every answer is grounded
in retrieved, source-backed claims; it abstains when the corpus does not cover the
question instead of inventing; claims are versioned, so a superseded position is kept
as history and never presented as current; and the material it draws on passes a
review-gated pipeline, not a model's unconstrained say-so.

That is the same system you would deploy inside an enterprise. The difference — the
only meaningful one — is the data it runs on.

## Why it runs on me

An enterprise RAG agent is trained on enterprise data: the tickets, docs, decisions,
and threads a company accumulates. I can't get my hands on that data — it belongs to
companies I don't work for yet. So I built the agent on the one corpus I have complete
access to and authority over: **my own work logs.** Years of AI-assisted
sessions — the decisions, the dead ends, the systems I designed — extracted into an
evidence corpus the chatbot answers from.

Swap the corpus and the system is unchanged. The retrieval, the grounding, the
abstention, the versioning, the gate — none of it cares whether the source is a
company's Confluence or my own transcripts. The corpus is a detail. The engineering
is the thing that transfers, and the engineering is what I'm showing you.

## What "production-grade" means here

The failure mode of a naive RAG system is that the model rewrites facts on the way
out — it regenerates freely and reintroduces things the sources never said. The
reliability pattern that production guidance converges on is to **separate finding the
material from stating the fact**: let the model locate what's relevant, but let
deterministic code state the claim, retrieved by identifier from a reviewed source and
never re-written. This site's pipeline is built on that split, end to end:

- **Grounding by source.** Answers are assembled from retrieved claims, each tied back
  to where it came from. The model writes prose over evidence; it does not supply the
  evidence.
- **Abstention.** When retrieval returns nothing, the agent says the logs don't cover
  it. A grounded "I don't know" beats a confident fabrication.
- **A review-gated evidence pipeline.** Claims are extracted from my logs by a model,
  then pass a gate — most auto-publish, a random sample is audited, and anything
  sensitive is held back. The gate turns "it might leak" into a *measured* miss rate.
- **Versioning.** Claims carry supersession links, so "what I think now" and "what I
  thought earlier" stay distinct. The current position always travels next to what it
  replaced.
- **Load-bearing questions answered deterministically.** The questions a recruiter
  actually asks — what I'm working on, what roles I want — resolve to hand-authored,
  source-backed cards, not model guesses, with grounded prose as the fallback.

None of this is exotic. It's the boring, load-bearing engineering that separates a RAG
demo from a RAG system you'd let answer for you.

## The point

Most portfolios *describe* the thing the candidate can build. This one *is* the thing.
I didn't write a case study about production RAG; I shipped a production RAG agent and
pointed it at myself, because that was the data I could reach. If you want to know
whether I can build a grounded, abstaining, review-gated retrieval system for your
data, the fastest answer is to interrogate the one running on mine.

[Ask the assistant.](/ask)
