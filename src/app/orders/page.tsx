"use client";

import { useState, useEffect } from "react";
import { orderApi } from "@/lib/api";

interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  totalAmount: number;
  status: string;
  shippingAddress: string;
  contactPhone: string;
  contactName: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    loadOrders();
  }, [page, searchTerm, selectedStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const status = selectedStatus === "all" ? "" : selectedStatus;
      const result = await orderApi.getOrders(page, 10, searchTerm, status);
      if (result.success && result.data) {
        setOrders(result.data);
        setTotal(result.total || 0);
      }

      // 加载统计数据
      const allOrdersResult = await orderApi.getOrders(1, 1000);
      if (allOrdersResult.success && allOrdersResult.data) {
        const ordersData = allOrdersResult.data;
        setStats({
          total: ordersData.length,
          pending: ordersData.filter((o: any) => o.status === "pending").length,
          processing: ordersData.filter((o: any) => o.status === "processing")
            .length,
          shipped: ordersData.filter((o: any) => o.status === "shipped").length,
          totalAmount: ordersData.reduce(
            (sum: number, o: any) => sum + o.totalAmount,
            0,
          ),
        });
      }
    } catch (error) {
      console.error("加载订单失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(e.target.value);
    setPage(1);
  };

  const handleShip = async (orderId: number) => {
    if (!confirm("确认发货吗？")) return;
    try {
      const result = await orderApi.updateOrder({
        id: orderId,
        status: "shipped",
      });
      if (result.success) {
        alert("发货成功");
        loadOrders();
      } else {
        alert(result.error || "操作失败");
      }
    } catch (error) {
      console.error("发货失败:", error);
      alert("操作失败");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: "待处理",
      processing: "处理中",
      shipped: "已发货",
      delivered: "已送达",
      cancelled: "已取消",
    };
    return texts[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
          <p className="text-gray-500 mt-1">管理订单状态和发货</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          导出订单
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">总订单数</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">待处理</div>
          <div className="text-2xl font-bold text-yellow-600">
            {stats.pending}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">处理中</div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.processing}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">已发货</div>
          <div className="text-2xl font-bold text-purple-600">
            {stats.shipped}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">总销售额</div>
          <div className="text-2xl font-bold text-green-600">
            ¥{stats.totalAmount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className="bg-white rounded-lg shadow p-4 flex space-x-4">
        <select
          value={selectedStatus}
          onChange={handleStatusChange}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部状态</option>
          <option value="pending">待处理</option>
          <option value="processing">处理中</option>
          <option value="shipped">已发货</option>
          <option value="delivered">已送达</option>
          <option value="cancelled">已取消</option>
        </select>
        <input
          type="text"
          placeholder="搜索订单号..."
          value={searchTerm}
          onChange={handleSearch}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 订单表格 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : orders.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  订单号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  客户信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  订单金额
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  下单时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-600">
                      {order.orderNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.contactName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.contactPhone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-red-600">
                      ¥{order.totalAmount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(order.status)}`}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDetailModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      详情
                    </button>
                    {order.status === "pending" && (
                      <button
                        onClick={() => handleShip(order.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        发货
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">暂无订单</div>
        )}
      </div>

      {/* 分页 */}
      <div className="bg-white rounded-lg shadow px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">共 {total} 条记录</div>
        <div className="flex space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            上一页
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 10)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      </div>

      {/* 订单详情模态框 */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">订单详情</h2>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">订单号</p>
                  <p className="font-medium">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">订单状态</p>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(selectedOrder.status)}`}
                  >
                    {getStatusText(selectedOrder.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">客户姓名</p>
                  <p className="font-medium">{selectedOrder.contactName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">联系电话</p>
                  <p className="font-medium">{selectedOrder.contactPhone}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">收货地址</p>
                <p className="font-medium">{selectedOrder.shippingAddress}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">订单金额</p>
                  <p className="font-bold text-red-600">
                    ¥{selectedOrder.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">下单时间</p>
                  <p className="font-medium">
                    {new Date(selectedOrder.createdAt).toLocaleString("zh-CN")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                关闭
              </button>
              {selectedOrder.status === "pending" && (
                <button
                  onClick={() => handleShip(selectedOrder.id)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  确认发货
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
