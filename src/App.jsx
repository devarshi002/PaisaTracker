import { useEffect, useMemo, useState } from 'react';

const KEY = 'paisatrack-v1';
const categories = ['Food', 'Rent', 'Travel', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Other'];
const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0));
const today = () => new Date().toISOString().slice(0, 10);
const monthOf = (date) => String(date || '').slice(0, 7);
const currentMonth = today().slice(0, 7);

const starter = {
  income: [{ id: crypto.randomUUID(), date: today(), source: 'Monthly salary', amount: 30000 }],
  transactions: [
    { id: crypto.randomUUID(), date: today(), title: 'PG Rent', category: 'Rent', amount: 9000, note: 'Monthly rent' },
    { id: crypto.randomUUID(), date: today(), title: 'Groceries', category: 'Food', amount: 1800, note: '' },
    { id: crypto.randomUUID(), date: today(), title: 'Bus and metro', category: 'Travel', amount: 1200, note: '' },
  ]
};

function loadData() {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? JSON.parse(saved) : starter;
  } catch {
    return starter;
  }
}

function App() {
  const [data, setData] = useState(loadData);
  const [month, setMonth] = useState(currentMonth);
  const [tab, setTab] = useState('overview');
  const [showExpense, setShowExpense] = useState(false);
  const [showIncome, setShowIncome] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ date: today(), title: '', category: 'Food', amount: '', note: '' });
  const [incomeForm, setIncomeForm] = useState({ date: today(), source: 'Monthly salary', amount: '' });
  const [search, setSearch] = useState('');

  useEffect(() => localStorage.setItem(KEY, JSON.stringify(data)), [data]);

  const monthIncome = useMemo(() => data.income.filter(x => monthOf(x.date) === month).reduce((s, x) => s + Number(x.amount), 0), [data, month]);
  const monthExpenses = useMemo(() => data.transactions.filter(x => monthOf(x.date) === month).reduce((s, x) => s + Number(x.amount), 0), [data, month]);
  const savings = monthIncome - monthExpenses;
  const savingsRate = monthIncome > 0 ? Math.max(0, Math.min(100, (savings / monthIncome) * 100)) : 0;
  const monthTransactions = useMemo(() => data.transactions
    .filter(x => monthOf(x.date) === month)
    .filter(x => `${x.title} ${x.category} ${x.note}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date)), [data, month, search]);

  const categoryTotals = useMemo(() => categories.map(category => ({
    category,
    total: data.transactions.filter(x => monthOf(x.date) === month && x.category === category).reduce((s, x) => s + Number(x.amount), 0)
  })).filter(x => x.total > 0).sort((a, b) => b.total - a.total), [data, month]);

  const maxCategory = Math.max(1, ...categoryTotals.map(x => x.total));

  function addExpense(e) {
    e.preventDefault();
    if (!expenseForm.title.trim() || Number(expenseForm.amount) <= 0) return;
    setData(d => ({ ...d, transactions: [...d.transactions, { ...expenseForm, id: crypto.randomUUID(), amount: Number(expenseForm.amount), title: expenseForm.title.trim() }] }));
    setExpenseForm({ date: today(), title: '', category: 'Food', amount: '', note: '' });
    setShowExpense(false);
  }

  function addIncome(e) {
    e.preventDefault();
    if (Number(incomeForm.amount) <= 0) return;
    setData(d => ({ ...d, income: [...d.income, { ...incomeForm, id: crypto.randomUUID(), amount: Number(incomeForm.amount) }] }));
    setIncomeForm({ date: today(), source: 'Monthly salary', amount: '' });
    setShowIncome(false);
  }

  function deleteExpense(id) {
    if (window.confirm('Delete this expense?')) setData(d => ({ ...d, transactions: d.transactions.filter(x => x.id !== id) }));
  }

  function exportCSV() {
    const rows = [['Date', 'Type', 'Title / Source', 'Category', 'Amount', 'Note']];
    data.income.filter(x => monthOf(x.date) === month).forEach(x => rows.push([x.date, 'Income', x.source, 'Income', x.amount, '']));
    data.transactions.filter(x => monthOf(x.date) === month).forEach(x => rows.push([x.date, 'Expense', x.title, x.category, x.amount, x.note || '']));
    const csv = rows.map(row => row.map(v => `"${String(v ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = `paisatrack-${month}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  function resetDemo() {
    if (window.confirm('Reset all PaisaTrack data to the sample data?')) setData(starter);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">₹</div><div><strong>PaisaTrack</strong><span>PERSONAL FINANCE</span></div></div>
        <div className="side-label">WORKSPACE</div>
        <button className={`nav-item ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}><span>▦</span> Overview</button>
        <button className={`nav-item ${tab === 'expenses' ? 'active' : ''}`} onClick={() => setTab('expenses')}><span>↗</span> Expenses</button>
        <button className={`nav-item ${tab === 'income' ? 'active' : ''}`} onClick={() => setTab('income')}><span>↙</span> Income</button>
        <div className="sidebar-bottom"><div className="tip-card"><div className="tip-icon">✦</div><strong>Small steps add up.</strong><p>Track your spending today to build better money habits tomorrow.</p></div><div className="profile"><div className="avatar">PT</div><div><strong>My Wallet</strong><span>Personal account</span></div></div></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><div className="eyebrow">YOUR MONEY, IN ONE PLACE</div><h1>{tab === 'overview' ? 'Financial overview' : tab === 'expenses' ? 'Your expenses' : 'Your income'}</h1><p className="subheading">A clearer picture of your money starts here.</p></div>
          <div className="top-actions"><label className="month-picker"><span>Month</span><input type="month" value={month} onChange={e => setMonth(e.target.value)} /></label><button className="button button-light" onClick={exportCSV}>↓ <span>Export CSV</span></button></div>
        </header>

        <section className="summary-grid">
          <article className="summary-card income-card"><div className="card-top"><span>Total income</span><span className="metric-icon">↙</span></div><strong>{money(monthIncome)}</strong><small>Money received this month</small></article>
          <article className="summary-card expense-card"><div className="card-top"><span>Total expenses</span><span className="metric-icon">↗</span></div><strong>{money(monthExpenses)}</strong><small>Money spent this month</small></article>
          <article className="summary-card savings-card"><div className="card-top"><span>Net savings</span><span className="metric-icon">◈</span></div><strong className={savings < 0 ? 'negative' : ''}>{money(savings)}</strong><small>{savings < 0 ? 'You spent more than your income' : 'Income minus expenses'}</small></article>
        </section>

        {tab === 'overview' && <section className="content-grid">
          <article className="panel savings-panel">
            <div className="panel-heading"><div><h2>Monthly savings</h2><p>Your savings progress for {month}</p></div><span className="pill">{Math.round(savingsRate)}% saved</span></div>
            <div className="savings-number">{money(Math.max(0, savings))}<span> saved this month</span></div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${savingsRate}%` }} /></div>
            <div className="progress-labels"><span>₹0</span><span>{money(monthIncome)} income</span></div>
            <div className="insight"><span>✦</span><p>{monthIncome === 0 ? 'Add your income to start tracking your savings.' : savings < 0 ? 'Your expenses are higher than your income. Review your spending categories.' : `You have kept ${Math.round(savingsRate)}% of your income. Keep it up!`}</p></div>
          </article>
          <article className="panel category-panel">
            <div className="panel-heading"><div><h2>Spending by category</h2><p>Where your money goes</p></div></div>
            {categoryTotals.length === 0 ? <div className="empty-state">No expenses in this month yet.</div> : <div className="category-list">{categoryTotals.slice(0, 6).map(item => <div className="category-row" key={item.category}><div className="category-meta"><span>{item.category}</span><strong>{money(item.total)}</strong></div><div className="bar-track"><div className="bar-fill" style={{ width: `${(item.total / maxCategory) * 100}%` }} /></div></div>)}</div>}
          </article>
          <article className="panel transactions-panel">
            <div className="panel-heading"><div><h2>Recent expenses</h2><p>Your latest transactions</p></div><button className="text-button" onClick={() => setTab('expenses')}>View all →</button></div>
            <TransactionList items={monthTransactions.slice(0, 5)} onDelete={deleteExpense} />
          </article>
          <article className="panel quick-panel">
            <div className="panel-heading"><div><h2>Quick actions</h2><p>Keep your records up to date</p></div></div>
            <button className="quick-action" onClick={() => setShowExpense(true)}><span className="quick-icon expense-icon">＋</span><span><strong>Add an expense</strong><small>Record a purchase or bill</small></span><b>→</b></button>
            <button className="quick-action" onClick={() => setShowIncome(true)}><span className="quick-icon income-icon">↙</span><span><strong>Add income</strong><small>Salary, freelance or other</small></span><b>→</b></button>
            <button className="quick-action" onClick={exportCSV}><span className="quick-icon export-icon">↓</span><span><strong>Download report</strong><small>Export this month's data</small></span><b>→</b></button>
          </article>
        </section>}

        {tab === 'expenses' && <section className="panel full-panel"><div className="panel-heading"><div><h2>All expenses</h2><p>Track and review every purchase</p></div><button className="button button-primary" onClick={() => setShowExpense(true)}>＋ Add expense</button></div><input className="search-input" placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} /><TransactionList items={monthTransactions} onDelete={deleteExpense} /></section>}

        {tab === 'income' && <section className="panel full-panel"><div className="panel-heading"><div><h2>Income history</h2><p>All money received in {month}</p></div><button className="button button-primary" onClick={() => setShowIncome(true)}>＋ Add income</button></div>
          {data.income.filter(x => monthOf(x.date) === month).length === 0 ? <div className="empty-state">No income added for this month.</div> : data.income.filter(x => monthOf(x.date) === month).sort((a,b) => b.date.localeCompare(a.date)).map(x => <div className="income-row" key={x.id}><div className="transaction-icon income-icon">↙</div><div className="transaction-main"><strong>{x.source}</strong><span>{x.date}</span></div><strong className="amount-positive">+{money(x.amount)}</strong></div>)}
        </section>}

        <footer className="footer"><span>© 2026 PaisaTrack</span><span>Your data stays in this browser · <button onClick={resetDemo}>Reset demo data</button></span></footer>
      </main>

      {showExpense && <Modal title="Add an expense" subtitle="Record where your money went." onClose={() => setShowExpense(false)}><form onSubmit={addExpense} className="form">
        <label>Date<input type="date" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date:e.target.value})} required /></label>
        <label>Expense name<input placeholder="e.g. Monthly groceries" value={expenseForm.title} onChange={e => setExpenseForm({...expenseForm, title:e.target.value})} required /></label>
        <label>Category<select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category:e.target.value})}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
        <label>Amount (₹)<input type="number" min="1" step="1" placeholder="0" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount:e.target.value})} required /></label>
        <label>Note (optional)<input placeholder="Add a note" value={expenseForm.note} onChange={e => setExpenseForm({...expenseForm, note:e.target.value})} /></label>
        <button className="button button-primary submit-button">Save expense</button>
      </form></Modal>}

      {showIncome && <Modal title="Add income" subtitle="Add salary or any other money received." onClose={() => setShowIncome(false)}><form onSubmit={addIncome} className="form">
        <label>Date<input type="date" value={incomeForm.date} onChange={e => setIncomeForm({...incomeForm, date:e.target.value})} required /></label>
        <label>Income source<input placeholder="e.g. Monthly salary" value={incomeForm.source} onChange={e => setIncomeForm({...incomeForm, source:e.target.value})} required /></label>
        <label>Amount (₹)<input type="number" min="1" step="1" placeholder="0" value={incomeForm.amount} onChange={e => setIncomeForm({...incomeForm, amount:e.target.value})} required /></label>
        <button className="button button-primary submit-button">Save income</button>
      </form></Modal>}
    </div>
  );
}

function TransactionList({ items, onDelete }) {
  if (!items.length) return <div className="empty-state">No expenses found. Add your first expense to get started.</div>;
  return <div className="transaction-list">{items.map(x => <div className="transaction-row" key={x.id}><div className="transaction-icon">{x.category === 'Food' ? '🍽' : x.category === 'Travel' ? '↗' : x.category === 'Rent' ? '⌂' : '◌'}</div><div className="transaction-main"><strong>{x.title}</strong><span>{x.category} · {x.date}{x.note ? ` · ${x.note}` : ''}</span></div><strong className="amount-negative">-{money(x.amount)}</strong><button className="delete-button" title="Delete expense" onClick={() => onDelete(x.id)}>×</button></div>)}</div>;
}

function Modal({ title, subtitle, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="modal"><div className="modal-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="close-button" onClick={onClose}>×</button></div>{children}</section></div>;
}

export default App;
