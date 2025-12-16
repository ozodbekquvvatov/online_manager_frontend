import { useMemo } from 'react';

export interface FinancialData {
  revenue?: number;
  expenses?: number;
  costOfGoodsSold?: number;
  totalInvestment?: number;
  fixedCosts?: number;
  variableCosts?: number;
  sellingPrice?: number;
  costPrice?: number;
}

export interface EmployeeData {
  baseSalary?: number;
  overtimeHours?: number;
  hourlyRate?: number;
  overtimeRate?: number;
  bonuses?: number;
  commission?: number;
  deductions?: number;
  daysPresent?: number;
  totalWorkingDays?: number;
  revenueGenerated?: number;
}

export interface InventoryData {
  quantity?: number;
  costPrice?: number;
  sellingPrice?: number;
  costOfGoodsSold?: number;
  averageInventory?: number;
  salesVelocity?: number;
  leadTimeDays?: number;
  safetyStock?: number;
}

export interface SalesData {
  totalSales?: number;
  numberOfSales?: number;
  numberOfVisitors?: number;
  averagePurchaseValue?: number;
  purchaseFrequency?: number;
  customerLifespan?: number;
  marketingSpend?: number;
  newCustomers?: number;
  previousSales?: number;
}

export const useBusinessCalculations = () => {
  return useMemo(() => ({
    calculateProfit: (revenue: number, expenses: number): number => {
      return revenue - expenses;
    },

    calculateProfitMargin: (revenue: number, netProfit: number): number => {
      if (revenue === 0) return 0;
      return (netProfit / revenue) * 100;
    },

    calculateGrossProfit: (revenue: number, costOfGoodsSold: number): number => {
      return revenue - costOfGoodsSold;
    },

    calculateGrossProfitMargin: (sellingPrice: number, costPrice: number): number => {
      if (sellingPrice === 0) return 0;
      return ((sellingPrice - costPrice) / sellingPrice) * 100;
    },

    calculateROI: (netProfit: number, totalInvestment: number): number => {
      if (totalInvestment === 0) return 0;
      return (netProfit / totalInvestment) * 100;
    },

    calculateBreakEven: (fixedCosts: number, sellingPrice: number, variableCosts: number): number => {
      const contributionMargin = sellingPrice - variableCosts;
      if (contributionMargin === 0) return 0;
      return fixedCosts / contributionMargin;
    },

    calculateEmployeeSalary: (data: EmployeeData): {
      overtimePay: number;
      grossPay: number;
      netPay: number;
    } => {
      const baseSalary = data.baseSalary || 0;
      const overtimeHours = data.overtimeHours || 0;
      const hourlyRate = data.hourlyRate || 0;
      const overtimeRate = data.overtimeRate || 1.5;
      const bonuses = data.bonuses || 0;
      const commission = data.commission || 0;
      const deductions = data.deductions || 0;

      const overtimePay = overtimeHours * hourlyRate * overtimeRate;
      const grossPay = baseSalary + overtimePay + bonuses + commission;
      const netPay = grossPay - deductions;

      return { overtimePay, grossPay, netPay };
    },

    calculateAttendanceScore: (daysPresent: number, totalWorkingDays: number): number => {
      if (totalWorkingDays === 0) return 0;
      return (daysPresent / totalWorkingDays) * 100;
    },

    calculateLaborCostPercentage: (totalLaborCost: number, totalRevenue: number): number => {
      if (totalRevenue === 0) return 0;
      return (totalLaborCost / totalRevenue) * 100;
    },

    calculateEmployeeEfficiencyRatio: (revenueGenerated: number, salaryCost: number): number => {
      if (salaryCost === 0) return 0;
      return revenueGenerated / salaryCost;
    },

    calculateStockValue: (quantity: number, costPrice: number): number => {
      return quantity * costPrice;
    },

    calculatePotentialProfit: (quantity: number, sellingPrice: number, costPrice: number): number => {
      return quantity * (sellingPrice - costPrice);
    },

    calculateInventoryTurnover: (costOfGoodsSold: number, averageInventory: number): number => {
      if (averageInventory === 0) return 0;
      return costOfGoodsSold / averageInventory;
    },

    calculateReorderPoint: (salesVelocity: number, leadTimeDays: number, safetyStock: number): number => {
      return salesVelocity * leadTimeDays + safetyStock;
    },

    calculateGMROI: (grossMargin: number, averageInventoryCost: number): number => {
      if (averageInventoryCost === 0) return 0;
      return grossMargin / averageInventoryCost;
    },

    calculateSalesVelocity: (numberOfSales: number, averageValue: number, timePeriod: number): number => {
      if (timePeriod === 0) return 0;
      return (numberOfSales * averageValue) / timePeriod;
    },

    calculateCustomerLifetimeValue: (
      averagePurchaseValue: number,
      purchaseFrequency: number,
      customerLifespan: number
    ): number => {
      return averagePurchaseValue * purchaseFrequency * customerLifespan;
    },

    calculateConversionRate: (numberOfSales: number, numberOfVisitors: number): number => {
      if (numberOfVisitors === 0) return 0;
      return (numberOfSales / numberOfVisitors) * 100;
    },

    calculateAverageTransactionValue: (totalRevenue: number, numberOfTransactions: number): number => {
      if (numberOfTransactions === 0) return 0;
      return totalRevenue / numberOfTransactions;
    },

    calculateSalesGrowthRate: (currentSales: number, previousSales: number): number => {
      if (previousSales === 0) return 0;
      return ((currentSales - previousSales) / previousSales) * 100;
    },

    calculateCustomerAcquisitionCost: (marketingSpend: number, newCustomers: number): number => {
      if (newCustomers === 0) return 0;
      return marketingSpend / newCustomers;
    },

    calculateCurrentRatio: (assets: number, liabilities: number): number => {
      if (liabilities === 0) return 0;
      return assets / liabilities;
    },

    calculateDebtToEquityRatio: (totalDebt: number, totalEquity: number): number => {
      if (totalEquity === 0) return 0;
      return totalDebt / totalEquity;
    },

    calculateOperatingExpenseRatio: (operatingExpenses: number, revenue: number): number => {
      if (revenue === 0) return 0;
      return (operatingExpenses / revenue) * 100;
    },

    calculateDiscountImpact: (originalPrice: number, discountPercentage: number, quantity: number): {
      discountAmount: number;
      finalPrice: number;
      revenueImpact: number;
    } => {
      const discountAmount = originalPrice * (discountPercentage / 100);
      const finalPrice = originalPrice - discountAmount;
      const revenueImpact = discountAmount * quantity;

      return { discountAmount, finalPrice, revenueImpact };
    },

    calculateTaxAmount: (amount: number, taxRate: number): number => {
      return amount * (taxRate / 100);
    },

    // Format as USD (English/Dollars)
    formatCurrency: (amount: number): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    },

    // Convert UZS to USD and format (for when your data is in UZS)
    formatUZStoUSD: (uzsAmount: number, exchangeRate: number = 12500): string => {
      const usdAmount = uzsAmount / exchangeRate;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(usdAmount);
    },

    // Just convert UZS to USD number (no formatting)
    convertUZStoUSD: (uzsAmount: number, exchangeRate: number = 12500): number => {
      return uzsAmount / exchangeRate;
    },

    formatPercentage: (value: number, decimals: number = 2): string => {
      return `${value.toFixed(decimals)}%`;
    },

    formatNumber: (value: number, decimals: number = 2): string => {
      return value.toFixed(decimals);
    },
  }), []);
};