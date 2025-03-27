
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Phone,
  Upload,
  Settings,
  LogOut,
  User,
  Home,
  BarChart3,
  Wallet,
  LayoutDashboard,
  ArrowLeft,
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Mock data for groups and contacts
const mockGroups = [
  { id: 1, name: "Customers", count: 248, description: "All customer contacts" },
  { id: 2, name: "Team Members", count: 12, description: "Internal staff contacts" },
  { id: 3, name: "Vendors", count: 45, description: "Supplier and vendor contacts" },
  { id: 4, name: "Partners", count: 30, description: "Business partner contacts" },
  { id: 5, name: "Marketing", count: 150, description: "Marketing campaign contacts" },
];

const mockContacts = [
  { id: 1, name: "John Doe", phone: "+2348012345678", email: "john@example.com", group: "Customers" },
  { id: 2, name: "Jane Smith", phone: "+2348023456789", email: "jane@example.com", group: "Customers" },
  { id: 3, name: "Sam Wilson", phone: "+2347034567890", email: "sam@example.com", group: "Team Members" },
  { id: 4, name: "Mary Johnson", phone: "+2349045678901", email: "mary@example.com", group: "Vendors" },
  { id: 5, name: "David Brown", phone: "+2348056789012", email: "david@example.com", group: "Partners" },
];

const Groups = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("groups");

  const sidebarLinks = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { name: "Send SMS", icon: <MessageSquare size={20} />, path: "/send-sms" },
    { name: "Voice Calls", icon: <Phone size={20} />, path: "/voice-calls" },
    { name: "Upload Audio", icon: <Upload size={20} />, path: "/upload-audio" },
    { name: "Analytics", icon: <BarChart3 size={20} />, path: "/analytics" },
    { name: "Balance", icon: <Wallet size={20} />, path: "/balance" },
    { name: "Groups", icon: <Users size={20} />, path: "/groups" },
    { name: "Settings", icon: <Settings size={20} />, path: "/settings" },
  ];

  const filteredGroups = mockGroups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredContacts = mockContacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateGroup = () => {
    toast.success("This feature would create a new contact group");
  };

  const handleImportContacts = () => {
    toast.success("This feature would import contacts from CSV");
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
      >
        <div className="p-6">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-2xl text-jaylink-800 dark:text-white">
              Jay<span className="text-jaylink-600">Link</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {sidebarLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                    link.path === "/groups"
                      ? "bg-jaylink-50 text-jaylink-700 dark:bg-jaylink-900/20 dark:text-jaylink-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className={`mr-3 ${
                    link.path === "/groups"
                      ? "text-jaylink-600 dark:text-jaylink-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}>
                    {link.icon}
                  </span>
                  <span className="font-medium">{link.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-jaylink-100 flex items-center justify-center text-jaylink-600">
              <User size={20} />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                John Doe
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                john@example.com
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full mt-4 border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center justify-center"
          >
            <LogOut size={16} className="mr-2" />
            Sign out
          </Button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 md:ml-64">
        {/* Top navbar */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10"
        >
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="md:hidden mr-2">
                <Users size={20} />
              </Button>
              <Link to="/dashboard" className="inline-flex items-center text-gray-500 hover:text-gray-700 mr-4">
                <ArrowLeft size={18} />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Groups & Contacts
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <Home size={20} />
                </Button>
              </Link>
              <Button variant="ghost" size="icon">
                <Settings size={20} />
              </Button>
              <div className="w-8 h-8 rounded-full bg-jaylink-100 flex items-center justify-center text-jaylink-600 md:hidden">
                <User size={16} />
              </div>
            </div>
          </div>
        </motion.header>

        {/* Page content */}
        <main className="p-4 sm:p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="w-full md:w-1/2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      type="text"
                      placeholder={`Search ${activeTab === "groups" ? "groups" : "contacts"}...`}
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button 
                    onClick={handleCreateGroup}
                    className="bg-jaylink-600 hover:bg-jaylink-700"
                  >
                    <Plus size={16} className="mr-2" />
                    New Group
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleImportContacts}
                  >
                    <Upload size={16} className="mr-2" />
                    Import
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="groups" onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="groups">Groups</TabsTrigger>
                  <TabsTrigger value="contacts">Contacts</TabsTrigger>
                </TabsList>
                
                <TabsContent value="groups">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                      <div className="col-span-full flex justify-center p-8">
                        <Loader2 className="animate-spin h-8 w-8 text-jaylink-600" />
                      </div>
                    ) : filteredGroups.length > 0 ? (
                      filteredGroups.map(group => (
                        <Card key={group.id} className="overflow-hidden">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle>{group.name}</CardTitle>
                                <CardDescription>{group.count} contacts</CardDescription>
                              </div>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal size={18} />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              {group.description}
                            </p>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs"
                                onClick={() => toast.success(`Send SMS to ${group.name} group`)}
                              >
                                <MessageSquare size={14} className="mr-1" />
                                SMS
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs"
                                onClick={() => toast.success(`Voice call to ${group.name} group`)}
                              >
                                <Phone size={14} className="mr-1" />
                                Call
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full text-center p-8">
                        <p className="text-gray-500 dark:text-gray-400">No groups found</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="contacts">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>All Contacts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="flex justify-center p-8">
                          <Loader2 className="animate-spin h-8 w-8 text-jaylink-600" />
                        </div>
                      ) : filteredContacts.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Name</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Phone</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Email</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Group</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredContacts.map(contact => (
                                <tr key={contact.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                                  <td className="py-3 px-4">{contact.name}</td>
                                  <td className="py-3 px-4 font-mono text-sm">{contact.phone}</td>
                                  <td className="py-3 px-4">{contact.email}</td>
                                  <td className="py-3 px-4">{contact.group}</td>
                                  <td className="py-3 px-4 text-right">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8"
                                      onClick={() => toast.success(`Send SMS to ${contact.name}`)}
                                    >
                                      <MessageSquare size={16} />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8"
                                      onClick={() => toast.success(`Call ${contact.name}`)}
                                    >
                                      <Phone size={16} />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center p-8">
                          <p className="text-gray-500 dark:text-gray-400">No contacts found</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Groups;
