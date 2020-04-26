import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { getCustomRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import CategoriesRepositories from '../repositories/CategoriesRepository';
import TransactionRepositories from '../repositories/TransactionsRepository';

interface Request {
  filename: string;
}

interface TransactionList {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

interface CategoryRequest {
  id: string | undefined;
  title: string;
}

class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[] | void | false> {
    const transactionRepository = getCustomRepository(TransactionRepositories);
    const categoryRepository = getCustomRepository(CategoriesRepositories);
    const csvFilePath = path.resolve(__dirname, '../', '../', 'tmp', filename);
    const readCSVStream = fs.createReadStream(csvFilePath);
    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const categories: string[] = [];
    const listTransactions: TransactionList[] = [];
    const newCategoriesList: string[] = [];

    parseCSV.on('data', async line => {
      let [title, type, value, category] = line[0].split(',');
      title = title.trim();
      type = type.trim();
      value = value.trim();
      category = category.trim();
      categories.push(category);
      listTransactions.push({ title, type, value, category });
    });
    await new Promise(resolve => parseCSV.on('end', resolve));

    // Eliminate duplicated values
    categories.map(
      item => !newCategoriesList.includes(item) && newCategoriesList.push(item),
    );

    // Find new categories list in database
    const findCategories = await categoryRepository.find({
      where: {
        title: In(newCategoriesList),
      },
    });

    // Get just name of categories result
    const namesCategoriesFind = findCategories.map(category => category.title);

    const createCategories = newCategoriesList.map(
      item => !namesCategoriesFind.includes(item) && item,
    );

    await Promise.all(
      createCategories.map(async item => {
        if (item !== false) {
          const newCategory = categoryRepository.create({ title: item });
          await categoryRepository.save(newCategory);
        }
      }),
    );

    // Create all transactions
    const resultsCreateTransactions = await Promise.all(
      listTransactions.map(async transaction => {
        const { title, type, value, category } = transaction;

        const resultCategory:
          | Category
          | undefined = await categoryRepository.findOne({
          where: {
            title: category,
          },
        });
        const resultTransaction = transactionRepository.create({
          title,
          type,
          value,
          category: resultCategory,
        });
        await transactionRepository.save(resultTransaction);
        return resultTransaction;
      }),
    );

    await fs.promises.unlink(csvFilePath);
    return resultsCreateTransactions;
  }
}

export default ImportTransactionsService;
