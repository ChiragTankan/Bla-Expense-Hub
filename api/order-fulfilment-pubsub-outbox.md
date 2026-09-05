# Learn-by-doing: Pub/Sub + Outbox with `@gskglobal/nestjs-messaging`

> **Goal.** Build a tiny NestJS app from scratch that uses `@gskglobal/nestjs-messaging` to
> publish a domain event and have **two** independent modules react to it. Then prove — using
> nothing but SQL — that the outbox pattern actually works: messages survive crashes, roll back
> with their transaction, fan out to multiple consumers, and are processed exactly once.
>
> **No UI. No auth. No fancy DTO validation.** Just a handful of HTTP endpoints to _trigger_
> a scenario, and SQL queries to _inspect_ the result.

You are NOT modifying the library. You are a **consumer** of it. Treat
`packages/nestjs-messaging/src` as read-only reference. Everything you build lives in a new app.

---

## 1. What you will learn

By the end you should be able to, without looking at the answer:

1. **Integrate pub/sub** — wire `MessagingModule`, declare an event, publish it from a controller,
   and subscribe to it from two different modules using `@MessageHandler` + `@EndpointQueue`.
2. **Verify the outbox** — read the `outbox_messages` and `inbox_messages` tables and explain, for
   each scenario, _why_ the rows look the way they do.

The single most important idea: **`publish()` does not send anything over the network.** It writes
a row to a database table (`outbox_messages`) **inside your current transaction**. A separate
background dispatcher later reads that table and pushes the message onto BullMQ. That indirection is
the whole point — it makes "save my data" and "tell the world" atomic.

---

## 2. The scenario — Order Fulfilment

```
                                  ┌──────────────────────────────┐
   POST /orders  ──▶ OrdersModule │  order.placed  (event)        │
                   (publisher)    │  written to                   │
   GET  /orders/:id ◀── (reader)  │  orders.outbox_messages       │
                          ▲       └───────────────┬──────────────┘
                          │                       │  OutboxDispatcher
   status flips           │                       │  (polls outbox, fans out)
   PLACED → SHIPPED        │      ┌─────────────────┴───────────────────┐
                          │      ▼                                       ▼
                          │  ┌────────────────────────┐    ┌──────────────────────────┐
                          │  │ InventoryModule         │    │ ShippingModule            │
                          │  │ queue: inventory-queue  │    │ queue: shipping-queue     │
                          │  │ @MessageHandler(        │    │ @MessageHandler(          │
                          │  │   'order.placed')       │    │   'order.placed')         │
                          │  │ → reserve stock         │    │ → create shipment         │
                          │  │ → inbox row written     │    │ → inbox row written       │
                          │  └────────────────────────┘    │ → PUBLISH 'shipment.created'│
                          │                                 │   (nested publish)        │
                          │                                 └──────────────┬───────────┘
                          │                                                │ OutboxDispatcher
                          │  ┌──────────────────────────────────┐         │
                          └──┤ OrdersModule  queue: orders-queue  │◀────────┘
                             │ @MessageHandler('shipment.created')│
                             │ → mark order SHIPPED, store shipmentId
                             │ → inbox row written                │
                             └──────────────────────────────────┘
```

Three feature modules, each owning its **own database schema**. Note `OrdersModule` is both a
**publisher** (`order.placed`) and a **subscriber** (`shipment.created`) — the closed loop:

| Module            | Schema      | Owns business table      | Publishes          | Subscribes to      |
| ----------------- | ----------- | ------------------------ | ------------------ | ------------------ |
| `OrdersModule`    | `orders`    | `orders.orders`          | `order.placed`     | `shipment.created` |
| `InventoryModule` | `inventory` | `inventory.reservations` | —                  | `order.placed`     |
| `ShippingModule`  | `shipping`  | `shipping.shipments`     | `shipment.created` | `order.placed`     |

> **Why three schemas?** Each `MessagingModule.forFeature({ schema })` gives that module its **own**
> `outbox_messages` / `inbox_messages` tables, isolated under its schema. This mirrors how the dummy
> app in `src/__tests__/app` splits `property` and `notifications`. It also makes the SQL
> verification unambiguous — you always know which module wrote which row.

The business tables (`orders`, `reservations`, `shipments`) exist so that a handler's effect is
**visible in SQL**, and so you can prove the handler's DB write and its inbox row commit (or roll
back) **together**.

