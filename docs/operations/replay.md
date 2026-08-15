# Simulation Replay

Replays are executed by reloading a `TopologySnapshot` and the stream of `ControlEvent`s scoped to the original `ScenarioId`.

Since operations are purely deterministic and random number generation is seeded, re-running a scenario with the same `randomSeed` without controller interference will produce a 1:1 match of the historical `TrainRun` lifecycle.