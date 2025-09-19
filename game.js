document.addEventListener('DOMContentLoaded', () => {
    const balanceDisplay = document.getElementById('balance-display');
    const transactionList = document.getElementById('transaction-list');
    const addFundsBtn = document.getElementById('add-funds-btn');
    const sendFundsBtn = document.getElementById('send-funds-btn');

    let balance = 0;
    let transactions = [];

    function updateBalanceDisplay() {
        balanceDisplay.textContent = `$${balance.toFixed(2)}`;
    }

    function addTransaction(type, amount) {
        const transactionItem = document.createElement('li');
        const sign = type === 'add' ? '+' : '-';
        const color = type === 'add' ? 'green' : 'red';
        transactionItem.innerHTML = `
            <span>${type.charAt(0).toUpperCase() + type.slice(1)}:</span>
            <span style="color: ${color};">${sign}$${amount.toFixed(2)}</span>
        `;
        transactionList.prepend(transactionItem); // Add to top
        transactions.push({ type, amount, timestamp: new Date() });
    }

    addFundsBtn.addEventListener('click', () => {
        const amount = parseFloat(prompt('Enter amount to add:'));
        if (!isNaN(amount) && amount > 0) {
            balance += amount;
            updateBalanceDisplay();
            addTransaction('add', amount);
        } else {
            alert('Please enter a valid positive amount.');
        }
    });

    sendFundsBtn.addEventListener('click', () => {
        const amount = parseFloat(prompt('Enter amount to send:'));
        if (!isNaN(amount) && amount > 0 && amount <= balance) {
            balance -= amount;
            updateBalanceDisplay();
            addTransaction('send', amount);
        } else if (amount > balance) {
            alert('Insufficient funds.');
        } else {
            alert('Please enter a valid positive amount.');
        }
    });

    // Initialize display
    updateBalanceDisplay();
});