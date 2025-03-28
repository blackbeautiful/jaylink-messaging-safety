
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Upload, Edit, Trash2, MoreVertical, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  added: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  members: number;
  created: string;
}

const mockGroups: Group[] = [
  {
    id: "1",
    name: "Customers",
    description: "All paying customers",
    members: 128,
    created: "2023-05-10",
  },
  {
    id: "2",
    name: "Employees",
    description: "Internal staff members",
    members: 42,
    created: "2023-04-15",
  },
  {
    id: "3",
    name: "Subscribers",
    description: "Newsletter subscribers",
    members: 2156,
    created: "2023-06-20",
  },
  {
    id: "4",
    name: "VIP Clients",
    description: "Premium customers",
    members: 17,
    created: "2023-07-05",
  },
  {
    id: "5",
    name: "Vendors",
    description: "Partner companies",
    members: 34,
    created: "2023-08-12",
  },
];

const mockContacts: Contact[] = [
  {
    id: "1",
    name: "John Smith",
    phone: "+1 (555) 123-4567",
    email: "john.smith@example.com",
    added: "2023-05-15",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    phone: "+1 (555) 987-6543",
    email: "sarah.j@example.com",
    added: "2023-06-10",
  },
  {
    id: "3",
    name: "Michael Brown",
    phone: "+1 (555) 456-7890",
    email: "michael.b@example.com",
    added: "2023-06-15",
  },
  {
    id: "4",
    name: "Emma Wilson",
    phone: "+1 (555) 789-0123",
    email: "emma.w@example.com",
    added: "2023-07-01",
  },
  {
    id: "5",
    name: "David Lee",
    phone: "+1 (555) 234-5678",
    email: "david.lee@example.com",
    added: "2023-07-12",
  },
];

const Groups = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [groups, setGroups] = useState<Group[]>(mockGroups);
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openAddGroup, setOpenAddGroup] = useState(false);
  const [openAddContact, setOpenAddContact] = useState(false);

  const handleAddGroup = () => {
    if (!newGroupName) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Group name is required",
      });
      return;
    }

    const newGroup: Group = {
      id: Date.now().toString(),
      name: newGroupName,
      description: newGroupDesc,
      members: 0,
      created: new Date().toISOString().split("T")[0],
    };

    setGroups([...groups, newGroup]);
    setNewGroupName("");
    setNewGroupDesc("");
    setOpenAddGroup(false);

    toast({
      title: "Success",
      description: `Group "${newGroupName}" has been created`,
    });
  };

  const handleAddContact = () => {
    if (!newContactName || !newContactPhone) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Name and phone number are required",
      });
      return;
    }

    if (!newContactPhone.match(/^\+?[0-9\s\-()]+$/)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid phone number",
      });
      return;
    }

    const newContact: Contact = {
      id: Date.now().toString(),
      name: newContactName,
      phone: newContactPhone,
      email: newContactEmail,
      added: new Date().toISOString().split("T")[0],
    };

    setContacts([...contacts, newContact]);
    setNewContactName("");
    setNewContactPhone("");
    setNewContactEmail("");
    setOpenAddContact(false);

    toast({
      title: "Success",
      description: `Contact "${newContactName}" has been added`,
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups(groups.filter(group => group.id !== groupId));
    toast({
      title: "Group deleted",
      description: "The group has been successfully removed",
    });
  };

  const handleDeleteContact = (contactId: string) => {
    setContacts(contacts.filter(contact => contact.id !== contactId));
    toast({
      title: "Contact deleted",
      description: "The contact has been successfully removed",
    });
  };

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImportContacts = () => {
    toast({
      title: "Import started",
      description: "Your contacts are being imported. This may take a moment.",
    });
    
    // Simulate import
    setTimeout(() => {
      toast({
        title: "Import complete",
        description: "25 contacts were successfully imported",
      });
    }, 2000);
  };

  return (
    <DashboardLayout title="Contact Groups" backLink="/dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex flex-col space-y-6">
          {/* Search and action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="w-full sm:w-auto">
              <Input
                placeholder="Search groups or contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Dialog open={openAddGroup} onOpenChange={setOpenAddGroup}>
                <DialogTrigger asChild>
                  <Button className="bg-jaylink-600 hover:bg-jaylink-700 w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    New Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                    <DialogDescription>
                      Add a new contact group for your messaging campaigns.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="group-name">Group Name</Label>
                      <Input
                        id="group-name"
                        placeholder="e.g., Customers, Employees"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="group-description">Description (Optional)</Label>
                      <Textarea
                        id="group-description"
                        placeholder="Enter a description for this group"
                        value={newGroupDesc}
                        onChange={(e) => setNewGroupDesc(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenAddGroup(false)}>Cancel</Button>
                    <Button className="bg-jaylink-600" onClick={handleAddGroup}>Create Group</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog open={openAddContact} onOpenChange={setOpenAddContact}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Users className="mr-2 h-4 w-4" />
                    Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Contact</DialogTitle>
                    <DialogDescription>
                      Add a new contact to your contact list.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Name</Label>
                      <Input
                        id="contact-name"
                        placeholder="Full Name"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Phone Number</Label>
                      <Input
                        id="contact-phone"
                        placeholder="+1 (555) 123-4567"
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email (Optional)</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="email@example.com"
                        value={newContactEmail}
                        onChange={(e) => setNewContactEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenAddContact(false)}>Cancel</Button>
                    <Button className="bg-jaylink-600" onClick={handleAddContact}>Add Contact</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" onClick={handleImportContacts}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </div>
          </div>
          
          {/* Tabs for groups and contacts */}
          <Tabs defaultValue="groups" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="groups" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Groups
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                All Contacts
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="groups" className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Contact Groups</CardTitle>
                  <CardDescription>Manage your contact groups for messaging campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <ScrollArea className="h-[400px] w-full sm:h-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden md:table-cell">Description</TableHead>
                            <TableHead className="text-center">Members</TableHead>
                            <TableHead className="hidden sm:table-cell">Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredGroups.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                                No groups found. Create a new group to get started.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredGroups.map((group) => (
                              <TableRow key={group.id}>
                                <TableCell className="font-medium">{group.name}</TableCell>
                                <TableCell className="hidden md:table-cell">{group.description}</TableCell>
                                <TableCell className="text-center">{group.members}</TableCell>
                                <TableCell className="hidden sm:table-cell">{group.created}</TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">Actions</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Group
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Download className="mr-2 h-4 w-4" />
                                        Export Contacts
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteGroup(group.id)} className="text-red-600">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Group
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="contacts" className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>All Contacts</CardTitle>
                  <CardDescription>View and manage all your contacts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <ScrollArea className="h-[400px] w-full sm:h-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead className="hidden md:table-cell">Email</TableHead>
                            <TableHead className="hidden sm:table-cell">Added</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredContacts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                                No contacts found. Add a new contact to get started.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredContacts.map((contact) => (
                              <TableRow key={contact.id}>
                                <TableCell className="font-medium">{contact.name}</TableCell>
                                <TableCell>{contact.phone}</TableCell>
                                <TableCell className="hidden md:table-cell">{contact.email}</TableCell>
                                <TableCell className="hidden sm:table-cell">{contact.added}</TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">Actions</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Contact
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteContact(contact.id)} className="text-red-600">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Contact
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Groups;
