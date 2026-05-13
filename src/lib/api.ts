// API 基础路径
const API_BASE = "/api";

// 通用响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
  page?: number;
  pageSize?: number;
}

// 用户相关 API
export const userApi = {
  // 获取用户列表
  async getUsers(page = 1, pageSize = 10, search = "") {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      search,
    });
    const response = await fetch(`${API_BASE}/users?${params}`);
    return response.json() as Promise<ApiResponse<any[]>>;
  },

  // 创建用户
  async createUser(data: { name: string; email: string; password: string; role?: string }) {
    const response = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<ApiResponse<any>>;
  },

  // 更新用户
  async updateUser(data: { id: number; name?: string; email?: string; role?: string }) {
    const response = await fetch(`${API_BASE}/users`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<ApiResponse<any>>;
  },

  // 删除用户
  async deleteUser(id: number) {
    const response = await fetch(`${API_BASE}/users?id=${id}`, {
      method: "DELETE",
    });
    return response.json() as Promise<ApiResponse<void>>;
  },
};

// 商品相关 API
export const productApi = {
  // 获取商品列表
  async getProducts(
    page = 1,
    pageSize = 10,
    search = "",
    category = "",
    isActive?: boolean
  ) {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      search,
      category,
    });
    if (isActive !== undefined) {
      params.set("isActive", isActive.toString());
    }
    const response = await fetch(`${API_BASE}/products?${params}`);
    return response.json() as Promise<ApiResponse<any[]>>;
  },

  // 创建商品
  async createProduct(data: {
    name: string;
    price: number;
    description?: string;
    stock?: number;
    category?: string;
    isActive?: boolean;
  }) {
    const response = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<ApiResponse<any>>;
  },

  // 更新商品
  async updateProduct(data: {
    id: number;
    name?: string;
    price?: number;
    description?: string;
    stock?: number;
    category?: string;
    isActive?: boolean;
  }) {
    const response = await fetch(`${API_BASE}/products`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<ApiResponse<any>>;
  },

  // 删除商品
  async deleteProduct(id: number) {
    const response = await fetch(`${API_BASE}/products?id=${id}`, {
      method: "DELETE",
    });
    return response.json() as Promise<ApiResponse<void>>;
  },
};

// 订单相关 API
export const orderApi = {
  // 获取订单列表
  async getOrders(
    page = 1,
    pageSize = 10,
    search = "",
    status = "",
    userId?: number
  ) {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      search,
      status,
    });
    if (userId) {
      params.set("userId", userId.toString());
    }
    const response = await fetch(`${API_BASE}/orders?${params}`);
    return response.json() as Promise<ApiResponse<any[]>>;
  },

  // 创建订单
  async createOrder(data: {
    userId: number;
    totalAmount: number;
    shippingAddress: string;
    contactPhone: string;
    contactName: string;
    notes?: string;
    items: Array<{
      productId: number;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  }) {
    const response = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<ApiResponse<any>>;
  },

  // 更新订单
  async updateOrder(data: {
    id: number;
    status?: string;
    shippingAddress?: string;
    contactPhone?: string;
    contactName?: string;
    notes?: string;
  }) {
    const response = await fetch(`${API_BASE}/orders`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<ApiResponse<any>>;
  },

  // 删除订单
  async deleteOrder(id: number) {
    const response = await fetch(`${API_BASE}/orders?id=${id}`, {
      method: "DELETE",
    });
    return response.json() as Promise<ApiResponse<void>>;
  },
};
