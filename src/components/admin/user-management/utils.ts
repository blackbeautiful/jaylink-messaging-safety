// src/components/admin/user-management/utils.ts

/**
 * Returns appropriate CSS classes for user status badges
 */
export const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "suspended":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400";
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };
  
  /**
   * Format date to locale string
   */
  export const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  /**
   * Creates empty new user object with default values
   */
  export const createEmptyNewUser = () => ({
    firstName: "",
    lastName: "",
    email: "",
    role: "user",
    password: "",
    confirmPassword: "",
    company: "",
    phone: "",
    status: "active" as const,
  });
  
  /**
   * Creates empty balance update object with default values
   */
  export const createEmptyBalanceUpdate = () => ({
    operation: 'add' as const,
    amount: '',
    description: '',
  });