import { motion } from "framer-motion";
import { 
  MessageSquare, 
  Phone, 
  BarChart3, 
  Wallet, 
  ChevronUp, 
  ChevronDown,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: number;
  delay?: number;
}

const StatCard = ({ title, value, icon, change, delay = 0 }: StatCardProps) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

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
        <div className="text-jaylink-600 dark:text-jaylink-400 bg-jaylink-50 dark:bg-jaylink-900/30 p-2 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {value}
          </h3>
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
                vs last week
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
  loading: boolean;
}

const DashboardStats = ({ analytics, loading }: DashboardStatsProps) => {
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
  
  // Default values in case analytics isn't loaded yet
  const totalMessages = analytics?.totalCount || 0;
  const deliveryRate = analytics?.deliveryRate || 0;
  const voiceCallCount = analytics?.types?.voice || 0;
  const balance = 0; // This would come from a different API call
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Messages"
        value={totalMessages.toString()}
        icon={<MessageSquare size={20} />}
        delay={0}
      />
      <StatCard
        title="Voice Calls"
        value={voiceCallCount.toString()}
        icon={<Phone size={20} />}
        delay={1}
      />
      <StatCard
        title="Delivery Rate"
        value={`${deliveryRate}%`}
        icon={<BarChart3 size={20} />}
        delay={2}
      />
      <StatCard
        title="Balance"
        value={`$${balance.toFixed(2)}`}
        icon={<Wallet size={20} />}
        delay={3}
      />
    </div>
  );
};

export default DashboardStats;