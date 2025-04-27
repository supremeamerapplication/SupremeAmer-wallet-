document.addEventListener('DOMContentLoaded', () => {
  const connectWalletButton = document.getElementById('connect-wallet');
  const disconnectWalletButton = document.getElementById('disconnect-wallet');
  const walletAddressDiv = document.getElementById('wallet-address');
  const balanceDiv = document.getElementById('balance');
  const additionalActionsDiv = document.getElementById('additional-actions');
  const sendButton = document.getElementById('send-button');
  const receiveButton = document.getElementById('receive-button');
  const historyButton = document.getElementById('history-button');
  const miningBalanceDiv = document.getElementById('mining-balance');
  const miningStartButton = document.getElementById('start-mining');
  const importTokenButton = document.getElementById('import-token');
  const sacoinPriceDiv = document.getElementById('sacoin-price');
  const usdtPriceDiv = document.getElementById('usdt-price');
  const contractAddressInput = document.getElementById('contract-address');

  let web3;
  let connectedAccount = null;
  let miningInterval = null;
  let miningBalance = 0;
  const miningRate = 0.0007; // Mining rate (SA Points per second).

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
      clearInterval(miningInterval);
      miningBalanceDiv.textContent = '';
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

    miningStartButton.addEventListener('click', () => {
      if (!connectedAccount) {
        alert('Connect your wallet to start mining.');
        return;
      }
      startMining();
    });

    importTokenButton.addEventListener('click', async () => {
      const contractAddress = contractAddressInput.value;
      if (!web3.utils.isAddress(contractAddress)) {
        alert('Invalid contract address.');
        return;
      }

      try {
        await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: contractAddress,
              symbol: 'TOKEN',
              decimals: 18,
            },
          },
        });
        alert('Token imported successfully.');
      } catch (error) {
        console.error('Error importing token:', error);
        alert('Failed to import token.');
      }
    });

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

      // Fetch live prices
      fetchLivePrices();
    }

    async function fetchLivePrices() {
      try {
        // Replace the URLs below with actual APIs for live prices
        const sacoinResponse = await fetch('https://api.example.com/sacoin-price');
        const usdtResponse = await fetch('https://api.example.com/usdt-price');

        const sacoinData = await sacoinResponse.json();
        const usdtData = await usdtResponse.json();

        sacoinPriceDiv.textContent = `SA Coin Price: $${sacoinData.price}`;
        usdtPriceDiv.textContent = `USDT Price: $${usdtData.price}`;
      } catch (error) {
        console.error('Error fetching live prices:', error);
      }
    }

    function startMining() {
      if (miningInterval) {
        alert('Mining is already in progress.');
        return;
      }

      miningInterval = setInterval(() => {
        miningBalance += miningRate;
        miningBalanceDiv.textContent = `Mining Balance: ${miningBalance.toFixed(4)} SA Points`;
      }, 1000);
    }
  } else {
    walletAddressDiv.textContent = 'MetaMask is not installed. Please install MetaMask and try again.';
    connectWalletButton.disabled = true;
  }
});
