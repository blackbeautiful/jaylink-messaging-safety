
// Import Contact from the contacts/ContactSelector component
import ContactSelector, { Contact as SelectorContact } from "@/components/contacts/ContactSelector";

// Define the internal Contact type that includes an 'added' property
interface Contact extends SelectorContact {
  added: boolean;
}

// Then in your component where you handle contacts selected from ContactSelector:
const handleContactsSelected = (contacts: SelectorContact[]) => {
  // Map the contacts from the selector to your internal Contact type
  const mappedContacts: Contact[] = contacts.map(contact => ({
    ...contact,
    added: false,
  }));
  
  // Now you can use mappedContacts which adheres to your internal Contact type
  setSelectedContacts(mappedContacts);
};