---

## 3. The library API you will use

Read these files once before you start — they are short:

- `src/services/message-bus.service.ts` — `publish(eventType, body, parentHeaders?)`.
- `src/decorators/message-handler.decorator.ts` — `@MessageHandler(eventType)`.
- `src/decorators/endpoint-queue.decorator.ts` — `@EndpointQueue(queueName)` (goes on the **module class**).
- `src/processors/module-message.processor.ts` — the `ModuleMessageProcessor` base class you extend.
- `src/messaging.module.ts` — `forRoot()` (global, once) and `forFeature({ schema })` (per module).
- `src/migrations/index.ts` — `generateMessagingMigrationSql(schema)`.

The contract, in one paragraph:

> `MessagingModule.forRoot({ appName, dispatchIntervalMs })` is imported **once** (it's global) and
> starts the background dispatcher + cleanup jobs. Each feature module imports
> `MessagingModule.forFeature({ schema })`, which provides a **schema-scoped** `MessageBus` and
> `InboxStore` to that module. A **publisher** injects `MessageBus` and calls `publish()`. A
> **subscriber** module is decorated `@EndpointQueue('its-queue')`, registers a BullMQ queue of the
> same name, declares a processor extending `ModuleMessageProcessor`, and provides one or more
> `@Injectable()` handlers decorated `@MessageHandler(eventType)` implementing `IMessageHandler<T>`.

---

## 4. Prerequisites & infrastructure

The only hard requirement is a **SQL Server** instance and a **Redis** instance the app can reach.
**How you run them is your choice** — local installs, an existing shared dev server, a cloud
instance, or containers. The app reads connection details from env vars (`DB_HOST`, `DB_PORT`,
`DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, and Redis host/port in `AppModule`), so point them
wherever your instances live. Whatever you pick, make sure:

- A database exists for the app (the wiring below assumes one named `fulfilment` — change it if you like):
  ```sql
  IF DB_ID('fulfilment') IS NULL CREATE DATABASE fulfilment;
  ```
- Redis is empty-ish / not shared with something that would collide on queue names.

If you _want_ a zero-setup option, this `docker-compose.yml` brings both up locally and matches the
defaults in the wiring below — but it's just a convenience, not part of the exercise:

```yaml
# docker-compose.yml  (optional convenience)
services:
  mssql:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      ACCEPT_EULA: 'Y'
      MSSQL_SA_PASSWORD: 'p3FauyT9iv9ygHXE6txT'
    ports:
      - '1433:1433'
  redis:
    image: redis:7
    ports:
      - '6379:6379'
```

App dependencies (a fresh NestJS app, or just an `app/` folder under the package using its existing
`node_modules`):

```
@nestjs/common @nestjs/core @nestjs/platform-express @nestjs/bullmq @nestjs/typeorm
bullmq typeorm mssql typeorm-transactional reflect-metadata
@gskglobal/nestjs-messaging   # the library under test
```

---

## 5. Build it — step by step

> Files marked **GIVEN** are boilerplate — copy them verbatim, they are not the learning. Files
> marked **TODO** are yours to write; specs are precise enough to do without the solution.

### 5.1 Event contracts — **TODO**

Create `events/order-placed.event.ts`:

```ts
export const ORDER_PLACED = 'order.placed';

export interface OrderPlacedEvent {
  orderId: string;
  customerId: string;
  sku: string;
  quantity: number;
}
```

And `events/shipment-created.event.ts` (published later by Shipping — nested publish):

```ts
export const SHIPMENT_CREATED = 'shipment.created';

export interface ShipmentCreatedEvent {
  shipmentId: string;
  orderId: string;
}
```

> Event type strings are the contract between publisher and subscriber. They are matched by the
> `SubscriptionRegistry` — a typo means "no subscribers", and the message will be marked dispatched
> with zero fan-out (see `outbox-dispatcher.processor.ts`, the `subscribedQueues.length === 0` branch).

### 5.2 `OrdersModule` — publisher **and** subscriber — **TODO**

This module both **starts** the chain (`POST /orders` → publish `order.placed`) and **closes** it
(subscribes to `shipment.created` → mark the order shipped). Wiring it as both proves a single module
can own a queue _and_ publish events.

Requirements:

- `@EndpointQueue('orders-queue')` on the module class (so it can subscribe).
- Import `BullModule.registerQueue({ name: 'orders-queue' })`,
  `MessagingModule.forFeature({ schema: 'orders' })`, and `TypeOrmModule.forFeature([OrderEntity])`.
- An `OrderEntity` mapped to `orders.orders` with at least
  `(id, customerId, sku, quantity, status, shipmentId, createdAt)`. Default `status` to `'PLACED'`;
  `shipmentId` is nullable.
- An `OrdersQueueProcessor extends ModuleMessageProcessor` over `'orders-queue'` (same shape as the
  other modules' processors).
- A `MarkOrderShippedHandler` (below) subscribed to `shipment.created`.
- An `OrdersController` with **`@Transactional()` on every endpoint** (workspace convention — the
  controller is the transaction boundary; see the root `CLAUDE.md`). It injects `MessageBus` and the
  `OrderEntity` repository.

Endpoints to expose (the only API surface in this exercise):

```
POST /orders            body: { customerId, sku, quantity }
   → save an order row (status=PLACED) AND messageBus.publish(ORDER_PLACED, {...})   (happy path)

POST /orders/fail       body: { customerId, sku, quantity }
   → save the order, publish, then THROW.   (rollback proof — nothing should persist)

GET  /orders/:id
   → return the order: { orderId, status, shipmentId }.
     After the full chain runs, status flips PLACED → SHIPPED and shipmentId is populated.
```

Controller sketch:

```ts
@Controller('orders')
export class OrdersController {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orders: Repository<OrderEntity>,
    private readonly bus: MessageBus, // schema-scoped to 'orders'
  ) {}

  @Post()
  @Transactional()
  async place(@Body() body: PlaceOrderBody): Promise<{ orderId: string }> {
    const orderId = randomUUID();
    // TODO: save the order row (status defaults to 'PLACED')
    // TODO: await this.bus.publish(ORDER_PLACED, { orderId, ...body });
    return { orderId };
  }

  @Post('fail')
  @Transactional()
  async placeThenFail(@Body() body: PlaceOrderBody): Promise<void> {
    // TODO: same save + publish as above ...
    throw new Error('deliberate failure after publish'); // forces rollback
  }

  @Get(':id')
  @Transactional()
  async get(@Param('id') id: string) {
    const order = await this.orders.findOneByOrFail({ id });
    return {
      orderId: order.id,
      status: order.status,
      shipmentId: order.shipmentId,
    };
  }
}
```

The `shipment.created` handler (lives in `OrdersModule`, writes only to the `orders` schema):

```ts
@Injectable()
@MessageHandler(SHIPMENT_CREATED)
export class MarkOrderShippedHandler implements IMessageHandler<ShipmentCreatedEvent> {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orders: Repository<OrderEntity>,
  ) {}

  async handle(
    body: ShipmentCreatedEvent,
    headers: MessageHeaders,
  ): Promise<void> {
    // TODO: update orders.orders SET status='SHIPPED', shipmentId=body.shipmentId WHERE id=body.orderId
    // Runs in the same @Transactional boundary as the orders-queue inbox row.
  }
}
```

> **Key insight to verify later:** because `publish()` writes inside the controller's
> `@Transactional()` unit of work, the `/orders/fail` endpoint must leave **zero** rows in both
> `orders.orders` AND `orders.outbox_messages`. The order and the "I published an event" fact commit
> or roll back together. This is exactly `src/__tests__/integration/rollback.spec.ts`.
>
> And the **closed loop**: `GET /orders/:id` returning `status: 'SHIPPED'` is end-to-end proof that
> `order.placed` reached Shipping, Shipping nested-published `shipment.created`, and that event came
> all the way back to update the originating order — entirely through the outbox, no direct calls.

### 5.3 `InventoryModule` — a subscriber — **TODO**

- `@EndpointQueue('inventory-queue')` on the module class.
- Import `BullModule.registerQueue({ name: 'inventory-queue' })` and
  `MessagingModule.forFeature({ schema: 'inventory' })`.
- A processor extending `ModuleMessageProcessor`:

```ts
@Processor('inventory-queue')
export class InventoryQueueProcessor extends ModuleMessageProcessor {
  constructor(registry: SubscriptionRegistry, inbox: InboxStore) {
    super('inventory-queue', registry, inbox);
  }
}
```

- A handler that reserves stock:

```ts
@Injectable()
@MessageHandler(ORDER_PLACED)
export class ReserveStockHandler implements IMessageHandler<OrderPlacedEvent> {
  constructor(
    @InjectRepository(ReservationEntity)
    private readonly repo: Repository<ReservationEntity>,
  ) {}

