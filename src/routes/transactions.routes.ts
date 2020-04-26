import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import uploadConfig from '../config/upload';
import ImportTransactionsService from '../services/ImportTransactionsService';

interface TransactionDTO {
  title: string;
  value: number;
  type: string;
  category: string;
}

const transactionsRouter = Router();
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionRepository = getCustomRepository(TransactionsRepository);
  const balance = await transactionRepository.getBalance();
  const transactions = await transactionRepository.find({
    select: [
      'id',
      'title',
      'category',
      'type',
      'value',
      'created_at',
      'updated_at',
    ],
    relations: ['category'],
  });

  return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;
  const createTrasaction = new CreateTransactionService();
  const transactions = await createTrasaction.execute({
    title,
    value,
    type,
    category,
  });
  return response.json(transactions);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;
  const deleteTransaction = new DeleteTransactionService();
  await deleteTransaction.execute({ id });
  return response.status(204).json();
});

transactionsRouter.post(
  '/import',
  upload.single('file_transaction'),
  async (request, response) => {
    const importTransaction = new ImportTransactionsService();
    const transactions = await importTransaction.execute({
      filename: request.file.filename,
    });

    return response.json(transactions);
  },
);

export default transactionsRouter;
