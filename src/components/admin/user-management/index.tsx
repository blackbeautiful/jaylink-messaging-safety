// src/components/admin/user-management/index.tsx
import AdminUserManagement from './AdminUserManagement';

export default AdminUserManagement;

// Export components for direct import
export * from './types';
export { default as UserTable } from './UserTable';

// Export dialogs
export { default as AddUserDialog } from './dialogs/AddUserDialog';
export { default as EditUserDialog } from './dialogs/EditUserDialog';
export { default as ResetPasswordDialog } from './dialogs/ResetPasswordDialog';
export { default as UpdateBalanceDialog } from './dialogs/UpdateBalanceDialog';

// Export utilities
export * from './utils';