const EXAMPLE_QUERY = `Hi, I run a small digital marketing agency in Hyderabad and my average monthly net income is around ₹1,85,000. My core cost of living (rent, utilities, fuel, groceries) is ₹52,000. I invest ₹35,000 every month in premium software subscriptions, cloud infrastructure, and professional networking memberships for my business growth. My discretionary spending—client dinners, keeping up with trends, weekend shopping—comes to about ₹30,000 a month. I also support my sister's college tuition, which is an extra ₹20,000 per month. So my total monthly expenditure is ₹1,37,000. I currently have no debts. Is my current expenditure profile sustainable, or am I running a major risk of a cash crunch if my business revenue fluctuates?`;

function loadExample() {
    document.getElementById('queryInput').value = EXAMPLE_QUERY;
}

function formatCurrency(val) {
    return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function badgeClass(text) {
    if (!text) return 'badge-yellow';
    const t = text.toLowerCase();
    if (t.includes('yes') || t.includes('sufficient') || t.includes('worth') || t.includes('enough')) return 'badge-green';
    if (t.includes('no') || t.includes('not')) return 'badge-red';
    return 'badge-blue';
}

function renderMarkdown(text) {
    return text
        .replace(/### (.+)/g, '<h3>$1</h3>')
        .replace(/## (.+)/g, '<h2>$1</h2>')
        .replace(/# (.+)/g, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^\* (.+)/gm, '<li>$1</li>')
        .replace(/^- (.+)/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, (m) => '<ul>' + m + '</ul>')
        .replace(/\n\n/g, '<br><br>');
}

async function analyzeQuery() {
    const query = document.getElementById('queryInput').value.trim();
    if (!query) {
        showError('Please enter your financial situation before submitting.');
        return;
    }

    const btn = document.getElementById('analyzeBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');

    btn.disabled = true;
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
    hideError();
    document.getElementById('resultsSection').classList.add('hidden');

    try {
        const res = await fetch('/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        const data = await res.json();

        if (!res.ok || data.error) {
            showError(data.error || 'An unexpected error occurred. Please try again.');
            return;
        }

        renderResults(data);

    } catch (err) {
        showError('Network error: ' + err.message);
    } finally {
        btn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
    }
}

function renderResults(data) {
    const { extracted, predictions, budgets, advice } = data;

    // Extracted table
    const extRows = [
        ['Monthly Income', formatCurrency(extracted.monthly_income)],
        ['Cost of Living', formatCurrency(extracted.cost_of_living)],
        ['Other Investments', formatCurrency(extracted.investments)],
        ['Consumerist Expenses', formatCurrency(extracted.consumerist)],
        ['Crisis/Emergency', formatCurrency(extracted.crisis_shock)],
        ['Total Expenditure', formatCurrency(extracted.total_expenditure)],
        ['Debt Status', extracted.debt_status],
    ];
    document.getElementById('extractedTable').innerHTML = extRows.map(([k, v]) =>
        `<tr><td>${k}</td><td>${v}</td></tr>`
    ).join('');

    // Predictions
    document.getElementById('predictionsContent').innerHTML = `
        <div class="prediction-item">
            <div class="pred-row">
                <span class="pred-label">Financial State</span>
                <span class="pred-value"><span class="badge badge-blue">${predictions.financial_state}</span></span>
            </div>
            <div class="pred-row">
                <span class="pred-label">Income Sufficient (Next Few Months)?</span>
                <span class="pred-value"><span class="badge ${badgeClass(predictions.income_sufficient)}">${predictions.income_sufficient}</span></span>
            </div>
            <div class="pred-row">
                <span class="pred-label">Expenditure Worth It?</span>
                <span class="pred-value"><span class="badge ${badgeClass(predictions.expenditure_worth_it)}">${predictions.expenditure_worth_it}</span></span>
            </div>
        </div>
    `;

    // Budgets table
    const budgetRows = [
        ['Cost of Living', formatCurrency(budgets.cost_of_living)],
        ['Other Investments', formatCurrency(budgets.investments)],
        ['Consumerist Expenses', formatCurrency(budgets.consumerist)],
        ['Crisis/Emergency', formatCurrency(budgets.crisis_shock)],
    ];
    document.getElementById('budgetsTable').innerHTML = budgetRows.map(([k, v]) =>
        `<tr><td>${k}</td><td>${v}</td></tr>`
    ).join('');

    // Advice
    document.getElementById('adviceContent').innerHTML = renderMarkdown(advice);

    document.getElementById('resultsSection').classList.remove('hidden');
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}

function showError(msg) {
    const box = document.getElementById('errorBox');
    box.textContent = msg;
    box.classList.remove('hidden');
}

function hideError() {
    document.getElementById('errorBox').classList.add('hidden');
}
