export interface ITransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: "Pending" | "Completed" | "Failed";
  type: "Credit" | "Debit";
}

export interface ITransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: string;
  keyword?: string;
}

export interface IPagination {
  pageNumber: number;
  pageSize: number;
}

export interface ISorting {
  sortBy: "date" | "amount";
  sortDirection: "asc" | "desc";
}

export interface ITransactionResponse {
  transactions: ITransaction[];
  totalRecords: number;
  totalPages: number;
}
