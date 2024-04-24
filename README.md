# This is not a resource!

This repository shows some example code and, more importantly, necessary events and data when creating a character selection resource for [ox_core](https://github.com/overextended/ox_core).

ox_core has fully integrated multicharacter support but does not implement character selection by default; this code should give some idea of how to make your own.

## Convars

These convars should be replicated with `setr` and set before starting ox_core.

- `ox:characterSlots` can set to any number. It is used to select character data.
- `ox:characterSelect` should be set to `0` to disable the auto character-selection in ox_core. (todo: rename)
