document.addEventListener('DOMContentLoaded', () => {
  const connectWalletButton = document.getElementById('connect-wallet');
  const disconnectWalletButton = document.getElementById('disconnect-wallet');
  const walletAddressDiv = document.getElementById('wallet-address');
  const balanceDiv = document.getElementById('balance');
  const transactionForm = document.getElementById('transaction-form');
  const recipientAddressInput = document.getElementById('recipient-address');
  const amountInput = document.getElementById('amount');
  const transactionStatus = document.getElementById('transaction-status');

  let web3;
  let connectedAccount = null;

  // Initialize Web3 instance and check if MetaMask is installed
  if (typeof window.ethereum !== 'undefined') {
    web3 = new Web3(window.ethereum);

    connectWalletButton.addEventListener('click', async () => {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        connectedAccount = accounts[0];
        walletAddressDiv.textContent = `Connected Wallet Address: ${connectedAccount}`;
        console.log('Wallet connected:', connectedAccount);

        // Show balance
        await updateBalance();

        // Toggle buttons
        connectWalletButton.classList.add('hidden');
        disconnectWalletButton.classList.remove('hidden');
      } catch (error) {
        console.error('Error connecting to wallet:', error);
        walletAddressDiv.textContent = 'Failed to connect wallet.';
      }
    });

    disconnectWalletButton.addEventListener('click', () => {
      connectedAccount = null;
      walletAddressDiv.textContent = '';
      balanceDiv.textContent = '';
      connectWalletButton.classList.remove('hidden');
      disconnectWalletButton.classList.add('hidden');
    });

    transactionForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!connectedAccount) {
        transactionStatus.textContent = 'Please connect your wallet first.';
        return;
      }

      const recipient = recipientAddressInput.value;
      const amount = amountInput.value;

      if (!web3.utils.isAddress(recipient)) {
        transactionStatus.textContent = 'Invalid recipient address.';
        return;
      }

      try {
        transactionStatus.textContent = 'Sending transaction...';
        const value = web3.utils.toWei(amount, 'ether');
        await web3.eth.sendTransaction({
          from: connectedAccount,
          to: recipient,
          value,
        });
        transactionStatus.textContent = 'Transaction sent successfully!';
      } catch (error) {
        console.error('Error sending transaction:', error);
        transactionStatus.textContent = 'Transaction failed.';
      }
    });
  } else {
    walletAddressDiv.textContent = 'MetaMask is not installed. Please install MetaMask and try again.';
    connectWalletButton.disabled = true;
  }

  // Function to update wallet balance
  async function updateBalance() {
    try {
      const balance = await web3.eth.getBalance(connectedAccount);
      balanceDiv.textContent = `Balance: ${web3.utils.fromWei(balance, 'ether')} ETH`;
    } catch (error) {
      console.error('Error fetching balance:', error);
      balanceDiv.textContent = 'Balance: Unable to fetch.';
    }
  }
});
