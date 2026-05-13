import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";
import {
  usersTable,
  productTable,
  orderTable,
  orderItemsTable,
  usersRelations,
  productsRelations,
  ordersRelations,
  orderItemsRelations,
  type User,
  type NewUser,
  type UserStatus,
  type Product,
  type NewProduct,
  type ProductCategory,
  type Order,
  type NewOrder,
  type OrderStatus,
  type OrderItem,
  type NewOrderItem,
} from "./db/schema";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle({ client, casing: "snake_case" });

export const userService = {
  async create(user: NewUser): Promise<User> {
    const result = await db.insert(usersTable).values(user).returning();
    return result[0];
  },

  async findById(id: number): Promise<User | undefined> {
    const result = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));
    return result[0];
  },

  async findByIdWithOrders(
    id: number,
  ): Promise<(User & { orders: Order[] }) | undefined> {
    const result = await db
      .select({
        user: usersTable,
        orders: orderTable,
      })
      .from(usersTable)
      .leftJoin(orderTable, eq(usersTable.id, orderTable.userId))
      .where(eq(usersTable.id, id));

    if (result.length === 0) return undefined;

    const user = result[0].user;
    const orders = result.map((r) => r.orders).filter(Boolean);

    return { ...user, orders };
  },

  async findByEmail(email: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    return result[0];
  },

  async findAll(page: number = 1, pageSize: number = 10): Promise<User[]> {
    return db
      .select()
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
  },

  async update(id: number, data: Partial<NewUser>): Promise<User | undefined> {
    const result = await db
      .update(usersTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning();
    return result[0];
  },

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(usersTable).where(eq(usersTable.id, id));
    return result.rowCount > 0;
  },

  async count(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(usersTable);
    return result[0]?.count || 0;
  },
};

