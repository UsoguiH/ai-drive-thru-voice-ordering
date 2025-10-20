'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChefHat, Clock, CheckCircle, TrendingUp, Languages } from 'lucide-react';
import { useKitchenOrders, Order, OrderStatus } from '@/hooks/useKitchenOrders';
import { OrderCard } from './OrderCard';
import { Button } from '@/components/ui/button';

type Language = 'ar' | 'en';

const translations = {
  ar: {
    title: 'لوحة تحكم المطبخ',
    subtitle: 'إدارة طلبات المطعم في الوقت الفعلي',
    liveUpdates: 'تحديثات مباشرة',
    newOrders: 'طلبات جديدة',
    preparing: 'قيد التحضير',
    ready: 'جاهز',
    completedToday: 'مكتمل اليوم',
    allActive: 'جميع النشطة',
    new: 'جديد',
    noOrdersTitle: 'لا توجد طلبات هنا',
    noOrdersDesc: 'جميع الطلبات منتهية! ستظهر الطلبات الجديدة هنا.',
    newOrder: 'طلب جديد رقم',
    from: 'من',
    startedPreparing: 'بدأ تحضير الطلب رقم',
    orderReady: 'الطلب رقم جاهز للاستلام!',
    orderCompleted: 'الطلب رقم مكتمل',
    pending: 'معلق',
    in_progress: 'قيد التحضير',
    completed: 'مكتمل',
  },
  en: {
    title: 'Kitchen Dashboard',
    subtitle: 'Real-time order management',
    liveUpdates: 'Live Updates',
    newOrders: 'New Orders',
    preparing: 'Preparing',
    ready: 'Ready',
    completedToday: 'Completed Today',
    allActive: 'All Active',
    new: 'New',
    noOrdersTitle: 'No orders here',
    noOrdersDesc: 'All caught up! New orders will appear here.',
    newOrder: 'New order #',
    from: 'from',
    startedPreparing: 'Started preparing order #',
    orderReady: 'Order #',
    orderReadySuffix: ' is ready for pickup!',
    orderCompleted: 'Order #',
    orderCompletedSuffix: ' completed',
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
  },
};

// Status mapping for our order system
const statusMapping = {
  pending: 'new' as OrderStatus,
  in_progress: 'preparing' as OrderStatus,
  ready: 'ready' as OrderStatus,
  completed: 'completed' as OrderStatus,
};

// Reverse mapping for display
const reverseStatusMapping = {
  new: 'pending',
  preparing: 'in_progress',
  ready: 'ready',
  completed: 'completed',
};

export function KitchenDisplaySystem({ language }: { language: Language }) {
  const {
    orders,
    loading,
    error,
    refetch,
    updateOrderStatus
  } = useKitchenOrders();

  const [activeTab, setActiveTab] = useState('all');

  const t = translations[language];
  const isRTL = language === 'ar';

  // Sort orders by priority and creation time
  const sortedOrders = [...orders].sort((a, b) => {
    // First by priority (3=urgent, 2=high, 1=normal)
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    // Then by creation time
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Filter orders based on active tab
  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'new':
        return sortedOrders.filter(order => order.status === 'pending');
      case 'preparing':
        return sortedOrders.filter(order => order.status === 'in_progress');
      case 'ready':
        return sortedOrders.filter(order => order.status === 'ready');
      default:
        return sortedOrders.filter(o => o.status !== 'completed');
    }
  };

  const filteredOrders = getFilteredOrders();

  // Calculate stats
  const stats = {
    new: sortedOrders.filter(order => order.status === 'pending').length,
    preparing: sortedOrders.filter(order => order.status === 'in_progress').length,
    ready: sortedOrders.filter(order => order.status === 'ready').length,
    completed: sortedOrders.filter(order => order.status === 'completed').length,
  };

  // Handle order status change
  const handleStatusChange = async (orderId: number, newStatus: OrderStatus, kitchenNote?: string) => {
    try {
      const success = await updateOrderStatus(orderId, newStatus, kitchenNote);
      if (!success) {
        console.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" dir={isRTL ? 'rtl' : 'ltr'}>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0, duration: 0.3 }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">{t.newOrders}</p>
                <p className="text-3xl font-bold">{stats.new}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-200" />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">{t.preparing}</p>
                <p className="text-3xl font-bold">{stats.preparing}</p>
              </div>
              <ChefHat className="w-8 h-8 text-amber-200" />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">{t.ready}</p>
                <p className="text-3xl font-bold">{stats.ready}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">{t.completedToday}</p>
                <p className="text-3xl font-bold">{stats.completed}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
          </motion.div>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-2"
          >
            <span className="text-red-200">{error}</span>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 p-1 mb-6 rounded-xl shadow-lg">
            <div className="flex space-x-1">
              {[
                { id: 'all', label: t.allActive },
                { id: 'new', label: `${t.new} (${stats.new})` },
                { id: 'preparing', label: `${t.preparing} (${stats.preparing})` },
                { id: 'ready', label: `${t.ready} (${stats.ready})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.id === 'new' && (
                    <motion.span
                      key={`new-${stats.new}`}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      {tab.label}
                    </motion.span>
                  )}
                  {tab.id === 'preparing' && (
                    <motion.span
                      key={`preparing-${stats.preparing}`}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      {tab.label}
                    </motion.span>
                  )}
                  {tab.id === 'ready' && (
                    <motion.span
                      key={`ready-${stats.ready}`}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      {tab.label}
                    </motion.span>
                  )}
                  {tab.id === 'all' && tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Display */}
          <AnimatePresence mode="popLayout">
            {filteredOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="text-center py-16"
              >
                <motion.div
                  className="bg-gradient-to-br from-gray-50 to-gray-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <CheckCircle className="w-10 h-10 text-gray-400" />
                </motion.div>
                <h3 className="text-gray-900 dark:text-white mb-2">{t.noOrdersTitle}</h3>
                <p className="text-gray-500 dark:text-gray-400">{t.noOrdersDesc}</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    language={language}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}