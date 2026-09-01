import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './format';

/**
 * Builds a CSV file from transaction rows and triggers a browser download.
 */
export function exportTransactionsCSV(transactions, filename = 'kupon-report.csv') {
  const headers = ['Date', 'Type', 'Description', 'Category / Source', 'Amount'];
  const rows = transactions.map((t) => [
    t.date,
    t.type,
    t.type === 'expense' ? t.title : t.source,
    t.type === 'expense' ? t.category : t.source,
    Number(t.amount).toFixed(2),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Builds a simple PDF report (summary + transaction table) and downloads it.
 */
export function exportTransactionsPDF({
  transactions,
  totalIncome,
  totalExpenses,
  currency = 'PHP',
  title = 'Kupon Report',
  filename = 'kupon-report.pdf',
}) {
  const doc = new jsPDF();
  const balance = totalIncome - totalExpenses;

  doc.setFontSize(18);
  doc.text(title, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated ${formatDate(new Date().toISOString())}`, 14, 27);

  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text(`Total Income: ${formatCurrency(totalIncome, currency)}`, 14, 38);
  doc.text(`Total Expenses: ${formatCurrency(totalExpenses, currency)}`, 14, 45);
  doc.text(`Balance: ${formatCurrency(balance, currency)}`, 14, 52);

  autoTable(doc, {
    startY: 60,
    head: [['Date', 'Type', 'Description', 'Category / Source', 'Amount']],
    body: transactions.map((t) => [
      formatDate(t.date),
      t.type === 'expense' ? 'Expense' : 'Income',
      t.type === 'expense' ? t.title : t.source,
      t.type === 'expense' ? t.category : t.source,
      formatCurrency(t.amount, currency),
    ]),
    headStyles: { fillColor: [21, 63, 51] },
    styles: { fontSize: 9 },
  });

  doc.save(filename);
}
