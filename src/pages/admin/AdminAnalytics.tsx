
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  TooltipProps 
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const revenueData = [
  { name: 'Jan', revenue: 5000, transactions: 240 },
  { name: 'Feb', revenue: 6200, transactions: 280 },
  { name: 'Mar', revenue: 8100, transactions: 350 },
  { name: 'Apr', revenue: 7500, transactions: 310 },
  { name: 'May', revenue: 9200, transactions: 390 },
  { name: 'Jun', revenue: 8700, transactions: 360 },
];

const serviceUsageData = [
  { name: 'SMS', value: 45 },
  { name: 'Voice Calls', value: 25 },
  { name: 'TTS', value: 15 },
  { name: 'Audio Storage', value: 10 },
  { name: 'Other', value: 5 },
];

const userActivityData = [
  { name: '00:00', active: 120 },
  { name: '03:00', active: 80 },
  { name: '06:00', active: 60 },
  { name: '09:00', active: 180 },
  { name: '12:00', active: 240 },
  { name: '15:00', active: 260 },
  { name: '18:00', active: 290 },
  { name: '21:00', active: 190 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState("6m");
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Platform usage and revenue analytics.
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="1m">Last month</SelectItem>
            <SelectItem value="3m">Last 3 months</SelectItem>
            <SelectItem value="6m">Last 6 months</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
            <div className="text-3xl font-bold">$44,700.00</div>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={revenueData}>
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0284c7" 
                  strokeWidth={2} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Users</CardTitle>
            <CardDescription>Growth over time</CardDescription>
            <div className="text-3xl font-bold">1,245</div>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={revenueData}>
                <Line 
                  type="monotone" 
                  dataKey="transactions" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Current active users</CardDescription>
            <div className="text-3xl font-bold">138</div>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={userActivityData}>
                <Line 
                  type="monotone" 
                  dataKey="active" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Transactions</CardTitle>
            <CardDescription>
              Monthly comparison of revenue and transaction count
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#0284c7" name="Revenue ($)" />
                <Bar yAxisId="right" dataKey="transactions" fill="#10b981" name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Service Usage Distribution</CardTitle>
            <CardDescription>
              Breakdown of service usage by type
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceUsageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {serviceUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
