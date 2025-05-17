// src/components/admin/user-management/types.ts
export interface User {
    id: string | number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    status: "active" | "suspended" | "inactive";
    balance: number;
    createdAt: string;
    company?: string;
    phone?: string;
  }
  
  export interface NewUser {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    password: string;
    confirmPassword: string;
    company: string;
    phone: string;
    status: "active" | "suspended" | "inactive";
  }
  
  export interface BalanceUpdate {
    operation: 'add' | 'deduct';
    amount: string;
    description: string;
  }