
import React from 'react';
import { Category, Transaction } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Layanan Rawat Inap', type: 'Income' },
  { id: '2', name: 'Layanan Rawat Jalan', type: 'Income' },
  { id: '3', name: 'Laboratorium', type: 'Income' },
  { id: '4', name: 'Farmasi', type: 'Income' },
  { id: '5', name: 'Gaji Karyawan', type: 'Expense' },
  { id: '6', name: 'Listrik & Air', type: 'Expense' },
  { id: '7', name: 'Alat Medis', type: 'Expense' },
  { id: '8', name: 'Pemeliharaan', type: 'Expense' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'Income', category: 'Layanan Rawat Inap', amount: 5000000, date: '2023-10-01', patientType: 'BPJS', note: 'Pasien Kamar 302' },
  { id: 't2', type: 'Income', category: 'Layanan Rawat Jalan', amount: 1200000, date: '2023-10-02', patientType: 'Umum', note: 'Cek Up Rutin' },
  { id: 't3', type: 'Expense', category: 'Gaji Karyawan', amount: 3000000, date: '2023-10-05', patientType: 'None', note: 'Gaji Staff Perawat' },
];
