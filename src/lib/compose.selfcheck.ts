// ponytail: tiny sanity check for layout math — run via: npx tsx src/lib/compose.selfcheck.ts
import { LAYOUTS } from '../types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

for (const l of LAYOUTS) {
  assert(l.shots === l.cols * l.rows, `${l.id} shots mismatch`)
  assert(l.shots > 0, `${l.id} empty`)
}
assert(LAYOUTS.map((l) => l.id).join() === '1x1,2x2,2x3,2x4', 'layout set')
console.log('compose.selfcheck ok')
