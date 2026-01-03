
export type PatientType = 'Umum' | 'BPJS' | 'None';
export type TransactionType = 'Income' | 'Expense';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  patientType: PatientType;
  note: string;
}

export interface PatientDailyStat {
  id: string;
  date: string;
  outpatientUmum: number;
  outpatientBpjs: number;
  inpatientDischargeUmum: number;
  inpatientDischargeBpjs: number;
  inpatientAdmissionUmum: number; // Added
  inpatientAdmissionBpjs: number; // Added
}

export interface BalanceItem {
  id: string;
  name: string;
  amount: number;
  category: 'Asset' | 'Liability' | 'Equity';
}

export interface AppTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bgLight: string;
}

export interface SummaryStats {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  bpjsIncome: number;
  umumIncome: number;
}
