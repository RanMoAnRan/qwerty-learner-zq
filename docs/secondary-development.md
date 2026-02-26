# Secondary Development Blueprint

## Milestone 1: Productized frontend

- Add account pages: `/login`, `/sign-up`
- Add subscription pages: `/go-premium`, `/payment`, `/payment/result`
- Add sharing landing page: `/share/:resourceType/:token`
- Keep current typing features fully available

## Milestone 2: Backend integration

- Connect Supabase Auth and replace local mock session
- Sync user progress and daily plan to Postgres
- Implement order and subscription lifecycle

## Milestone 3: Payment and share economy

- WeChat and Alipay payment creation
- Webhook verification and idempotent order updates
- Share token generation/redeem with entitlement granting

## Ops checklist

- Add GTM/Mixpanel events for payment funnel
- Add failed-payment monitoring
- Add admin queries for order reconciliation
