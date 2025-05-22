/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/Groups.tsx - Optimized version with smart data fetching and improved UI
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Plus, Users, RefreshCw, Filter, SortAsc, SortDesc } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EnhancedGroupList from "@/components/groups/EnhancedGroupList";
import EnhancedContactList from "@/components/groups/EnhancedContactList";
import AddGroupDialog from "@/components/groups/AddGroupDialog";
import AddContactDialog from "@/components/groups/AddContactDialog";
import ImportContactsDialog from "@/components/groups/ImportContactsDialog";
import EditGroupDialog from "@/components/groups/EditGroupDialog";
import EditContactDialog from "@/components/groups/EditContactDialog";
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

// Data cache for optimization
interface DataCache {
  groups: {
    data: Group[];
    pagination: PaginationInfo;
    lastFetch: number;
    searchQuery: string;
  } | null;
  contacts: {
    data: Contact[];
    pagination: PaginationInfo;
    lastFetch: number;
    searchQuery: string;
  } | null;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

const Groups = () => {
  const location = useLocation();
  
  // State management with optimization
  const [activeTab, setActiveTab] = useState("groups");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data cache for smart fetching
  const [dataCache, setDataCache] = useState<DataCache>({
    groups: null,
    contacts: null
  });
  
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
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [showEditContact, setShowEditContact] = useState(false);

  // Memoized stats
  const stats = useMemo(() => ({
    totalGroups: groupsPagination.total,
    totalContacts: contactsPagination.total,
    groupsWithContacts: groups.filter(g => g.contactCount > 0).length,
    averageContactsPerGroup: groups.length > 0 ? Math.round(groups.reduce((sum, g) => sum + g.contactCount, 0) / groups.length) : 0
  }), [groups, groupsPagination.total, contactsPagination.total]);

  // Smart cache check
  const isCacheValid = useCallback((cacheData: any, searchQuery: string) => {
    if (!cacheData) return false;
    const isExpired = Date.now() - cacheData.lastFetch > CACHE_DURATION;
    const queryChanged = cacheData.searchQuery !== searchQuery;
    return !isExpired && !queryChanged;
  }, []);

  // Optimized fetch groups with caching
  const fetchGroups = useCallback(async (page = 1, search = "", showLoader = true, forceRefresh = false) => {
    try {
      // Check cache first unless force refresh
      if (!forceRefresh && isCacheValid(dataCache.groups, search) && page === 1) {
        setGroups(dataCache.groups!.data);
        setGroupsPagination(dataCache.groups!.pagination);
        return;
      }

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
        
        // Fix timezone issue by creating proper Date objects
        const groupsWithFixedTime = fetchedGroups.map((group: Group) => ({
          ...group,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt,
        }));
        
        setGroups(groupsWithFixedTime);
        setGroupsPagination(pagination);
        
        // Update cache for page 1 searches
        if (page === 1) {
          setDataCache(prev => ({
            ...prev,
            groups: {
              data: groupsWithFixedTime,
              pagination,
              lastFetch: Date.now(),
              searchQuery: search
            }
          }));
        }
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
  }, [dataCache.groups, isCacheValid]);

  // Optimized fetch contacts with caching
  const fetchContacts = useCallback(async (page = 1, search = "", showLoader = true, forceRefresh = false) => {
    try {
      // Check cache first unless force refresh
      if (!forceRefresh && isCacheValid(dataCache.contacts, search) && page === 1) {
        setContacts(dataCache.contacts!.data);
        setContactsPagination(dataCache.contacts!.pagination);
        return;
      }

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
        
        // Update cache for page 1 searches
        if (page === 1) {
          setDataCache(prev => ({
            ...prev,
            contacts: {
              data: fetchedContacts,
              pagination,
              lastFetch: Date.now(),
              searchQuery: search
            }
          }));
        }
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
  }, [dataCache.contacts, isCacheValid]);

  // Smart initial data load - only fetch active tab
  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (activeTab === "groups") {
      fetchGroups(1, groupsSearch);
    } else if (activeTab === "contacts") {
      fetchContacts(1, contactsSearch);
    }
  }, [activeTab]); // Remove fetchGroups/fetchContacts from deps to prevent infinite loops

  // Debounced search handlers
  useEffect(() => {
    if (activeTab !== "groups") return;
    
    const timer = setTimeout(() => {
      fetchGroups(1, groupsSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [groupsSearch, activeTab]);

  useEffect(() => {
    if (activeTab !== "contacts") return;
    
    const timer = setTimeout(() => {
      fetchContacts(1, contactsSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [contactsSearch, activeTab]);

  // Optimized tab change handler
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError(null);
    
    // Only fetch if no cached data or cache is expired
    if (value === "groups" && !isCacheValid(dataCache.groups, groupsSearch)) {
      fetchGroups(1, groupsSearch);
    } else if (value === "contacts" && !isCacheValid(dataCache.contacts, contactsSearch)) {
      fetchContacts(1, contactsSearch);
    }
  };

  // Group operations with cache invalidation
  const handleCreateGroup = async (groupData: { name: string; description?: string }) => {
    try {
      setLoading(true);
      const response = await api.post('/groups', groupData);
      
      if (response.data.success) {
        toast.success('Group created successfully');
        setShowAddGroup(false);
        
        // Invalidate cache and refresh
        setDataCache(prev => ({ ...prev, groups: null }));
        await fetchGroups(1, groupsSearch, false, true);
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
        
        // Invalidate cache and refresh
        setDataCache(prev => ({ ...prev, groups: null }));
        await fetchGroups(groupsPagination.currentPage, groupsSearch, false, true);
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

  const handleEditGroup = async (groupId: string, data: { name: string; description?: string; contactIds?: string[] }) => {
    try {
      setLoading(true);
      const response = await api.put(`/groups/${groupId}`, data);
      
      if (response.data.success) {
        toast.success('Group updated successfully');
        setShowEditGroup(false);
        
        // Invalidate cache and refresh
        setDataCache(prev => ({ ...prev, groups: null }));
        await fetchGroups(groupsPagination.currentPage, groupsSearch, false, true);
      } else {
        throw new Error(response.data.message || 'Failed to update group');
      }
    } catch (error: any) {
      console.error('Error updating group:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update group';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Contact operations with cache invalidation
  const handleCreateContact = async (contactData: { name: string; phone: string; email?: string }) => {
    try {
      setLoading(true);
      const response = await api.post('/contacts', contactData);
      
      if (response.data.success) {
        toast.success('Contact created successfully');
        setShowAddContact(false);
        
        // Invalidate cache and refresh
        setDataCache(prev => ({ ...prev, contacts: null }));
        await fetchContacts(1, contactsSearch, false, true);
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
        
        // Invalidate both caches since contact deletion affects group counts
        setDataCache({ groups: null, contacts: null });
        await fetchContacts(contactsPagination.currentPage, contactsSearch, false, true);
        
        // Also refresh groups to update contact counts
        if (dataCache.groups) {
          await fetchGroups(1, "", false, true);
        }
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

  const handleEditContact = async (contactId: string, data: { name: string; phone: string; email?: string }) => {
    try {
      setLoading(true);
      const response = await api.put(`/contacts/${contactId}`, data);
      
      if (response.data.success) {
        toast.success('Contact updated successfully');
        setShowEditContact(false);
        
        // Invalidate cache and refresh
        setDataCache(prev => ({ ...prev, contacts: null }));
        await fetchContacts(contactsPagination.currentPage, contactsSearch, false, true);
      } else {
        throw new Error(response.data.message || 'Failed to update contact');
      }
    } catch (error: any) {
      console.error('Error updating contact:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update contact';
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
        
        // Invalidate cache and refresh
        setDataCache({ groups: null, contacts: null });
        await fetchContacts(1, contactsSearch, false, true);
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

  // Refresh handlers with cache invalidation
  const handleRefreshGroups = () => {
    setDataCache(prev => ({ ...prev, groups: null }));
    fetchGroups(groupsPagination.currentPage, groupsSearch, true, true);
  };

  const handleRefreshContacts = () => {
    setDataCache(prev => ({ ...prev, contacts: null }));
    fetchContacts(contactsPagination.currentPage, contactsSearch, true, true);
  };

  return (
    <DashboardLayout title="Contact Groups" backLink="/dashboard" currentPath={location.pathname}>
      <div className="space-y-6">
        {/* Enhanced Header with stats */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Contact Management
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Organize your contacts and groups for targeted messaging campaigns
                </CardDescription>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full lg:w-auto">
                <div className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Groups</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalGroups}</span>
                </div>
                
                <div className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Contacts</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalContacts}</span>
                </div>
                
                <div className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Filter className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{stats.groupsWithContacts}</span>
                </div>
                
                <div className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <SortAsc className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg/Group</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{stats.averageContactsPerGroup}</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Error display */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <CardContent className="p-4">
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
            </CardContent>
          </Card>
        )}

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-2 w-full max-w-md bg-white dark:bg-gray-800 shadow-sm">
              <TabsTrigger 
                value="groups" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                <Users className="h-4 w-4" />
                Groups
                {stats.totalGroups > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700">
                    {stats.totalGroups}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="contacts" 
                className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white"
              >
                <Users className="h-4 w-4" />
                Contacts
                {stats.totalContacts > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700">
                    {stats.totalContacts}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search groups..."
                        value={groupsSearch}
                        onChange={(e) => setGroupsSearch(e.target.value)}
                        className="pl-9 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshGroups}
                      disabled={groupsLoading}
                      className="border-gray-200 dark:border-gray-700"
                    >
                      <RefreshCw className={`h-4 w-4 ${groupsLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <Button 
                    onClick={() => setShowAddGroup(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full sm:w-auto"
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <EnhancedGroupList
                  groups={groups}
                  pagination={groupsPagination}
                  loading={groupsLoading}
                  onDelete={handleDeleteGroup}
                  onEdit={(group) => {
                    setSelectedGroup(group);
                    setShowEditGroup(true);
                  }}
                  onPageChange={handleGroupsPagination}
                  onRefresh={handleRefreshGroups}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search contacts..."
                        value={contactsSearch}
                        onChange={(e) => setContactsSearch(e.target.value)}
                        className="pl-9 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-400"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshContacts}
                      disabled={contactsLoading}
                      className="border-gray-200 dark:border-gray-700"
                    >
                      <RefreshCw className={`h-4 w-4 ${contactsLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      variant="outline"
                      onClick={() => setShowImportContacts(true)}
                      disabled={loading}
                      className="border-gray-200 dark:border-gray-700 flex-1 sm:flex-none"
                    >
                      Import
                    </Button>
                    <Button 
                      onClick={() => setShowAddContact(true)}
                      className="bg-green-600 hover:bg-green-700 text-white shadow-sm flex-1 sm:flex-none"
                      disabled={loading}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <EnhancedContactList
                  contacts={contacts}
                  pagination={contactsPagination}
                  loading={contactsLoading}
                  onDelete={handleDeleteContact}
                  onEdit={(contact) => {
                    setSelectedContact(contact);
                    setShowEditContact(true);
                  }}
                  onPageChange={handleContactsPagination}
                  onRefresh={handleRefreshContacts}
                />
              </CardContent>
            </Card>
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

        <EditGroupDialog
          open={showEditGroup}
          onOpenChange={(open) => {
            setShowEditGroup(open);
            if (!open) setSelectedGroup(null);
          }}
          group={selectedGroup}
          onSave={handleEditGroup}
          loading={loading}
        />

        <EditContactDialog
          open={showEditContact}
          onOpenChange={(open) => {
            setShowEditContact(open);
            if (!open) setSelectedContact(null);
          }}
          contact={selectedContact}
          onSave={handleEditContact}
          loading={loading}
        />
      </div>
    </DashboardLayout>
  );
};

export default Groups;