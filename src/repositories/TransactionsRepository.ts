import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface TransactionCategory {
  id: string;
  title: string;
  value: number;
  type: string;
  category: Category;
  created_at: Date;
  updated_at: Date;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const types = await this.find();
    const incomeValue = types.reduce((total, elemento) => {
      if (elemento.type === 'income') {
        total += elemento.value;
        return total;
      }
      return total;
    }, 0);
    const outcomeValue = types.reduce((total, elemento) => {
      if (elemento.type === 'outcome') {
        total += elemento.value;
        return total;
      }
      return total;
    }, 0);
    const total = incomeValue - outcomeValue;
    const data = {
      income: incomeValue,
      outcome: outcomeValue,
      total,
    };
    return data;
  }
}

export default TransactionsRepository;
