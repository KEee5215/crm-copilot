import {
  integer,
  real,
  pgTable,
  varchar,
  timestamp,
  text,
  boolean,
  index,
  unique,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "inactive",
  "suspended",
]);

export const usersTable = pgTable(
  "users",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    //身份角色
    role: varchar({ length: 20 }).notNull().default("user"),
    password: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  }),
);

// 分类表
export const productCategoryEnum = pgEnum("product_category", [
  "electronics",
  "clothing",
  "food",
  "books",
  "other",
]);

// 商品表
export const productTable = pgTable(
  "products",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    price: real().notNull(),
    stock: integer().notNull().default(0),
    category: productCategoryEnum().notNull().default("other"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index("products_name_idx").on(table.name),
    categoryIdx: index("products_category_idx").on(table.category),
  }),
);

export const orderStatusEnum = pgEnum("order_status", [
  "pending", //待处理
  "processing", //处理中
  "shipped", //已发货
  "delivered", //已送达
  "cancelled", //已取消
]);

export const orderTable = pgTable(
  "orders",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    totalAmount: real("total_amount").notNull(),
    status: orderStatusEnum().notNull().default("pending"),
    shippingAddress: text("shipping_address").notNull(),
    contactPhone: varchar("contact_phone", { length: 20 }).notNull(),
    contactName: varchar("contact_name", { length: 255 }).notNull(),
    notes: text(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("orders_user_id_idx").on(table.userId),
    orderNumberIdx: unique("orders_order_number_idx").on(table.orderNumber),
  }),
);

export const orderItemsTable = pgTable(
  "order_items",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orderTable.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "restrict" }),
    quantity: integer().notNull(),
    unitPrice: real("unit_price").notNull(),
    totalPrice: real("total_price").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
    productIdIdx: index("order_items_product_id_idx").on(table.productId),
  }),
);
// 一个用户可以有多个订单
export const usersRelations = relations(usersTable, ({ many }) => ({
  orders: many(orderTable),
}));

// 一个商品可以被多个订单引用
export const productsRelations = relations(productTable, ({ many }) => ({
  orderItems: many(orderItemsTable),
}));

// 一个订单可以有多个商品
export const ordersRelations = relations(orderTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [orderTable.userId],
    references: [usersTable.id],
  }),
  items: many(orderItemsTable),
}));

export const orderItemsRelations = relations(orderItemsTable, ({ one }) => ({
  order: one(orderTable, {
    fields: [orderItemsTable.orderId],
    references: [orderTable.id],
  }),
  product: one(productTable, {
    fields: [orderItemsTable.productId],
    references: [productTable.id],
  }),
}));

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type UserStatus = (typeof userStatusEnum.enumValues)[number];

export type Product = typeof productTable.$inferSelect;
export type NewProduct = typeof productTable.$inferInsert;
export type ProductCategory = (typeof productCategoryEnum.enumValues)[number];

export type Order = typeof orderTable.$inferSelect;
export type NewOrder = typeof orderTable.$inferInsert;
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];

export type OrderItem = typeof orderItemsTable.$inferSelect;
export type NewOrderItem = typeof orderItemsTable.$inferInsert;