  async handle(body: OrderPlacedEvent, headers: MessageHeaders): Promise<void> {
    // TODO: insert a row into inventory.reservations for (body.orderId, body.sku, body.quantity)
    // This write runs in the SAME @Transactional boundary as the inbox row.
  }
}
```

### 5.4 `ShippingModule` — a subscriber that also publishes — **TODO**

Same shape as Inventory (`@EndpointQueue('shipping-queue')`, its own queue, schema `shipping`,
processor, handler on `ORDER_PLACED`), **plus** the handler does a **nested publish**:

```ts
@Injectable()
@MessageHandler(ORDER_PLACED)
export class CreateShipmentHandler implements IMessageHandler<OrderPlacedEvent> {
  constructor(
    @InjectRepository(ShipmentEntity)
    private readonly repo: Repository<ShipmentEntity>,
    private readonly bus: MessageBus, // schema-scoped to 'shipping'
  ) {}

  async handle(body: OrderPlacedEvent, headers: MessageHeaders): Promise<void> {
    const shipmentId = randomUUID();
    // TODO: insert into shipping.shipments
    // TODO: await this.bus.publish(SHIPMENT_CREATED, { shipmentId, orderId: body.orderId }, headers);
  }
}
```

> Note the **third argument** `headers`. Passing the incoming headers makes `correlationId` /
> `conversationId` propagate, so you can trace the whole causal chain in SQL. The downstream
> `shipment.created` row lands in `shipping.outbox_messages` (Shipping's own schema), inside the same
> transaction that wrote the shipment + the inbox row. Mirrors `TC11` in
> `src/__tests__/integration/publish-dispatch-consume.spec.ts`.

### 5.5 `AppModule` + bootstrap — **GIVEN**

This is the fiddly infra (schema creation, messaging migrations, transactional datasource). Copy it.
It is adapted from `src/__tests__/app/app.module.ts`, with one critical change for a _running_ app:
**`dispatchIntervalMs` is small (1000ms) so the dispatcher actually fires on its own.** (The tests
set it huge and call `runDispatch()` by hand; here we want the real loop.)

```ts
// app.module.ts
const SCHEMAS = ['orders', 'inventory', 'shipping'];

