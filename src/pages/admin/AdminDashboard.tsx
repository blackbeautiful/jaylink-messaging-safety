
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CreditCard, DollarSign, FileText, Users } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  // Mock data for the dashboard
  const stats = [
    {
      title: "Total Revenue",
      value: "$15,345.00",
      description: "Current month",
      icon: <DollarSign className="h-5 w-5 text-muted-foreground" />,
      change: "+12.5%",
    },
    {
      title: "Active Users",
      value: "243",
      description: "Total registered",
      icon: <Users className="h-5 w-5 text-muted-foreground" />,
      change: "+5.2%",
    },
    {
      title: "SMS Sent",
      value: "10,453",
      description: "Current month",
      icon: <FileText className="h-5 w-5 text-muted-foreground" />,
      change: "+8.4%",
    },
    {
      title: "Audio Messages",
      value: "1,245",
      description: "Current month",
      icon: <FileText className="h-5 w-5 text-muted-foreground" />,
      change: "+14.8%",
    },
  ];

  const recentTransactions = [
    {
      id: "T12345",
      user: "John Doe",
      amount: "+$50.00",
      date: "2023-05-01",
      type: "Balance Added",
      status: "Completed"
    },
    {
      id: "T12346",
      user: "Jane Smith",
      amount: "-$12.50",
      date: "2023-05-02",
      type: "SMS Messages",
      status: "Completed"
    },
    {
      id: "T12347",
      user: "Robert Johnson",
      amount: "-$25.00",
      date: "2023-05-03",
      type: "Audio Upload",
      status: "Completed"
    },
    {
      id: "T12348",
      user: "Sarah Williams",
      amount: "+$100.00",
      date: "2023-05-04",
      type: "Balance Added",
      status: "Completed"
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of system performance and metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <div className="flex items-center pt-1">
                <span className="text-xs text-green-600">{stat.change}</span>
                <span className="text-xs text-muted-foreground ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link 
              to="/admin/service-costs" 
              className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-md"
            >
              <DollarSign className="mr-2 h-5 w-5 text-muted-foreground" />
              <span>Manage Service Pricing</span>
            </Link>
            <Link 
              to="/admin/balance-management" 
              className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-md"
            >
              <CreditCard className="mr-2 h-5 w-5 text-muted-foreground" />
              <span>Manage User Balances</span>
            </Link>
            <Link 
              to="/admin/transactions" 
              className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-md"
            >
              <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
              <span>View Transactions</span>
            </Link>
            <Link 
              to="/admin/analytics" 
              className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-md"
            >
              <BarChart3 className="mr-2 h-5 w-5 text-muted-foreground" />
              <span>View Analytics</span>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest platform activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{transaction.user}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.type} • {transaction.date}
                    </p>
                  </div>
                  <div className={`font-medium ${transaction.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
