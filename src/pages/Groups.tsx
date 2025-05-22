/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/Groups.tsx
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Plus, Users, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EnhancedGroupList from "@/components/groups/EnhancedGroupList";
import EnhancedContactList from "@/components/groups/EnhancedContactList";
import AddGroupDialog from "@/components/groups/AddGroupDialog";
import AddContactDialog from "@/components/groups/AddContactDialog";
import ImportContactsDialog from "@/components/groups/ImportContactsDialog";
import { api } from "@/contexts/AuthContext";

// Types based on backend API responses
interface Group {
  id: string;
  name: string;
  description?: string;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const Groups = () => {
  const location = useLocation();
  
  // State management
  const [activeTab, setActiveTab] = useState("groups");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Groups state
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsPagination, setGroupsPagination] = useState<PaginationInfo>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 20,
    hasNext: false,
    hasPrev: false,
  });
  const [groupsSearch, setGroupsSearch] = useState("");
  const [groupsLoading, setGroupsLoading] = useState(false);
  
  // Contacts state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsPagination, setContactsPagination] = useState<PaginationInfo>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 20,
    hasNext: false,
    hasPrev: false,
  });
  const [contactsSearch, setContactsSearch] = useState("");
  const [contactsLoading, setContactsLoading] = useState(false);
  
  // Dialog states
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showImportContacts, setShowImportContacts] = useState(false);

  // Fetch groups with proper error handling
  const fetchGroups = useCallback(async (page = 1, search = "", showLoader = true) => {
    try {
      if (showLoader) setGroupsLoading(true);
      setError(null);

      const response = await api.get('/groups', {
        params: {
          page,
          limit: 20,
          search: search.trim(),
        },
      });

      if (response.data.success) {
        const { groups: fetchedGroups, pagination } = response.data.data;
        setGroups(fetchedGroups);
        setGroupsPagination(pagination);
      } else {
        throw new Error(response.data.message || 'Failed to fetch groups');
      }
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch groups';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      if (showLoader) setGroupsLoading(false);
    }
  }, []);

  // Fetch contacts with proper error handling
  const fetchContacts = useCallback(async (page = 1, search = "", showLoader = true) => {
    try {
      if (showLoader) setContactsLoading(true);
      setError(null);

      const response = await api.get('/contacts', {
        params: {
          page,
          limit: 20,
          search: search.trim(),
        },
      });

      if (response.data.success) {
        const { contacts: fetchedContacts, pagination } = response.data.data;
        setContacts(fetchedContacts);
        setContactsPagination(pagination);
      } else {
        throw new Error(response.data.message || 'Failed to fetch contacts');
      }
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch contacts';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      if (showLoader) setContactsLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchGroups();
    fetchContacts();
  }, [fetchGroups, fetchContacts]);

  // Handle search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "groups") {
        fetchGroups(1, groupsSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [groupsSearch, activeTab, fetchGroups]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "contacts") {
        fetchContacts(1, contactsSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [contactsSearch, activeTab, fetchContacts]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError(null);
  };

  // Group operations
  const handleCreateGroup = async (groupData: { name: string; description?: string }) => {
    try {
      setLoading(true);
      const response = await api.post('/groups', groupData);
      
      if (response.data.success) {
        toast.success('Group created successfully');
        setShowAddGroup(false);
        await fetchGroups(1, groupsSearch, false); // Refresh without loader
      } else {
        throw new Error(response.data.message || 'Failed to create group');
      }
    } catch (error: any) {
      console.error('Error creating group:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create group';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      setLoading(true);
      const response = await api.delete(`/groups/${groupId}`);
      
      if (response.data.success) {
        toast.success('Group deleted successfully');
        await fetchGroups(groupsPagination.currentPage, groupsSearch, false);
      } else {
        throw new Error(response.data.message || 'Failed to delete group');
      }
    } catch (error: any) {
      console.error('Error deleting group:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete group';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Contact operations
  const handleCreateContact = async (contactData: { name: string; phone: string; email?: string }) => {
    try {
      setLoading(true);
      const response = await api.post('/contacts', contactData);
      
      if (response.data.success) {
        toast.success('Contact created successfully');
        setShowAddContact(false);
        await fetchContacts(1, contactsSearch, false); // Refresh without loader
      } else {
        throw new Error(response.data.message || 'Failed to create contact');
      }
    } catch (error: any) {
      console.error('Error creating contact:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create contact';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      setLoading(true);
      const response = await api.delete(`/contacts/${contactId}`);
      
      if (response.data.success) {
        toast.success('Contact deleted successfully');
        await fetchContacts(contactsPagination.currentPage, contactsSearch, false);
      } else {
        throw new Error(response.data.message || 'Failed to delete contact');
      }
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete contact';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImportContacts = async (file: File, replaceAll: boolean = false) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('replaceAll', replaceAll.toString());

      const response = await api.post('/contacts/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const { imported, skipped, total } = response.data.data;
        toast.success(`Import completed: ${imported} imported, ${skipped} skipped out of ${total} total`);
        setShowImportContacts(false);
        await fetchContacts(1, contactsSearch, false); // Refresh without loader
      } else {
        throw new Error(response.data.message || 'Failed to import contacts');
      }
    } catch (error: any) {
      console.error('Error importing contacts:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to import contacts';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Pagination handlers
  const handleGroupsPagination = (page: number) => {
    fetchGroups(page, groupsSearch);
  };

  const handleContactsPagination = (page: number) => {
    fetchContacts(page, contactsSearch);
  };

  // Refresh handlers
  const handleRefreshGroups = () => {
    fetchGroups(groupsPagination.currentPage, groupsSearch);
  };

  const handleRefreshContacts = () => {
    fetchContacts(contactsPagination.currentPage, contactsSearch);
  };

  return (
    <DashboardLayout title="Contact Groups" backLink="/dashboard" currentPath={location.pathname}>
      <div className="space-y-6">
        {/* Header with stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-subtle">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Contact Management
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your contacts and groups for messaging campaigns
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{groupsPagination.total} Groups</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{contactsPagination.total} Contacts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setError(null);
                  if (activeTab === "groups") {
                    handleRefreshGroups();
                  } else {
                    handleRefreshContacts();
                  }
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Main content */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Groups
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contacts
            </TabsTrigger>
          </TabsList>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-subtle">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search groups..."
                      value={groupsSearch}
                      onChange={(e) => setGroupsSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshGroups}
                    disabled={groupsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${groupsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <Button 
                  onClick={() => setShowAddGroup(true)}
                  className="bg-jaylink-600 hover:bg-jaylink-700"
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Group
                </Button>
              </div>

              <EnhancedGroupList
                groups={groups}
                pagination={groupsPagination}
                loading={groupsLoading}
                onDelete={handleDeleteGroup}
                onPageChange={handleGroupsPagination}
                onRefresh={handleRefreshGroups}
              />
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-subtle">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search contacts..."
                      value={contactsSearch}
                      onChange={(e) => setContactsSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshContacts}
                    disabled={contactsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${contactsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setShowImportContacts(true)}
                    disabled={loading}
                  >
                    Import
                  </Button>
                  <Button 
                    onClick={() => setShowAddContact(true)}
                    className="bg-jaylink-600 hover:bg-jaylink-700"
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
              </div>

              <EnhancedContactList
                contacts={contacts}
                pagination={contactsPagination}
                loading={contactsLoading}
                onDelete={handleDeleteContact}
                onPageChange={handleContactsPagination}
                onRefresh={handleRefreshContacts}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <AddGroupDialog
          open={showAddGroup}
          onOpenChange={setShowAddGroup}
          onSave={handleCreateGroup}
          loading={loading}
        />

        <AddContactDialog
          open={showAddContact}
          onOpenChange={setShowAddContact}
          onSave={handleCreateContact}
          loading={loading}
        />

        <ImportContactsDialog
          open={showImportContacts}
          onOpenChange={setShowImportContacts}
          onImport={handleImportContacts}
          loading={loading}
        />
      </div>
    </DashboardLayout>
  );
};

export default Groups;