@Module({
  imports: [
    BullModule.forRoot({ connection: { host: 'localhost', port: 6379 } }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mssql' as const,
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 1433),
        username: process.env.DB_USERNAME ?? 'sa',
        password: process.env.DB_PASSWORD ?? 'p3FauyT9iv9ygHXE6txT',
        database: process.env.DB_DATABASE ?? 'fulfilment',
        autoLoadEntities: true,
        synchronize: true, // OK for a learning app — auto-creates the business tables
        options: { encrypt: false, trustServerCertificate: true },
      }),
      async dataSourceFactory(options) {
        // 1. bootstrap connection: create each schema + the messaging tables
        const bootstrap = new DataSource({
          ...options!,
          synchronize: false,
          entities: [],
        });
        await bootstrap.initialize();
        for (const schema of SCHEMAS) {
          await bootstrap.query(
            `IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = '${schema}') EXEC('CREATE SCHEMA [${schema}]')`,
          );
          await bootstrap.query(generateMessagingMigrationSql(schema));
        }
        await bootstrap.destroy();
        // 2. real connection, registered with typeorm-transactional
        const ds = new DataSource({ ...options!, synchronize: true });
        await ds.initialize();
        return addTransactionalDataSource(ds);
      },
    }),
    MessagingModule.forRoot({
      appName: 'fulfilment',
      dispatchIntervalMs: 1000,
    }),
    OrdersModule,
    InventoryModule,
    ShippingModule,
  ],
})
export class AppModule {}
```

```ts
// main.ts
import 'reflect-metadata';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  initializeTransactionalContext(); // MUST be before the app is created
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

> **Gotcha:** `initializeTransactionalContext()` must run before `NestFactory.create`. Without it,
> `@Transactional()` silently does nothing and your rollback scenario will "fail" by leaving rows
> behind. If your rollback test misbehaves, check this first.

