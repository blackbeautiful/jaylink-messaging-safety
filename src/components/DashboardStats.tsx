// src/components/DashboardStats.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import { 
  MessageSquare, 
  Phone, 
  BarChart3, 
  Wallet, 
  ChevronUp, 
  ChevronDown,
  Loader2,
  TrendingUp,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: number;
  delay?: number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const StatCard = ({ title, value, icon, change, delay = 0, subtitle, color = 'blue' }: StatCardProps) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
    green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30',
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay * 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-subtle hover-lift"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
          {title}
        </span>
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {subtitle}
            </p>
          )}
          {change !== undefined && (
            <div className="flex items-center">
              <span
                className={cn(
                  "text-sm font-medium flex items-center",
                  isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-gray-500"
                )}
              >
                {isPositive ? (
                  <ChevronUp className="h-4 w-4 mr-1" />
                ) : isNegative ? (
                  <ChevronDown className="h-4 w-4 mr-1" />
                ) : null}
                {Math.abs(change)}%
              </span>
              <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">
                vs last month
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

interface DashboardStatsProps {
  analytics: any;
  balance: any;
  loading: boolean;
}

const DashboardStats = ({ analytics, balance, loading }: DashboardStatsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-subtle flex items-center justify-center h-32"
          >
            <Loader2 className="h-8 w-8 animate-spin text-jaylink-600/30" />
          </div>
        ))}
      </div>
    );
  }
  
  // Extract data from analytics API response
  const totalMessages = analytics?.totalCount || 0;
  const deliveredCount = analytics?.deliveredCount || 0;
  const failedCount = analytics?.failedCount || 0;
  
  // Calculate delivery rate correctly
  const deliveryRate = totalMessages > 0 
    ? Math.round((deliveredCount / totalMessages) * 100)
    : 0;
  
  // Get message type counts
  const voiceCallCount = analytics?.types?.voice || 0;
  const smsCount = analytics?.types?.sms || 0;
  const audioCount = analytics?.types?.audio || 0;
  
  // Use actual balance from balance API response
  const userBalance = balance?.balance || 0;
  const currencySymbol = balance?.currencySymbol || '₦';
  
  // Calculate some additional metrics
  const successRate = totalMessages > 0 
    ? Math.round(((totalMessages - failedCount) / totalMessages) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Messages"
        value={totalMessages.toLocaleString()}
        subtitle={`${smsCount} SMS • ${voiceCallCount} Voice • ${audioCount} Audio`}
        icon={<MessageSquare size={20} />}
        delay={0}
        color="blue"
      />
      
      <StatCard
        title="Delivery Rate"
        value={`${deliveryRate}%`}
        subtitle={`${deliveredCount.toLocaleString()} delivered of ${totalMessages.toLocaleString()}`}
        icon={<TrendingUp size={20} />}
        delay={1}
        color={deliveryRate >= 90 ? "green" : deliveryRate >= 70 ? "orange" : "red"}
      />
      
      <StatCard
        title="Voice Calls"
        value={voiceCallCount.toLocaleString()}
        subtitle={voiceCallCount > 0 ? `${Math.round((voiceCallCount / totalMessages) * 100)}% of total` : "No calls yet"}
        icon={<Phone size={20} />}
        delay={2}
        color="purple"
      />
      
      <StatCard
        title="Account Balance"
        value={`${currencySymbol}${userBalance.toFixed(2)}`}
        subtitle={userBalance < 100 ? "Low balance - consider topping up" : "Available for messaging"}
        icon={<Wallet size={20} />}
        delay={3}
        color={userBalance < 100 ? "red" : userBalance < 500 ? "orange" : "green"}
      />
    </div>
  );
};

export default DashboardStats;