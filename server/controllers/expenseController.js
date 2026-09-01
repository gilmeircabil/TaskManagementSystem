/**
 * Expense controller
 * All queries run through req.supabase (request-scoped, user-authenticated
 * client) so Postgres RLS policies enforce that users only ever see/modify
 * their own rows.
 */

// GET /api/expenses  (supports ?category=&startDate=&endDate=&paymentMethod=&search=)
async function getExpenses(req, res) {
  try {
    const { category, startDate, endDate, paymentMethod, search } = req.query;
    let query = req.supabase
      .from('expenses')
      .select('*')
      .eq('user_id', req.user.id)
      .order('date', { ascending: false });

    if (category) query = query.eq('category', category);
    if (paymentMethod) query = query.eq('payment_method', paymentMethod);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ data });
  } catch (err) {
    console.error('[getExpenses]', err.message);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
}

// GET /api/expenses/:id
async function getExpenseById(req, res) {
  try {
    const { data, error } = await req.supabase
      .from('expenses')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (err) {
    console.error('[getExpenseById]', err.message);
    res.status(404).json({ error: 'Expense not found' });
  }
}

// POST /api/expenses
async function createExpense(req, res) {
  try {
    const { title, amount, category, description, date, payment_method } = req.body;

    if (!title || amount === undefined || !category || !date) {
      return res.status(400).json({ error: 'title, amount, category, and date are required' });
    }

    const { data, error } = await req.supabase
      .from('expenses')
      .insert([
        {
          user_id: req.user.id,
          title,
          amount,
          category,
          description: description || null,
          date,
          payment_method: payment_method || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ data });
  } catch (err) {
    console.error('[createExpense]', err.message);
    res.status(500).json({ error: 'Failed to create expense' });
  }
}

// PUT /api/expenses/:id
async function updateExpense(req, res) {
  try {
    const { title, amount, category, description, date, payment_method } = req.body;

    const { data, error } = await req.supabase
      .from('expenses')
      .update({
        ...(title !== undefined && { title }),
        ...(amount !== undefined && { amount }),
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date }),
        ...(payment_method !== undefined && { payment_method }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (err) {
    console.error('[updateExpense]', err.message);
    res.status(500).json({ error: 'Failed to update expense' });
  }
}

// DELETE /api/expenses/:id
async function deleteExpense(req, res) {
  try {
    const { error } = await req.supabase
      .from('expenses')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('[deleteExpense]', err.message);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
}

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
};
