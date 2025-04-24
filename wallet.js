document.addEventListener('DOMContentLoaded', () => {
  const connectWalletButton = document.getElementById('connect-wallet');
  const walletAddressDiv = document.getElementById('wallet-address');

  // Check if MetaMask is installed
  if (typeof window.ethereum !== 'undefined') {
    connectWalletButton.addEventListener('click', async () => {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        walletAddressDiv.textContent = `Connected Wallet Address: ${account}`;
        console.log('Wallet connected:', account);
      } catch (error) {
        console.error('Error connecting to wallet:', error);
        walletAddressDiv.textContent = 'Failed to connect wallet.';
      }
    });
  } else {
    walletAddressDiv.textContent = 'MetaMask is not installed. Please install MetaMask and try again.';
    connectWalletButton.disabled = true;
  }
});
