import { useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users } from "lucide-react";
import GroupList from "@/components/groups/GroupList";
import ContactList from "@/components/groups/ContactList";
import AddGroupButton from "@/components/groups/AddGroupButton";
import AddContactButton from "@/components/groups/AddContactButton";
import ImportButton from "@/components/groups/ImportButton";
import ContactSelector, { Contact as SelectorContact } from "@/components/contacts/ContactSelector";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Group } from "@/components/groups/GroupSelector";

// Define a compatible Contact interface for use in this component
interface Contact extends SelectorContact {
  added?: boolean;
}

interface GroupData {
  id: string;
  name: string;
  description: string;
  members: number;
  created: string;
}

const mockGroups: GroupData[] = [
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
  },
  {
    id: "2",
    name: "Sarah Johnson",
    phone: "+1 (555) 987-6543",
    email: "sarah.j@example.com",
  },
  {
    id: "3",
    name: "Michael Brown",
    phone: "+1 (555) 456-7890",
    email: "michael.b@example.com",
  },
  {
    id: "4",
    name: "Emma Wilson",
    phone: "+1 (555) 789-0123",
    email: "emma.w@example.com",
  },
  {
    id: "5",
    name: "David Lee",
    phone: "+1 (555) 234-5678",
    email: "david.lee@example.com",
  },
];

const Groups = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [groups, setGroups] = useState<GroupData[]>(mockGroups);
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isAddingContactsToGroup, setIsAddingContactsToGroup] = useState(false);
  const isMobile = useIsMobile();

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddGroup = (name: string, description: string) => {
    if (!name) {
      toast("Group name is required");
      return;
    }

    const newGroup: GroupData = {
      id: Date.now().toString(),
      name,
      description,
      members: 0,
      created: new Date().toISOString().split("T")[0],
    };

    setGroups([...groups, newGroup]);
    toast(`Group "${name}" has been created`);
  };

  const handleAddContact = (name: string, phone: string, email: string) => {
    if (!name || !phone) {
      toast("Name and phone number are required");
      return;
    }

    if (!phone.match(/^\+?[0-9\s\-()]+$/)) {
      toast("Please enter a valid phone number");
      return;
    }

    const newContact: Contact = {
      id: Date.now().toString(),
      name,
      phone,
      email,
    };

    setContacts([...contacts, newContact]);
    toast(`Contact "${name}" has been added`);
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups(groups.filter(group => group.id !== groupId));
    toast("The group has been successfully removed");
  };

  const handleDeleteContact = (contactId: string) => {
    setContacts(contacts.filter(contact => contact.id !== contactId));
    toast("The contact has been successfully removed");
  };

  const handleImportContacts = () => {
    toast("Your contacts are being imported. This may take a moment.");
    
    // Simulate import
    setTimeout(() => {
      toast("25 contacts were successfully imported");
    }, 2000);
  };

  const handleContactsSelected = (selectedContacts: SelectorContact[]) => {
    if (selectedGroupId) {
      const groupToUpdate = groups.find(g => g.id === selectedGroupId);
      
      if (groupToUpdate) {
        // Mark these contacts as added for the UI
        const contactsWithAdded = selectedContacts.map(c => ({ ...c, added: true }));
        
        // In a real app, we would have a many-to-many relationship for contacts in groups
        // For now, we'll just update the count
        const updatedGroups = groups.map(g => {
          if (g.id === selectedGroupId) {
            return { ...g, members: g.members + selectedContacts.length };
          }
          return g;
        });
        
        setGroups(updatedGroups);
        toast(`Added ${selectedContacts.length} contacts to "${groupToUpdate.name}" group`);
        setIsAddingContactsToGroup(false);
        setSelectedGroupId(null);
      }
    }
  };

  const handleAddToGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setIsAddingContactsToGroup(true);
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
              <AddGroupButton onAddGroup={handleAddGroup} />
              <AddContactButton onAddContact={handleAddContact} />
              <ImportButton onImport={handleImportContacts} />
            </div>
          </div>
          
          {/* Contacts selection for adding to group */}
          {isAddingContactsToGroup && selectedGroupId && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Add Contacts to Group</CardTitle>
                <CardDescription>
                  Select contacts to add to {groups.find(g => g.id === selectedGroupId)?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContactSelector
                  contacts={contacts}
                  onContactsSelected={handleContactsSelected}
                  buttonText="Select Contacts to Add"
                />
                <div className="mt-4 flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAddingContactsToGroup(false);
                      setSelectedGroupId(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Tabs for groups and contacts */}
          <Tabs defaultValue="groups" className="w-full">
            <TabsList className="mb-6 overflow-x-auto flex w-full max-w-full">
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
                  <GroupList 
                    groups={filteredGroups} 
                    onDeleteGroup={handleDeleteGroup}
                    onAddContacts={handleAddToGroup}
                  />
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
                  <ContactList 
                    contacts={filteredContacts} 
                    onDeleteContact={handleDeleteContact}
                  />
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
