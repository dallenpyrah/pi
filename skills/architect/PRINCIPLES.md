# Architecture Principle Spine

Walked during the `/architect` derivation. A violation is allowed only when it is named as an explicit, justified trade-off.

## First principles

1. **Start from invariants.** Not frameworks, files, classes, or user-suggested solution shapes.
2. **Separate facts from assumptions.** Label what is grounded, inferred, unknown, intentionally deferred.
3. **Identify irreducible constraints.** Time, performance, compatibility, migration, security, external API semantics, and existing code shape are not preferences.
4. **Name primitive concepts.** If the problem cannot be explained without implementation jargon, the model is not understood.
5. **Derive before choosing.** Do not choose a pattern until the problem demands it.

## Game-theoretic design

6. **Design the mechanism, not just the module.** The architecture shapes future behavior.
7. **Make the good move the easy move.** APIs, types, tests, and boundaries guide implementers toward correct use.
8. **Make the bad move impossible or loud.** Misuse fails at compile, construction, validation, or review time.
9. **Account for players.** Callers, maintainers, reviewers, users, attackers, external services, CI, future implementers.
10. **Account for incentives.** Name what each player is tempted to do and how the design changes that payoff.
11. **Handle information asymmetry.** Expose the information needed for correct decisions; hide only implementation details.
12. **Avoid bad equilibria.** Reject designs where locally convenient changes accumulate into global coupling.
13. **Repeated-game durability.** Optimize for the 20th future change, not the first implementation.
14. **Principal-agent safety.** When one component acts on behalf of another, define authority, observability, accountability.
15. **Adversarial thinking.** Attackers, malformed inputs, flaky dependencies, retries, future misuse are strategic players.

## Simplicity

16. **Minimal code.** Fewest concepts, modules, branches, moving parts that satisfy the real constraints.
17. **KISS.** Choose the simplest design that can be explained directly.
18. **YAGNI.** No extension points, abstractions, options, or generality for hypothetical futures.
19. **Avoid premature abstraction.** Duplication is cheaper than a false abstraction until the repeated thing has real shared meaning.
20. **Complexity is a budget.** Every abstraction earns its keep by hiding real complexity, protecting invariants, creating a stable seam, or changing bad incentives.

## Modularity and boundaries

21. **Deep modules over shallow modules.** Narrow interface, powerful implementation. A wrapper that just forwards gets deleted.
22. **Information hiding.** A module hides a volatile decision, algorithm, policy, representation, protocol, or dependency.
23. **Encapsulation.** Callers do not know internal representation, construction details, lifecycle details, dependency wiring.
24. **Clear interfaces.** Small, explicit, typed, intention-revealing, hard to misuse.
25. **High cohesion.** Things that change together live together.
26. **Low coupling.** Minimize cross-module knowledge. Unrelated changes do not ripple.
27. **Separation of concerns.** Keep domain, transport, persistence, rendering, configuration, orchestration, validation, side effects separate unless a deliberate trade-off says otherwise.
28. **Don't complect.** Do not braid concepts that vary independently — state with value, transport with logic, query with storage, UI with policy, persistence with validation, configuration with behavior.
29. **Single Responsibility.** Gather things that change for the same reason. Separate things that change for different reasons.
30. **Orthogonality.** A change in one concern does not require edits in unrelated concerns.
31. **Law of Demeter.** No reaching through chains of objects/modules to depend on internals.
32. **Bounded contexts when the domain warrants it.** Same term meaning different things in different parts of the domain → split the model and name the boundary.
33. **Ubiquitous language.** Names come from the domain and the real concept, not framework mechanics.
34. **Name what it is, not what wraps it.** `Cache` beats `CacheManager`. `User` beats `UserEntity`. `WorkflowState` beats `WorkflowStateHelper`.

## Composition and extensibility

35. **Composition over inheritance.** Reuse behavior by composing capabilities.
36. **Inheritance only for true subtypes.** `extends` is valid only when every child preserves the parent contract and invariants.
37. **Liskov Substitution.** Callers use a subtype without changing correctness.
38. **Program to contracts.** Depend on stable interfaces, schemas, ports, capabilities rather than concrete details.
39. **Interface Segregation.** Callers do not depend on methods, fields, dependencies, or capabilities they do not use.
40. **Dependency Inversion.** High-level policy owns the abstraction. Low-level details implement it.
41. **Open/Closed with restraint.** Stable seams for known variation. No speculative extension mechanisms.
42. **Extensibility through deep modules.** Stable contracts and explicit seams — not generic managers, plugin fantasies, or broad option bags.

