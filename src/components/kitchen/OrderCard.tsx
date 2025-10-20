'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Order, OrderStatus, OrderItem } from '@/hooks/useKitchenOrders';
import { Clock, CheckCircle, ChefHat, AlertCircle, Edit3, Save, X } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  language: 'ar' | 'en';
  onStatusChange: (orderId: number, newStatus: OrderStatus, kitchenNote?: string) => void;
}

const statusConfig = {
  ar: {
    pending: {
      label: 'طلب جديد',
      color: 'bg-blue-500',
      icon: AlertCircle,
      nextAction: 'ابدأ التحضير',
      nextStatus: 'in_progress' as OrderStatus,
    },
    in_progress: {
      label: 'قيد التحضير',
      color: 'bg-amber-500',
      icon: ChefHat,
      nextAction: 'جاهز',
      nextStatus: 'ready' as OrderStatus,
    },
    ready: {
      label: 'جاهز',
      color: 'bg-green-500',
      icon: CheckCircle,
      nextAction: 'مكتمل',
      nextStatus: 'completed' as OrderStatus,
    },
    completed: {
      label: 'مكتمل',
      color: 'bg-gray-400',
      icon: CheckCircle,
      nextAction: '',
      nextStatus: 'completed' as OrderStatus,
    },
  },
  en: {
    pending: {
      label: 'New Order',
      color: 'bg-blue-500',
      icon: AlertCircle,
      nextAction: 'Start Preparing',
      nextStatus: 'in_progress' as OrderStatus,
    },
    in_progress: {
      label: 'Preparing',
      color: 'bg-amber-500',
      icon: ChefHat,
      nextAction: 'Mark Ready',
      nextStatus: 'ready' as OrderStatus,
    },
    ready: {
      label: 'Ready',
      color: 'bg-green-500',
      icon: CheckCircle,
      nextAction: 'Complete',
      nextStatus: 'completed' as OrderStatus,
    },
    completed: {
      label: 'Completed',
      color: 'bg-gray-400',
      icon: CheckCircle,
      nextAction: '',
      nextStatus: 'completed' as OrderStatus,
    },
  },
};

export function OrderCard({ order, language, onStatusChange }: OrderCardProps) {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [kitchenNote, setKitchenNote] = useState(order.kitchenNote || '');
  const [tempNote, setTempNote] = useState(order.kitchenNote || '');

  const config = statusConfig[language]?.[order.status];
  if (!config) {
    console.error(`No config found for status: ${order.status}, language: ${language}`);
    return null;
  }
  const Icon = config.icon;

  const timeSince = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
  const timeLabel = language === 'ar' ? `منذ ${timeSince} د` : `${timeSince}m ago`;

  const handleStatusChange = () => {
    if (order.status !== 'completed') {
      onStatusChange(order.id, config.nextStatus, kitchenNote);
    }
  };

  const handleNoteSave = () => {
    setKitchenNote(tempNote);
    setIsEditingNote(false);
    onStatusChange(order.id, order.status, tempNote);
  };

  const handleNoteCancel = () => {
    setTempNote(kitchenNote);
    setIsEditingNote(false);
  };

  // Priority badge colors
  const priorityColors = {
    1: 'bg-gray-200 text-gray-700',
    2: 'bg-yellow-200 text-yellow-800',
    3: 'bg-red-200 text-red-800'
  };

  const priorityLabels = {
    1: language === 'ar' ? 'عادي' : 'Normal',
    2: language === 'ar' ? 'عالي' : 'High',
    3: language === 'ar' ? 'عاجل' : 'Urgent'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: -100 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="p-6 bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 relative overflow-hidden">
        {/* Animated background gradient */}
        <motion.div
          className={`absolute top-0 left-0 right-0 h-1 ${config.color}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        />

        {/* Priority Badge */}
        {order.priority > 1 && (
          <motion.div
            className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium ${priorityColors[order.priority]}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 500, damping: 25 }}
          >
            {priorityLabels[order.priority]}
          </motion.div>
        )}

        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <motion.h3
                className="text-gray-900 font-medium"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.05 }}
              >
                {language === 'ar' ? `طلب #${order.orderNumber}` : `Order #${order.orderNumber}`}
              </motion.h3>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 25 }}
              >
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${config.color}`}>
                  <Icon className="w-3 h-3" />
                  {config.label}
                </div>
              </motion.div>
            </div>
            <motion.p
              className="text-gray-500 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {order.customerNote || (language === 'ar' ? 'عميل جديد' : 'New Customer')}
            </motion.p>
          </div>
          <motion.div
            className="flex items-center gap-1 text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <Clock className="w-4 h-4" />
            <span className="text-sm">{timeLabel}</span>
          </motion.div>
        </div>

        <div className="space-y-2 mb-4">
          {order.items.map((item: OrderItem, index: number) => (
            <motion.div
              key={index}
              className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 font-medium">{item.quantity}x</span>
                  <span className="text-gray-700">{item.name}</span>
                  {item.nameAr && (
                    <span className="text-gray-500 text-sm">({item.nameAr})</span>
                  )}
                </div>
                {item.customizations && item.customizations.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1 ml-8">
                    {item.customizations.join(', ')}
                  </p>
                )}
              </div>
              <div className="text-gray-900 font-medium">
                {(item.price * item.quantity).toFixed(2)} ريال
              </div>
            </motion.div>
          ))}
        </div>

        {/* Kitchen Notes Section */}
        <div className="mb-4">
          {isEditingNote ? (
            <div className="space-y-2">
              <textarea
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
                placeholder={language === 'ar' ? 'أضف ملاحظات المطبخ...' : 'Add kitchen notes...'}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNoteSave();
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 transition-colors"
                >
                  <Save className="w-3 h-3" />
                  {language === 'ar' ? 'حفظ' : 'Save'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNoteCancel();
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded-lg text-xs hover:bg-gray-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <div className="flex-1">
                {kitchenNote ? (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                    <strong className="text-orange-600">
                      {language === 'ar' ? 'المطبخ:' : 'Kitchen:'}
                    </strong> {kitchenNote}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    {language === 'ar' ? 'لا توجد ملاحظات' : 'No notes'}
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingNote(true);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <motion.div
          className="flex items-center justify-between pt-4 border-t border-gray-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-lg font-bold text-gray-900">
            {order.total.toFixed(2)} ريال
          </div>
          {order.status !== 'completed' && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={handleStatusChange}
                className={`
                  px-4 py-2 rounded-lg font-medium text-white text-sm transition-all duration-200
                  ${order.status === 'pending' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/30' : ''}
                  ${order.status === 'in_progress' ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/30' : ''}
                  ${order.status === 'ready' ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-emerald-500/30' : ''}
                `}
              >
                {config.nextAction}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}