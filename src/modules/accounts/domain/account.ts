export const ACCOUNT_TYPES = ["checking", "savings", "cash"] as const;
export const CURRENCIES = ["BRL", "USD"] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];
export type Currency = (typeof CURRENCIES)[number];

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
}
