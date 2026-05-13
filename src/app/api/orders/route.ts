import { NextRequest, NextResponse } from "next/server";
import { db } from "@/index";
import {
  orderTable,
  orderItemsTable,
  usersTable,
  productTable,
} from "@/db/schema";
import { eq, like, and, desc, sql } from "drizzle-orm";

// GET - 获取订单列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const userId = searchParams.get("userId");

    const offset = (page - 1) * pageSize;

    let query = db.select().from(orderTable);
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(orderTable);

    // 构建查询条件
    const conditions: any[] = [];

    if (search) {
      conditions.push(like(orderTable.orderNumber, `%${search}%`));
    }

    if (status) {
      conditions.push(eq(orderTable.status, status));
    }

    if (userId) {
      conditions.push(eq(orderTable.userId, parseInt(userId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
      countQuery = countQuery.where(and(...conditions));
    }

    const orders = await query
      .orderBy(desc(orderTable.createdAt))
      .limit(pageSize)
      .offset(offset);

    const totalResult = await countQuery;

    return NextResponse.json({
      success: true,
      data: orders,
      total: totalResult[0]?.count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("获取订单列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取订单列表失败" },
      { status: 500 },
    );
  }
}

// POST - 创建订单
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      totalAmount,
      shippingAddress,
      contactPhone,
      contactName,
      notes,
      items,
    } = body;

    // 验证必填字段
    if (
      !userId ||
      !totalAmount ||
      !shippingAddress ||
      !contactPhone ||
      !contactName
    ) {
      return NextResponse.json(
        { success: false, error: "缺少必填字段" },
        { status: 400 },
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "订单必须包含商品" },
        { status: 400 },
      );
    }

    // 生成订单号
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderNumber = `ORD-${timestamp}-${random}`;

    // 使用事务创建订单和订单项
    const result = await db.transaction(async (tx) => {
      // 创建订单
      const [newOrder] = await tx
        .insert(orderTable)
        .values({
          orderNumber,
          userId,
          totalAmount,
          status: "pending",
          shippingAddress,
          contactPhone,
          contactName,
          notes: notes || null,
        })
        .returning();

      // 创建订单项
      const orderItems = items.map((item: any) => ({
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      }));

      await tx.insert(orderItemsTable).values(orderItems);

      // 更新商品库存
      for (const item of items) {
        await tx
          .update(productTable)
          .set({
            stock: productTable.stock - item.quantity,
            updatedAt: new Date(),
          })
          .where(eq(productTable.id, item.productId));
      }

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "订单创建成功",
    });
  } catch (error) {
    console.error("创建订单失败:", error);
    return NextResponse.json(
      { success: false, error: "创建订单失败" },
      { status: 500 },
    );
  }
}

// PUT - 更新订单
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, shippingAddress, contactPhone, contactName, notes } =
      body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "订单 ID 为必填项" },
        { status: 400 },
      );
    }

    // 检查订单是否存在
    const existingOrder = await db
      .select()
      .from(orderTable)
      .where(eq(orderTable.id, id))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json(
        { success: false, error: "订单不存在" },
        { status: 404 },
      );
    }

    // 更新订单
    const [updatedOrder] = await db
      .update(orderTable)
      .set({
        status,
        shippingAddress,
        contactPhone,
        contactName,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(orderTable.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: "订单更新成功",
    });
  } catch (error) {
    console.error("更新订单失败:", error);
    return NextResponse.json(
      { success: false, error: "更新订单失败" },
      { status: 500 },
    );
  }
}

// DELETE - 删除订单
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "订单 ID 为必填项" },
        { status: 400 },
      );
    }

    // 检查订单是否存在
    const existingOrder = await db
      .select()
      .from(orderTable)
      .where(eq(orderTable.id, id))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json(
        { success: false, error: "订单不存在" },
        { status: 404 },
      );
    }

    // 使用事务删除订单和订单项
    await db.transaction(async (tx) => {
      // 先删除订单项
      await tx.delete(orderItemsTable).where(eq(orderItemsTable.orderId, id));
      // 再删除订单
      await tx.delete(orderTable).where(eq(orderTable.id, id));
    });

    return NextResponse.json({
      success: true,
      message: "订单删除成功",
    });
  } catch (error) {
    console.error("删除订单失败:", error);
    return NextResponse.json(
      { success: false, error: "删除订单失败" },
      { status: 500 },
    );
  }
}
