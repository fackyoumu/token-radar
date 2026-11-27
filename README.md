# launch-radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/fackyoumu/token-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/fackyoumu/token-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Launch Radar ranks protocols that have no token yet by an implied launch value, and gives every one a concrete farm plan. The value model is read off the snapshot itself: each category's multiple is the median market-cap-to-TVL ratio of that category's already-traded protocols in the same snapshot, then adjusted for 7-day TVL growth and for how long the protocol has run with no token. The board covers the whole watchlist plus early finds below it; protocols whose token already trades are shown separately, at the market's own prices. The dashboard is a static page — sortable, filterable, with a detail view and farm plan for every protocol.

## Run it

```sh
node main.ts --input <snapshot.json>
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=7snjr28q&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>

## Notes

`board.json` carries every row's implied value and farm plan; the dashboard's `data.js` is written from the same board by the same run, so the page and the board can never disagree.
