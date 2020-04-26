import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import CategoriesRepository from '../repositories/CategoriesRepository';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    category,
    title,
    type,
    value,
  }: Request): Promise<Transaction> {
    const categoryRepository = getCustomRepository(CategoriesRepository);
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const { total } = await transactionRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('No balance available');
    }

    let resultCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!resultCategory) {
      resultCategory = categoryRepository.create({ title: category });
      await categoryRepository.save(resultCategory);
    }

    const createTransaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: resultCategory.id,
    });
    await transactionRepository.save(createTransaction);
    return createTransaction;
  }
}

export default CreateTransactionService;
