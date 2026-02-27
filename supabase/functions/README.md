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

## Alipay payment

Implemented function: `alipay-payment`

### Request actions

- `POST /functions/v1/alipay-payment` body `{ "action": "create", "planCode": "monthly" }`
- `POST /functions/v1/alipay-payment` body `{ "action": "status", "orderNo": "ALI..." }`

### Required secrets

Set these in Supabase Edge Functions secrets:

- `ALIPAY_APP_ID`
- `ALIPAY_PRIVATE_KEY`
- `ALIPAY_GATEWAY` (optional, default: `https://openapi.alipay.com/gateway.do`)

Optional for local testing:

- `ALIPAY_MOCK=true` (create/status will simulate successful payment)
