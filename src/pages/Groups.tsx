
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import GroupList from "@/components/groups/GroupList";
import ContactList from "@/components/groups/ContactList";
import AddGroupButton from "@/components/groups/AddGroupButton";
import AddContactButton from "@/components/groups/AddContactButton";
import ImportButton from "@/components/groups/ImportButton";
import ContactSelector, { Contact as SelectorContact } from "@/components/contacts/ContactSelector";
import { useLocation } from "react-router-dom";

// Mock data for the lists
const mockGroups = [
  { id: "1", name: "Customers", description: "Regular customers", contactCount: 125, createdAt: "2023-05-10" },
  { id: "2", name: "Employees", description: "Company staff", contactCount: 42, createdAt: "2023-05-15" },
  { id: "3", name: "Vendors", description: "Service providers", contactCount: 18, createdAt: "2023-05-20" },
];

const mockContacts = [
  { id: "1", name: "John Smith", phone: "+1 (555) 123-4567", email: "john.smith@example.com" },
  { id: "2", name: "Sarah Johnson", phone: "+1 (555) 987-6543", email: "sarah.j@example.com" },
  { id: "3", name: "Michael Brown", phone: "+1 (555) 456-7890", email: "michael.b@example.com" },
];

// Define the internal Contact type that includes an 'added' property
interface Contact extends SelectorContact {
  added: boolean;
}

const Groups = () => {
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState(mockGroups);
  const [contacts, setContacts] = useState(mockContacts);
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handler for contacts selected from ContactSelector
  const handleContactsSelected = (contacts: SelectorContact[]) => {
    // Map the contacts from the selector to your internal Contact type
    const mappedContacts: Contact[] = contacts.map(contact => ({
      ...contact,
      added: false,
    }));
    
    // Now you can use mappedContacts which adheres to your internal Contact type
    setSelectedContacts(mappedContacts);
  };

  // Handle adding a new group
  const handleAddGroup = (name: string, description: string) => {
    const newGroup = {
      id: `group-${Date.now()}`,
      name,
      description,
      contactCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    setGroups([newGroup, ...groups]);
  };

  // Handle adding a new contact
  const handleAddContact = (name: string, phone: string, email: string) => {
    const newContact = {
      id: `contact-${Date.now()}`,
      name,
      phone,
      email,
    };
    
    setContacts([newContact, ...contacts]);
  };

  // Handle importing contacts
  const handleImportContacts = (file: File) => {
    // In a real app, you would parse the file and add the contacts
    console.log("Importing contacts from file:", file.name);
  };

  // Handle deleting a group
  const handleDeleteGroup = (id: string) => {
    setGroups(groups.filter(group => group.id !== id));
  };

  // Handle deleting a contact
  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter(contact => contact.id !== id));
  };

  return (
    <DashboardLayout title="Contact Groups" backLink="/dashboard" currentPath={location.pathname}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Groups</h2>
            <div className="space-x-2">
              <AddGroupButton onAddGroup={handleAddGroup} />
            </div>
          </div>
          <GroupList 
            groups={groups}
            onDeleteGroup={handleDeleteGroup}
          />
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Contacts</h2>
            <div className="space-x-2">
              <AddContactButton onAddContact={handleAddContact} />
              <ImportButton onImport={handleImportContacts} />
            </div>
          </div>
          <ContactList 
            contacts={contacts}
            onDeleteContact={handleDeleteContact}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Groups;
