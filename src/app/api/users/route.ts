import { NextRequest, NextResponse } from "next/server";
import { db } from "@/index";
import { usersTable } from "@/db/schema";
import { eq, like, or, sql } from "drizzle-orm";

// GET - 获取用户列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * pageSize;

    let query = db.select().from(usersTable);

    if (search) {
      query = query.where(
        or(
          like(usersTable.name, `%${search}%`),
          like(usersTable.email, `%${search}%`),
        ),
      );
    }

    const users = await query
      .orderBy(usersTable.createdAt)
      .limit(pageSize)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(usersTable)
      .where(
        search
          ? or(
              like(usersTable.name, `%${search}%`),
              like(usersTable.email, `%${search}%`),
            )
          : undefined,
      );

    return NextResponse.json({
      success: true,
      data: users,
      total: totalResult[0]?.count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("获取用户列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取用户列表失败" },
      { status: 500 },
    );
  }
}

// POST - 创建用户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    // 验证必填字段
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "姓名、邮箱和密码为必填项" },
        { status: 400 },
      );
    }

    // 检查邮箱是否已存在
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: "邮箱已被使用" },
        { status: 400 },
      );
    }

    // 创建用户
    const [newUser] = await db
      .insert(usersTable)
      .values({
        name,
        email,
        password,
        role: role || "user",
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newUser,
      message: "用户创建成功",
    });
  } catch (error) {
    console.error("创建用户失败:", error);
    return NextResponse.json(
      { success: false, error: "创建用户失败" },
      { status: 500 },
    );
  }
}

// PUT - 更新用户
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, email, role } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "用户 ID 为必填项" },
        { status: 400 },
      );
    }

    // 检查用户是否存在
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 },
      );
    }

    // 如果邮箱被修改，检查新邮箱是否已被使用
    if (email && email !== existingUser[0].email) {
      const emailExists = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (emailExists.length > 0) {
        return NextResponse.json(
          { success: false, error: "邮箱已被使用" },
          { status: 400 },
        );
      }
    }

    // 更新用户
    const [updatedUser] = await db
      .update(usersTable)
      .set({
        name,
        email,
        role,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "用户更新成功",
    });
  } catch (error) {
    console.error("更新用户失败:", error);
    return NextResponse.json(
      { success: false, error: "更新用户失败" },
      { status: 500 },
    );
  }
}

// DELETE - 删除用户
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "用户 ID 为必填项" },
        { status: 400 },
      );
    }

    // 检查用户是否存在
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 },
      );
    }

    // 删除用户
    await db.delete(usersTable).where(eq(usersTable.id, id));

    return NextResponse.json({
      success: true,
      message: "用户删除成功",
    });
  } catch (error) {
    console.error("删除用户失败:", error);
    return NextResponse.json(
      { success: false, error: "删除用户失败" },
      { status: 500 },
    );
  }
}
