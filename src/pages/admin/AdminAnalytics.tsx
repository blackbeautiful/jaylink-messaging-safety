
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminAnalytics = () => {
  // Mock data for charts
  const revenueData = [
    { name: "Jan", revenue: 4000 },
    { name: "Feb", revenue: 3000 },
    { name: "Mar", revenue: 5000 },
    { name: "Apr", revenue: 7000 },
    { name: "May", revenue: 6000 },
    { name: "Jun", revenue: 8000 },
  ];

  const serviceUsageData = [
    { name: "SMS", value: 45 },
    { name: "Audio Msg", value: 25 },
    { name: "TTS", value: 15 },
    { name: "Voice Call", value: 15 },
  ];

  const userActivityData = [
    { date: "2023-05-01", active: 120, new: 15 },
    { date: "2023-05-02", active: 132, new: 12 },
    { date: "2023-05-03", active: 145, new: 18 },
    { date: "2023-05-04", active: 155, new: 22 },
    { date: "2023-05-05", active: 165, new: 20 },
    { date: "2023-05-06", active: 180, new: 25 },
    { date: "2023-05-07", active: 190, new: 30 },
  ];

  const serviceComparisonData = [
    { name: "Jan", sms: 4000, audio: 2400, tts: 1800, voice: 1000 },
    { name: "Feb", sms: 3500, audio: 2100, tts: 1600, voice: 900 },
    { name: "Mar", sms: 4500, audio: 2700, tts: 1900, voice: 1200 },
    { name: "Apr", sms: 5000, audio: 3100, tts: 2200, voice: 1500 },
    { name: "May", sms: 4800, audio: 3000, tts: 2000, voice: 1300 },
    { name: "Jun", sms: 5500, audio: 3500, tts: 2500, voice: 1800 },
  ];

  // Colors for charts
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          Platform usage, revenue and performance metrics
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="usage">Service Usage</TabsTrigger>
          <TabsTrigger value="users">User Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={revenueData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Service Usage Distribution</CardTitle>
                <CardDescription>Usage breakdown by service type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceUsageData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {serviceUsageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, "Usage"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>User Activity Trends</CardTitle>
              <CardDescription>Active and new users over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={userActivityData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="active" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="new" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Revenue by service type over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={serviceComparisonData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                    <Legend />
                    <Bar dataKey="sms" name="SMS" fill="#8884d8" />
                    <Bar dataKey="audio" name="Audio Messages" fill="#82ca9d" />
                    <Bar dataKey="tts" name="TTS Conversion" fill="#ffc658" />
                    <Bar dataKey="voice" name="Voice Calls" fill="#ff8042" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Usage Comparison</CardTitle>
              <CardDescription>Usage metrics for different services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={serviceComparisonData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sms" name="SMS" stroke="#8884d8" />
                    <Line type="monotone" dataKey="audio" name="Audio Messages" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="tts" name="TTS Conversion" stroke="#ffc658" />
                    <Line type="monotone" dataKey="voice" name="Voice Calls" stroke="#ff8042" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Growth Trend</CardTitle>
              <CardDescription>Active and new user statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={userActivityData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="active" stroke="#8884d8" activeDot={{ r: 8 }} name="Active Users" />
                    <Line type="monotone" dataKey="new" stroke="#82ca9d" name="New Users" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;
