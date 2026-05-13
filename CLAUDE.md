@AGENTS.md

## Table `order_items`

### Columns

| Name         | Type        | Constraints      |
| ------------ | ----------- | ---------------- |
| `id`         | `int4`      | Primary Identity |
| `orderId`    | `int4`      |                  |
| `productId`  | `int4`      |                  |
| `quantity`   | `int4`      |                  |
| `unitPrice`  | `float4`    |                  |
| `totalPrice` | `float4`    |                  |
| `createdAt`  | `timestamp` |                  |

## Table `orders`

### Columns

| Name              | Type           | Constraints      |
| ----------------- | -------------- | ---------------- |
| `id`              | `int4`         | Primary Identity |
| `orderNumber`     | `varchar`      | Unique           |
| `userId`          | `int4`         |                  |
| `totalAmount`     | `float4`       |                  |
| `status`          | `order_status` |                  |
| `shippingAddress` | `text`         |                  |
| `contactPhone`    | `varchar`      |                  |
| `contactName`     | `varchar`      |                  |
| `notes`           | `text`         | Nullable         |
| `createdAt`       | `timestamp`    |                  |
| `updatedAt`       | `timestamp`    |                  |

## Table `products`

### Columns

| Name          | Type               | Constraints      |
| ------------- | ------------------ | ---------------- |
| `id`          | `int4`             | Primary Identity |
| `name`        | `varchar`          |                  |
| `description` | `text`             | Nullable         |
| `price`       | `float4`           |                  |
| `category`    | `product_category` |                  |
| `isActive`    | `bool`             |                  |
| `createdAt`   | `timestamp`        |                  |
| `updatedAt`   | `timestamp`        |                  |

## Table `users`

### Columns

| Name        | Type        | Constraints      |
| ----------- | ----------- | ---------------- |
| `id`        | `int4`      | Primary Identity |
| `name`      | `varchar`   |                  |
| `role`      | `varchar`   |                  |
| `password`  | `varchar`   |                  |
| `email`     | `varchar`   | Unique           |
| `createdAt` | `timestamp` |                  |
| `updatedAt` | `timestamp` |                  |
