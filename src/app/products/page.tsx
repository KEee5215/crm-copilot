"use client";

import { useState, useEffect } from "react";
import { productApi } from "@/lib/api";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category: "other",
    isActive: true,
  });

  useEffect(() => {
    loadProducts();
  }, [page, searchTerm, selectedCategory]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const category = selectedCategory === "all" ? "" : selectedCategory;
      const result = await productApi.getProducts(page, 10, searchTerm, category);
      if (result.success && result.data) {
        setProducts(result.data);
        setTotal(result.total || 0);
      }
    } catch (error) {
      console.error("加载商品失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setPage(1);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock: product.stock,
      category: product.category,
      isActive: product.isActive,
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setFormData({
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category: "other",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedProduct) {
        const result = await productApi.updateProduct({
          id: selectedProduct.id,
          name: formData.name,
          description: formData.description,
          price: formData.price,
          stock: formData.stock,
          category: formData.category,
          isActive: formData.isActive,
        });
        if (result.success) {
          alert("商品更新成功");
          loadProducts();
          setIsModalOpen(false);
        } else {
          alert(result.error || "更新失败");
        }
      } else {
        const result = await productApi.createProduct(formData);
        if (result.success) {
          alert("商品创建成功");
          loadProducts();
          setIsModalOpen(false);
        } else {
          alert(result.error || "创建失败");
        }
      }
    } catch (error) {
      console.error("保存商品失败:", error);
      alert("保存失败");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个商品吗？")) return;
    try {
      const result = await productApi.deleteProduct(id);
      if (result.success) {
        alert("商品删除成功");
        loadProducts();
      } else {
        alert(result.error || "删除失败");
      }
    } catch (error) {
      console.error("删除商品失败:", error);
      alert("删除失败");
    }
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      electronics: "电子产品",
      clothing: "服装",
      food: "食品",
      books: "书籍",
      other: "其他",
    };
    return names[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      electronics: "bg-blue-100 text-blue-800",
      clothing: "bg-purple-100 text-purple-800",
      food: "bg-green-100 text-green-800",
      books: "bg-yellow-100 text-yellow-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">商品管理</h1>
          <p className="text-gray-500 mt-1">管理商品信息和库存</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 添加商品
        </button>
      </div>

      {/* 筛选和搜索 */}
      <div className="bg-white rounded-lg shadow p-4 flex space-x-4">
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部类别</option>
          <option value="electronics">电子产品</option>
          <option value="clothing">服装</option>
          <option value="food">食品</option>
          <option value="books">书籍</option>
          <option value="other">其他</option>
        </select>
        <input
          type="text"
          placeholder="搜索商品..."
          value={searchTerm}
          onChange={handleSearch}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 商品卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-gray-500">加载中...</div>
        ) : products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">商品图片</span>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryColor(product.category)}`}>
                    {getCategoryName(product.category)}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xl font-bold text-red-600">¥{product.price.toLocaleString()}</span>
                  <span className="text-sm text-gray-500">库存：{product.stock}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${product.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {product.isActive ? "上架中" : "已下架"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(product.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-8 text-center text-gray-500">暂无商品</div>
        )}
      </div>

      {/* 分页 */}
      <div className="bg-white rounded-lg shadow px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          共 {total} 条记录
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            上一页
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 10)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      </div>

      {/* 模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {selectedProduct ? "编辑商品" : "添加商品"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  商品名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  商品描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    价格
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    库存
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  类别
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="electronics">电子产品</option>
                  <option value="clothing">服装</option>
                  <option value="food">食品</option>
                  <option value="books">书籍</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">上架销售</span>
                </label>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
