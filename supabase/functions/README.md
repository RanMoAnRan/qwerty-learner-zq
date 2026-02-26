# Edge Functions Scaffold

Recommended functions to add next:

1. `wechat-payment`
2. `wechat-payment-status`
3. `wechat-auto-subscription-session`
4. `wechat-auto-subscription-jsapi`
5. `alipay-payment`
6. `user-info-update`
7. `create-share-token`
8. `redeem-share-token`

## Implementation rules

- Verify signatures for all payment callbacks.
- Use idempotency by unique transaction keys.
- Update `orders` and `subscriptions` in one transaction.
- Keep raw callback payload in `payment_events` for audit.