On boot you should see the library log its discovered subscriptions, e.g.:

```
Subscription: [order.placed]     → inventory-queue: [ReserveStockHandler]
Subscription: [order.placed]     → shipping-queue:  [CreateShipmentHandler]
Subscription: [shipment.created] → orders-queue:    [MarkOrderShippedHandler]
```

If you **don't** see all three lines, your `@EndpointQueue` / `@MessageHandler` wiring is wrong — fix
that before touching SQL.

---

## 6. Trigger the scenarios (the only "API")

```bash
# Happy path — one order, fans out to inventory + shipping
curl -s -XPOST localhost:3000/orders \
  -H 'content-type: application/json' \
  -d '{"customerId":"c-1","sku":"WIDGET-1","quantity":3}'

# Rollback — order + publish inside a transaction that throws
curl -s -XPOST localhost:3000/orders/fail \
  -H 'content-type: application/json' \
  -d '{"customerId":"c-2","sku":"WIDGET-2","quantity":1}'

# Read back — poll until status flips PLACED → SHIPPED (use the orderId from the POST response)
curl -s localhost:3000/orders/<orderId>
```

The dispatcher polls every second, so after the happy-path call, **wait ~3 seconds** for the full
round trip: `order.placed` → Shipping creates a shipment → nested `shipment.created` → Orders marks
the order SHIPPED. Then `GET /orders/:id` should report `status: "SHIPPED"`. (This is the real,
end-to-end pub/sub loop — no manual dispatch.)

---

## 7. Verify with SQL — this is the assessment

Connect to the `fulfilment` DB. Run these after each scenario and **explain every row**.

### Scenario A — Happy path (run the `POST /orders` curl, then wait 2s)

```sql
-- A1. The publisher wrote exactly one outbox row, now dispatched.
SELECT eventType, dispatched, dispatchAttempts, dispatchedAt
FROM orders.outbox_messages;
--   expect: 1 row | order.placed | dispatched = 1 | dispatchAttempts = 1 | dispatchedAt NOT NULL

-- A2. FAN-OUT proof: the SAME order.placed message produced an inbox row in BOTH
--     subscriber schemas, each tagged with its own endpointQueue.
SELECT 'inventory' AS schemaName, endpointQueue, eventType FROM inventory.inbox_messages
UNION ALL
SELECT 'shipping'  AS schemaName, endpointQueue, eventType FROM shipping.inbox_messages;
--   expect: 2 rows | inventory-queue & shipping-queue | both order.placed

-- A3. Both handlers actually did their business work (visible side effects).
SELECT * FROM inventory.reservations;     -- expect: 1 row for the order/sku/qty
SELECT * FROM shipping.shipments;         -- expect: 1 row for the order

-- A4. NESTED PUBLISH proof: Shipping's handler published shipment.created into
--     ITS OWN outbox; correlationId ties it back to the original order.placed.
SELECT eventType, dispatched, correlationId, conversationId
FROM shipping.outbox_messages;
--   expect: 1 row | shipment.created | dispatched = 1 (after another ~1s)
--   correlationId == the messageId of the original order.placed row.

-- A5. Trace the whole causal chain by conversationId.
SELECT 'orders.outbox'   AS src, messageId, eventType, correlationId, conversationId FROM orders.outbox_messages
UNION ALL
SELECT 'shipping.outbox' AS src, messageId, eventType, correlationId, conversationId FROM shipping.outbox_messages;
--   expect: both rows share the same conversationId.

-- A6. CLOSED LOOP proof: shipment.created came back to Orders.
--     (a) Orders consumed it — an inbox row on orders-queue.
SELECT endpointQueue, eventType FROM orders.inbox_messages;
--   expect: 1 row | orders-queue | shipment.created

--     (b) The order's status flipped and the shipmentId was stamped on it.
SELECT id, status, shipmentId FROM orders.orders;
--   expect: status = 'SHIPPED', shipmentId == the shipping.shipments id from A3.
```

### Scenario B — Rollback (run the `POST /orders/fail` curl)

```sql
-- B1. The throw rolled back the unit of work: no order, no outbox row.
SELECT COUNT(*) AS orderRows  FROM orders.orders          WHERE customerId = 'c-2';   -- expect 0
SELECT COUNT(*) AS outboxRows FROM orders.outbox_messages WHERE source = 'fulfilment'
   AND messageId NOT IN (SELECT messageId FROM orders.outbox_messages);               -- expect 0 net-new
```

