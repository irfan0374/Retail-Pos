export interface Customer {
  id: number
  name: string
  phone: string | null
  trn: string | null
  createdAt: string
}

export type NewCustomerInput = Omit<Customer, 'id' | 'createdAt'>