export const productService = {
  async create(product: NewProduct): Promise<Product> {
    const result = await db.insert(productTable).values(product).returning();
    return result[0];
  },

  async findById(id: number): Promise<Product | undefined> {
    const result = await db
      .select()
      .from(productTable)
      .where(eq(productTable.id, id));
    return result[0];
  },

  async findByIdWithOrderItems(
    id: number,
  ): Promise<(Product & { orderItems: OrderItem[] }) | undefined> {
    const result = await db
      .select({
        product: productTable,
        orderItems: orderItemsTable,
      })
      .from(productTable)
      .leftJoin(orderItemsTable, eq(productTable.id, orderItemsTable.productId))
      .where(eq(productTable.id, id));

    if (result.length === 0) return undefined;

    const product = result[0].product;
    const orderItems = result.map((r) => r.orderItems).filter(Boolean);

    return { ...product, orderItems };
  },

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    category?: ProductCategory,
    search?: string,
    isActive?: boolean,
  ): Promise<Product[]> {
    let query = db.select().from(productTable);

    if (category) {
      query = query.where(eq(productTable.category, category));
    }
    if (search) {
      query = query.where(like(productTable.name, `%${search}%`));
    }
    if (isActive !== undefined) {
      query = query.where(eq(productTable.isActive, isActive));
    }

    return query
      .orderBy(desc(productTable.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
  },

  async update(
    id: number,
    data: Partial<NewProduct>,
  ): Promise<Product | undefined> {
    const result = await db
      .update(productTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(productTable.id, id))
      .returning();
    return result[0];
  },

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(productTable).where(eq(productTable.id, id));
    return result.rowCount > 0;
  },

  async count(category?: ProductCategory, isActive?: boolean): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)` }).from(productTable);

    if (category) {
      query = query.where(eq(productTable.category, category));
    }
    if (isActive !== undefined) {
      query = query.where(eq(productTable.isActive, isActive));
    }

    const result = await query;
    return result[0]?.count || 0;
  },

  async updateStock(
    id: number,
    quantity: number,
  ): Promise<Product | undefined> {
    const product = await this.findById(id);
    if (!product) return undefined;

    const result = await db
      .update(productTable)
      .set({
        stock: Math.max(0, (product.stock || 0) + quantity),
        updatedAt: new Date(),
      })
      .where(eq(productTable.id, id))
      .returning();
    return result[0];
  },
};

export const orderService = {
  async create(order: NewOrder, items: NewOrderItem[]): Promise<Order> {
    const result = await db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orderTable)
        .values({
          ...order,
          orderNumber: order.orderNumber || generateOrderNumber(),
        })
        .returning();

      const orderItemsWithOrderId = items.map((item) => ({
        ...item,
        orderId: newOrder.id,
      }));

      await tx.insert(orderItemsTable).values(orderItemsWithOrderId);

      return newOrder;
    });

    return result;
  },

  async findById(id: number): Promise<Order | undefined> {
    const result = await db
      .select()
      .from(orderTable)
      .where(eq(orderTable.id, id));
    return result[0];
  },

  async findByIdWithUserAndItems(
    id: number,
  ): Promise<(Order & { user: User; items: OrderItem[] }) | undefined> {
    const result = await db
      .select({
        order: orderTable,
        user: usersTable,
        items: orderItemsTable,
      })
      .from(orderTable)
      .leftJoin(usersTable, eq(orderTable.userId, usersTable.id))
      .leftJoin(orderItemsTable, eq(orderTable.id, orderItemsTable.orderId))
      .where(eq(orderTable.id, id));

    if (result.length === 0) return undefined;

    const order = result[0].order;
    const user = result[0].user;
    const items = result.map((r) => r.items).filter(Boolean);

    return { ...order, user, items };
  },

  async findByIdWithItems(
    id: number,
  ): Promise<(Order & { items: OrderItem[] }) | undefined> {
    const result = await db
      .select({
        order: orderTable,
        items: orderItemsTable,
      })
      .from(orderTable)
      .leftJoin(orderItemsTable, eq(orderTable.id, orderItemsTable.orderId))
      .where(eq(orderTable.id, id));

    if (result.length === 0) return undefined;

    const order = result[0].order;
    const items = result.map((r) => r.items).filter(Boolean);

    return { ...order, items };
  },

  async findByUserId(
    userId: number,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<Order[]> {
    return db
      .select()
      .from(orderTable)
      .where(eq(orderTable.userId, userId))
      .orderBy(desc(orderTable.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
  },

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    status?: OrderStatus,
    userId?: number,
  ): Promise<Order[]> {
    let query = db.select().from(orderTable);

    if (status) {
      query = query.where(eq(orderTable.status, status));
    }
    if (userId) {
      query = query.where(eq(orderTable.userId, userId));
    }

    return query
      .orderBy(desc(orderTable.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
  },

  async update(
    id: number,
    data: Partial<NewOrder>,
  ): Promise<Order | undefined> {
    const result = await db
      .update(orderTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orderTable.id, id))
      .returning();
    return result[0];
  },

  async updateStatus(
    id: number,
    status: OrderStatus,
  ): Promise<Order | undefined> {
    return this.update(id, { status });
  },

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(orderTable).where(eq(orderTable.id, id));
    return result.rowCount > 0;
  },

  async count(status?: OrderStatus, userId?: number): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)` }).from(orderTable);

    if (status) {
      query = query.where(eq(orderTable.status, status));
    }
    if (userId) {
      query = query.where(eq(orderTable.userId, userId));
    }

    const result = await query;
    return result[0]?.count || 0;
  },

  async getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number> {
    let query = db
      .select({ total: orderTable.totalAmount.sum() })
      .from(orderTable);

    if (startDate) {
      query = query.where(orderTable.createdAt.gte(startDate));
    }
    if (endDate) {
      query = query.where(orderTable.createdAt.lte(endDate));
    }

    const result = await query;
    return result[0]?.total || 0;
  },
};

export const orderItemService = {
  async create(orderItem: NewOrderItem): Promise<OrderItem> {
    const result = await db
      .insert(orderItemsTable)
      .values(orderItem)
      .returning();
    return result[0];
  },

  async findById(id: number): Promise<OrderItem | undefined> {
    const result = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.id, id));
    return result[0];
  },

  async findByOrderId(orderId: number): Promise<OrderItem[]> {
    return db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, orderId))
      .orderBy(asc(orderItemsTable.createdAt));
  },

  async update(
    id: number,
    data: Partial<NewOrderItem>,
  ): Promise<OrderItem | undefined> {
    const result = await db
      .update(orderItemsTable)
      .set({ ...data })
      .where(eq(orderItemsTable.id, id))
      .returning();
    return result[0];
  },

  async delete(id: number): Promise<boolean> {
    const result = await db
      .delete(orderItemsTable)
      .where(eq(orderItemsTable.id, id));
    return result.rowCount > 0;
  },

  async deleteByOrderId(orderId: number): Promise<boolean> {
    const result = await db
      .delete(orderItemsTable)
      .where(eq(orderItemsTable.orderId, orderId));
    return result.rowCount > 0;
  },
};

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}
