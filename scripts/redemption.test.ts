import assert from "node:assert/strict";
import { BONUS } from "../lib/config";
import { maxReceiptRedemption, purchaseInputError } from "../lib/redemption";

assert.equal(BONUS.MAX_REDEEM_PERCENT, 20);
for (const [receipt, cap] of [[499, 0], [500, 100], [501, 100], [999, 199], [1000, 200], [500000, 100000]]) {
  assert.equal(maxReceiptRedemption(receipt), cap);
  assert.equal(purchaseInputError(receipt, cap), null);
  assert.notEqual(purchaseInputError(receipt, cap + 1), null);
}
for (const amount of [0, -1, 500.5, NaN, Infinity, 500001, Number.MAX_SAFE_INTEGER]) {
  assert.notEqual(purchaseInputError(amount, 0), null);
  assert.equal(maxReceiptRedemption(amount), 0);
}
for (const spend of [-1, 0.5, NaN, Infinity, 201, 500]) {
  assert.notEqual(purchaseInputError(1000, spend), null);
}
assert.equal(purchaseInputError(1, 0), null);
assert.equal(purchaseInputError(1000, 200), null);
assert.match(purchaseInputError(1000, 201)!, /20%/);
console.log("20% redemption: boundary, rounding, invalid-input tests PASS");
