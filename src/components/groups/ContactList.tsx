
import { Button } from "@/components/ui/button";
import { Edit, Trash2, User } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface ContactListProps {
  contacts: Contact[];
  onDeleteContact: (id: string) => void;
}

const ContactList = ({ contacts, onDeleteContact }: ContactListProps) => {
  return (
    <div className="space-y-3">
      {contacts.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          No contacts yet. Add your first contact.
        </p>
      ) : (
        contacts.map((contact) => (
          <div
            key={contact.id}
            className="bg-gray-50 dark:bg-gray-700/40 p-3 rounded-lg flex justify-between items-center"
          >
            <div className="flex items-center">
              <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                <User className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {contact.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {contact.phone} {contact.email && `· ${contact.email}`}
                </p>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteContact(contact.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ContactList;
