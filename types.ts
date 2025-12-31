
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
}

export interface SummaryStats {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  bpjsIncome: number;
  umumIncome: number;
}
