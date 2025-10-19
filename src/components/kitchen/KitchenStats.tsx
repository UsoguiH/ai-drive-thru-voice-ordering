'use client';

import { motion } from 'framer-motion';
import { Order } from '@/hooks/useWebSocket';
import {
  Clock,
  ChefHat,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface KitchenStatsProps {
  orders: Order[];
}

export function KitchenStats({ orders }: KitchenStatsProps) {
  const pendingOrders = orders.filter(order => order.status === 'pending');
  const inProgressOrders = orders.filter(order => order.status === 'in_progress');
  const readyOrders = orders.filter(order => order.status === 'ready');
  const urgentOrders = orders.filter(order => order.priority === 3);

  // Calculate average time for orders
  const avgOrderTime = orders.length > 0
    ? Math.floor(
        orders.reduce((acc, order) => {
          const created = new Date(order.createdAt).getTime();
          const now = Date.now();
          return acc + (now - created);
        }, 0) / orders.length / 1000 / 60
      )
    : 0;

  const stats = [
    {
      label: 'Pending',
      value: pendingOrders.length,
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      trend: pendingOrders.length > 0 ? 'up' : 'stable'
    },
    {
      label: 'In Progress',
      value: inProgressOrders.length,
      icon: <ChefHat className="w-5 h-5" />,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      trend: 'stable'
    },
    {
      label: 'Ready',
      value: readyOrders.length,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'bg-green-500/20 text-green-400 border-green-500/30',
      trend: readyOrders.length > 0 ? 'up' : 'stable'
    },
    {
      label: 'Urgent',
      value: urgentOrders.length,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'bg-red-500/20 text-red-400 border-red-500/30',
      trend: urgentOrders.length > 0 ? 'up' : 'stable'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`
            p-4 rounded-lg border transition-all duration-200
            ${stat.color}
          `}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-black/20">
              {stat.icon}
            </div>
            {stat.trend === 'up' && (
              <TrendingUp className="w-4 h-4" />
            )}
            {stat.trend === 'down' && (
              <TrendingDown className="w-4 h-4" />
            )}
          </div>
          <div className="text-2xl font-bold">
            {stat.value}
          </div>
          <div className="text-sm opacity-75">
            {stat.label}
          </div>
        </motion.div>
      ))}

      {/* Average Order Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: stats.length * 0.1 }}
        className="col-span-2 md:col-span-4 p-4 rounded-lg border border-gray-700 bg-gray-800/50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {avgOrderTime}m
              </div>
              <div className="text-sm text-gray-400">
                Average Order Time
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-gray-400">
            {orders.length} active orders
          </div>
        </div>
      </motion.div>
    </div>
  );
}