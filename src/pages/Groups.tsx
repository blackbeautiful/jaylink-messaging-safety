
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import GroupList from "@/components/groups/GroupList";
import ContactList from "@/components/groups/ContactList";
import AddGroupButton from "@/components/groups/AddGroupButton";
import AddContactButton from "@/components/groups/AddContactButton";
import ImportButton from "@/components/groups/ImportButton";
import ContactSelector, { Contact as SelectorContact } from "@/components/contacts/ContactSelector";

// Define the internal Contact type that includes an 'added' property
interface Contact extends SelectorContact {
  added: boolean;
}

const Groups = () => {
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  
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

  return (
    <DashboardLayout title="Contact Groups" backLink="/dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Groups</h2>
            <div className="space-x-2">
              <AddGroupButton />
            </div>
          </div>
          <GroupList />
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Contacts</h2>
            <div className="space-x-2">
              <AddContactButton />
              <ImportButton />
            </div>
          </div>
          <ContactList />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Groups;
