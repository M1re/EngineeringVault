---
title: Idempotency
tags:
  - architecture
  - reliability
  - api-design
draft: false
created: 2026-07-08
---

# Idempotency

> [!summary] In one sentence
> An operation is **idempotent** if performing it many times has the same effect as performing it once — which is what makes safe retries possible in an unreliable network.

## Why it matters

In any distributed system, a caller can never be sure whether a request that timed out actually *failed* or merely *lost its response on the way back*. The only safe reaction to uncertainty is to **retry** — but blind retries on a non-idempotent operation (e.g. "charge the card") cause double charges, duplicate orders, and corrupted state.

Idempotency turns "retry" from a dangerous act into a safe default. It is the quiet foundation under payment systems, message queues (at-least-once delivery), and every well-designed API.

## How it works

There are two common flavours:

**1. Naturally idempotent operations.**
Some operations are idempotent by definition:
- `PUT /users/42 { name: "Ann" }` — setting a value to `X` twice leaves it `X`.
- `DELETE /users/42` — deleting an already-deleted resource is still "gone".
- HTTP semantics classify `GET`, `PUT`, `DELETE` as idempotent; `POST` is not.

**2. Made idempotent with an idempotency key.**
For operations that aren't naturally safe (`POST /charges`), the client generates a unique **idempotency key** and sends it with the request:

```http
POST /charges
Idempotency-Key: 3a1c9f4e-...   # same key on every retry of THIS charge
{ "amount": 5000, "currency": "usd" }
```

The server:
1. Looks up the key in a store (with a uniqueness constraint).
2. **First time:** executes the operation, saves `(key → response)`.
3. **Retry:** finds the key, returns the *stored* response without re-executing.

The uniqueness constraint (often a `UNIQUE` index in the database) is what makes this race-safe under concurrent retries.

## Trade-offs & pitfalls

- **The key store needs a TTL.** You can't remember every key forever. Too short and a late retry re-executes; too long and the store grows unbounded. Hours-to-days is typical.
- **Atomicity of "execute + record".** If you perform the side effect but crash before saving the key, the next retry re-executes. Wrap them in one transaction, or make the side effect itself deduplicated downstream.
- **Idempotency ≠ concurrency control.** Two *different* keys hitting the same resource still race. Idempotency dedupes retries of the *same* logical request, not conflicting requests.
- **Response mismatch.** If inputs differ but the key is reused, decide whether to reject (safer) or ignore the new body. Stripe rejects with a `400`.
- **Distinct from "safe" methods.** A safe method (`GET`) has no side effects at all; an idempotent method may have side effects, just repeatable ones. All safe methods are idempotent, not vice versa.

## Questions to test yourself

- Why is `POST` not idempotent by default, and how would you make a "create order" endpoint safely retryable?
- Where exactly does the idempotency key get checked, and how do you make that check safe under two concurrent retries?
- What happens if the server records the idempotency key but the process dies before the side effect commits? How do you close that gap?
- How does at-least-once delivery in a message queue relate to idempotent consumers?

## Related

- [[Data Persistence/index|Data Persistence]] — the uniqueness constraint that backs idempotency keys lives in the database
- [[Networks/index|Networks]] — timeouts and lost responses are why idempotency is needed at all

## References

- Stripe API docs — *Idempotent Requests*
- *Designing Data-Intensive Applications*, Martin Kleppmann — Ch. 8–9 (unreliable networks, exactly-once)
- RFC 9110 (HTTP Semantics) — §9.2.2 Idempotent Methods