## Dependency direction and I/O

43. **Dependency rule.** Source dependencies point inward toward policy/domain logic, not outward toward frameworks, transports, databases, or vendors.
44. **Ports and adapters for I/O.** Domain/application logic owns the port. Filesystem, network, database, queue, clock, randomness, third-party APIs are adapters.
45. **Layer discipline.** UI has no business logic. Domain has no UI or infrastructure dependency. Infrastructure does not define domain policy.
46. **No circular dependencies.** Cycles are design smells. Break them with a deeper module, a port, or a clearer boundary.
47. **Local substitutability.** Anything hard to test because it touches the world needs a port, fake, test adapter, or pure core seam.

## Functional architecture

48. **Functional core, imperative shell.** Business decisions in pure functions; I/O, mutation, orchestration, retries, logging, process lifecycle at the shell.
49. **Push state to the edges.** Core stays pure or as close as the language allows.
50. **Immutability by default.** Localized mutation only when faster, clearer, and contained.
51. **Referential transparency for core transforms.** Same input → same output.
52. **Data over behavior at boundaries.** Plain data crosses module/process boundaries cleanly.
53. **Single source of truth / DRY.** Each piece of knowledge has one authoritative representation. DRY is about knowledge, not duplicate-looking text.

## State, invariants, and lifecycle

54. **Make invalid states unrepresentable.** Types, schemas, branded values, discriminated unions, constructors.
55. **State machines for lifecycle.** Explicit states and transitions. No ad-hoc booleans, nullable fields, or string soup.
56. **State machines only where they earn it.** For lifecycle, yes. For simple control flow, no.
57. **Exhaustive handling.** Variants, states, tagged errors handled exhaustively where the language allows.
58. **Domain invariants at boundaries.** Validate and protect at module/domain boundaries; do not scatter checks.
59. **Transaction boundaries follow invariants.** Scope by consistency requirements, not convenience.
60. **Consistency strategy explicit.** State whether strong consistency, eventual consistency, idempotent reconciliation, or compensating action is required.

## Effects, errors, and recovery

61. **Effect-first for effectful paths.** In Effect-owned code, use Effect primitives.
62. **Use Effect primitives when using Effect.** `Effect`, `Layer`, `Context`, `Schema`, `Config`, `Cause`, `Schedule`, `Ref`, `Queue`, `Deferred`, `Scope`, typed service tags.
63. **Plain TypeScript is fine for pure code.** No Effect ceremony required for pure transforms, constants, type utilities, or thin interop.
64. **Typed errors.** Failures in the type/error channel, not nullable returns, broad exceptions, boolean flags, or generic strings.
65. **NO SILENT FALLBACKS.** No hidden defaults, catch-and-continue, best-effort substitution, implicit retries, or fallback providers that mask failure.
66. **Only explicit typed recovery.** Modeled, typed, observable, tested, and part of the product behavior.
67. **Idempotency for side-effecting commands.** If a command can be retried, replayed, duplicated, or externally triggered, define duplicate handling.
68. **Failure modes are architecture.** Name what can fail, how, who observes it, what recovery or non-recovery means.

## Quality attributes

69. **Performance budget explicit.** Critical paths state expected complexity, latency, memory, throughput, batching, caching, or concurrency constraints.
70. **Reliability explicit.** Failure model, retry policy, timeout policy, cancellation behavior, partial-failure behavior.
71. **Security / least privilege.** Interfaces expose only the data and authority they need.
72. **Observability.** Important production paths expose useful logs, traces, metrics, events, or audit records.
73. **Testability.** Explain how the core, ports, adapters, state transitions, error paths, and performance-sensitive paths are tested.
74. **Migration safety.** If existing behavior changes, name the migration path, compatibility risks, rollback strategy.
75. **Clear non-goals.** State what the architecture intentionally does not solve.