> Cleaner: truncate first (Section 9), call only `/orders/fail`, then
> `SELECT COUNT(*) FROM orders.outbox_messages;` → **0**. Business write and event publish are atomic.

### Scenario C — Exactly-once / idempotency (conceptual + observable)

The inbox is what guarantees a handler runs **once** even if BullMQ redelivers a job (retry, worker
stall). The composite primary key `(messageId, endpointQueue)` is the dedup mechanism — see
`generateMessagingMigrationSql` and `src/services/inbox-store.service.ts`.

```sql
-- C1. There is at most one inbox row per (message, queue). Any duplicate would be a bug.
SELECT messageId, endpointQueue, COUNT(*) AS n
FROM inventory.inbox_messages
GROUP BY messageId, endpointQueue
HAVING COUNT(*) > 1;
--   expect: 0 rows (the PK makes a second insert fail; the processor catches 2627/2601 and skips)
```

To _see_ redelivery dedup live: place an order, let it process, then with BullMQ Board / redis-cli
re-add the same job (same `jobId = <messageId>_inventory-queue`). The handler will **not** run again
and no second `reservations` row appears, because `InboxStore.isProcessed` short-circuits. This is
`TC5`/`TC6` in `src/__tests__/integration/inbox-dedup.spec.ts`.

---

## 8. Stretch goals (optional, each maps to a real test in the package)

1. **Dispatcher retry (`TC3/TC8`).** Stop Redis (however you're running it) _after_ placing an
   order. Watch `orders.outbox_messages`: `dispatched = 0`, `dispatchAttempts` climbing,
   `lastDispatchError` populated. Start Redis again → it dispatches on the next poll.
   ```sql
   SELECT dispatched, dispatchAttempts, lastDispatchError FROM orders.outbox_messages;
   ```
2. **No subscribers.** Publish an event type nobody handles (add a throwaway endpoint that publishes
   `order.cancelled`). The dispatcher marks it `dispatched = 1` with **no** inbox rows anywhere —
   prove it. (Why? `subscribedQueues.length === 0` branch in the dispatcher.)
3. **Ordering (`TC9`).** Place 3 orders quickly; confirm `outbox_messages` dispatched in
   `createdAt ASC` order (`ORDER BY createdAt`).
4. **Cleanup.** Set `cleanupRetentionDays: 0` in `forRoot`, observe the daily cleanup job's effect
   on dispatched/processed rows (or call the logic manually).

---

## 9. Reset between runs

```sql
DELETE FROM orders.outbox_messages;     DELETE FROM orders.inbox_messages;
DELETE FROM inventory.inbox_messages;   DELETE FROM inventory.reservations;
DELETE FROM shipping.inbox_messages;    DELETE FROM shipping.outbox_messages;  DELETE FROM shipping.shipments;
DELETE FROM orders.orders;
```

And drain Redis between sessions if jobs linger (e.g. `redis-cli FLUSHALL` against your instance).

---

## 10. Acceptance checklist

You're done when you can demonstrate **and explain**:

- [ ] Boot logs show all **three** subscriptions discovered.
- [ ] `POST /orders` → exactly 1 dispatched `orders.outbox_messages` row.
- [ ] Same message produced 1 inbox row in **both** `inventory` and `shipping` (fan-out).
- [ ] Both business tables (`reservations`, `shipments`) got their row.
- [ ] Shipping's handler nested-published `shipment.created` into `shipping.outbox_messages`, sharing
      the original `conversationId`.
- [ ] `shipment.created` was consumed by Orders (`orders.inbox_messages` on `orders-queue`), and
      `GET /orders/:id` reports `status: "SHIPPED"` with the matching `shipmentId` (closed loop).
- [ ] `POST /orders/fail` left **zero** rows in `orders.orders` and `orders.outbox_messages`.
- [ ] No duplicate `(messageId, endpointQueue)` rows in any inbox.
- [ ] You can point at the library source line that makes each of the above true.

> **Where the answers live (peek only after you've tried):** the integration specs under
> `packages/nestjs-messaging/src/__tests__/integration/` cover every behaviour above against the
> `property` / `notifications` dummy app. Your job was to reproduce the same guarantees in a brand
> new `orders` / `inventory` / `shipping` app.
