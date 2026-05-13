import { NextRequest, NextResponse } from "next/server";
import { db } from "@/index";
import { productTable } from "@/db/schema";
import { eq, like, and, sql } from "drizzle-orm";

// GET - 获取商品列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const isActive = searchParams.get("isActive");

    const offset = (page - 1) * pageSize;

    let query = db.select().from(productTable);
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(productTable);

    // 构建查询条件
    const conditions: any[] = [];

    if (search) {
      conditions.push(like(productTable.name, `%${search}%`));
    }

    if (category) {
      conditions.push(eq(productTable.category, category));
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(productTable.isActive, isActive === "true"));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
      countQuery = countQuery.where(and(...conditions));
    }

    const products = await query
      .orderBy(productTable.createdAt)
      .limit(pageSize)
      .offset(offset);

    const totalResult = await countQuery;

    return NextResponse.json({
      success: true,
      data: products,
      total: totalResult[0]?.count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("获取商品列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取商品列表失败" },
      { status: 500 },
    );
  }
}

// POST - 创建商品
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, stock, category, isActive } = body;

    // 验证必填字段
    if (!name || !price) {
      return NextResponse.json(
        { success: false, error: "商品名称和价格为必填项" },
        { status: 400 },
      );
    }

    // 创建商品
    const [newProduct] = await db
      .insert(productTable)
      .values({
        name,
        description: description || null,
        price,
        stock: stock || 0,
        category: category || "other",
        isActive: isActive !== undefined ? isActive : true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newProduct,
      message: "商品创建成功",
    });
  } catch (error) {
    console.error("创建商品失败:", error);
    return NextResponse.json(
      { success: false, error: "创建商品失败" },
      { status: 500 },
    );
  }
}

// PUT - 更新商品
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, price, stock, category, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "商品 ID 为必填项" },
        { status: 400 },
      );
    }

    // 检查商品是否存在
    const existingProduct = await db
      .select()
      .from(productTable)
      .where(eq(productTable.id, id))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json(
        { success: false, error: "商品不存在" },
        { status: 404 },
      );
    }

    // 更新商品
    const [updatedProduct] = await db
      .update(productTable)
      .set({
        name,
        description,
        price,
        stock,
        category,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(productTable.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: "商品更新成功",
    });
  } catch (error) {
    console.error("更新商品失败:", error);
    return NextResponse.json(
      { success: false, error: "更新商品失败" },
      { status: 500 },
    );
  }
}

// DELETE - 删除商品
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "商品 ID 为必填项" },
        { status: 400 },
      );
    }

    // 检查商品是否存在
    const existingProduct = await db
      .select()
      .from(productTable)
      .where(eq(productTable.id, id))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json(
        { success: false, error: "商品不存在" },
        { status: 404 },
      );
    }

    // 删除商品
    await db.delete(productTable).where(eq(productTable.id, id));

    return NextResponse.json({
      success: true,
      message: "商品删除成功",
    });
  } catch (error) {
    console.error("删除商品失败:", error);
    return NextResponse.json(
      { success: false, error: "删除商品失败" },
      { status: 500 },
    );
  }
}
