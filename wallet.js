document.addEventListener('DOMContentLoaded', () => {
  const connectWalletButton = document.getElementById('connect-wallet');
  const disconnectWalletButton = document.getElementById('disconnect-wallet');
  const walletAddressDiv = document.getElementById('wallet-address');
  const balanceDiv = document.getElementById('balance');
  const additionalActionsDiv = document.getElementById('additional-actions');
  const sendButton = document.getElementById('send-button');
  const receiveButton = document.getElementById('receive-button');
  const historyButton = document.getElementById('history-button');

  let web3;
  let connectedAccount = null;

  // Initialize Web3 and check if MetaMask is installed
  if (typeof window.ethereum !== 'undefined') {
    web3 = new Web3(window.ethereum);

    // Load saved wallet address
    const savedAddress = localStorage.getItem('connectedAddress');
    if (savedAddress) {
      connectWallet(savedAddress);
    }

    connectWalletButton.addEventListener('click', async () => {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        connectedAccount = accounts[0];
        localStorage.setItem('connectedAddress', connectedAccount);
        connectWallet(connectedAccount);
      } catch (error) {
        console.error('Error connecting to wallet:', error);
        walletAddressDiv.textContent = 'Failed to connect wallet.';
      }
    });

    disconnectWalletButton.addEventListener('click', () => {
      connectedAccount = null;
      localStorage.removeItem('connectedAddress');
      walletAddressDiv.textContent = '';
      balanceDiv.textContent = '';
      connectWalletButton.classList.remove('hidden');
      disconnectWalletButton.classList.add('hidden');
      additionalActionsDiv.classList.add('hidden');
    });

    sendButton.addEventListener('click', () => {
      window.location.href = 'send.html';
    });

    receiveButton.addEventListener('click', () => {
      window.location.href = 'receive.html';
    });

    historyButton.addEventListener('click', () => {
      window.location.href = 'history.html';
    });
  } else {
    walletAddressDiv.textContent = 'MetaMask is not installed. Please install MetaMask and try again.';
    connectWalletButton.disabled = true;
  }

  async function connectWallet(address) {
    connectedAccount = address;
    walletAddressDiv.textContent = `Connected Wallet Address: ${address}`;
    console.log('Wallet connected:', address);

    // Show balance
    const balance = await web3.eth.getBalance(address);
    balanceDiv.textContent = `Balance: ${web3.utils.fromWei(balance, 'ether')} ETH`;

    // Toggle buttons
    connectWalletButton.classList.add('hidden');
    disconnectWalletButton.classList.remove('hidden');
    additionalActionsDiv.classList.remove('hidden');
  }
});
