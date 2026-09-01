/**
 * Income controller — mirrors expenseController but for the `income` table.
 */

// GET /api/income (supports ?startDate=&endDate=&search=)
async function getIncome(req, res) {
  try {
    const { startDate, endDate, search } = req.query;
    let query = req.supabase
      .from('income')
      .select('*')
      .eq('user_id', req.user.id)
      .order('date', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (search) query = query.ilike('source', `%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ data });
  } catch (err) {
    console.error('[getIncome]', err.message);
    res.status(500).json({ error: 'Failed to fetch income' });
  }
}

// GET /api/income/:id
async function getIncomeById(req, res) {
  try {
    const { data, error } = await req.supabase
      .from('income')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (err) {
    console.error('[getIncomeById]', err.message);
    res.status(404).json({ error: 'Income record not found' });
  }
}

// POST /api/income
async function createIncome(req, res) {
  try {
    const { source, amount, description, date } = req.body;

    if (!source || amount === undefined || !date) {
      return res.status(400).json({ error: 'source, amount, and date are required' });
    }

    const { data, error } = await req.supabase
      .from('income')
      .insert([
        {
          user_id: req.user.id,
          source,
          amount,
          description: description || null,
          date,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ data });
  } catch (err) {
    console.error('[createIncome]', err.message);
    res.status(500).json({ error: 'Failed to create income' });
  }
}

// PUT /api/income/:id
async function updateIncome(req, res) {
  try {
    const { source, amount, description, date } = req.body;

    const { data, error } = await req.supabase
      .from('income')
      .update({
        ...(source !== undefined && { source }),
        ...(amount !== undefined && { amount }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (err) {
    console.error('[updateIncome]', err.message);
    res.status(500).json({ error: 'Failed to update income' });
  }
}

// DELETE /api/income/:id
async function deleteIncome(req, res) {
  try {
    const { error } = await req.supabase
      .from('income')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('[deleteIncome]', err.message);
    res.status(500).json({ error: 'Failed to delete income' });
  }
}

module.exports = {
  getIncome,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
};
