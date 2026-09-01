const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getIncome,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
} = require('../controllers/incomeController');

router.use(authMiddleware);

router.get('/', getIncome);
router.get('/:id', getIncomeById);
router.post('/', createIncome);
router.put('/:id', updateIncome);
router.delete('/:id', deleteIncome);

module.exports = router;
