// Replace with your Project ID from WalletConnect Cloud
const PROJECT_ID = "YOUR_WALLETCONNECT_PROJECT_ID"; 

// WalletConnect provider for mobile wallets
const provider = new WalletConnectProvider({
    infuraId: PROJECT_ID,
    qrcodeModal: QRCodeModal,
});

// Ethers.js provider and signer
let ethersProvider;
let signer;
let currentAddress = null;

// DOM elements
const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const statusMessage = document.getElementById('status-message');
const walletInfoSection = document.getElementById('wallet-info');
const connectSection = document.getElementById('connect-section');
const transactionFormSection = document.getElementById('transaction-form');
const addressSpan = document.getElementById('address');
const balanceSpan = document.getElementById('balance');
const sendForm = document.getElementById('send-form');
const recipientInput = document.getElementById('recipient-input');
const amountInput = document.getElementById('amount-input');

// Initialize UI state
function resetUI() {
    connectSection.style.display = 'block';
    walletInfoSection.style.display = 'none';
    transactionFormSection.style.display = 'none';
    statusMessage.textContent = '';
    currentAddress = null;
}

// Update UI with wallet info
async function updateUI(address) {
    if (!address) {
        resetUI();
        return;
    }

    currentAddress = address;
    addressSpan.textContent = address;
    connectSection.style.display = 'none';
    walletInfoSection.style.display = 'block';
    transactionFormSection.style.display = 'block';

    try {
        const balanceWei = await ethersProvider.getBalance(address);
        const balanceEth = ethers.utils.formatEther(balanceWei);
        balanceSpan.textContent = `${parseFloat(balanceEth).toFixed(4)} ETH`;
    } catch (error) {
        statusMessage.textContent = `Error fetching balance: ${error.message}`;
        statusMessage.className = 'error';
    }
}

// Event listeners for account and chain changes
provider.on("accountsChanged", (accounts) => {
    if (accounts.length > 0) {
        updateUI(accounts[0]);
    } else {
        resetUI();
    }
});

provider.on("chainChanged", (chainId) => {
    // Reload if the network changes
    window.location.reload();
});

provider.on("disconnect", (code, reason) => {
    resetUI();
    statusMessage.textContent = 'Disconnected from wallet.';
    statusMessage.className = 'success';
});

// Connect wallet handler
connectBtn.addEventListener('click', async () => {
    try {
        statusMessage.textContent = 'Connecting... Check your wallet.';
        statusMessage.className = '';

        // Enable session (triggers QR Code modal on desktop, deep link on mobile)
        const accounts = await provider.enable();

        // Initialize Ethers provider and signer
        ethersProvider = new ethers.providers.Web3Provider(provider);
        signer = ethersProvider.getSigner();

        updateUI(accounts[0]);
        statusMessage.textContent = 'Wallet connected successfully!';
        statusMessage.className = 'success';

    } catch (error) {
        console.error("Connection failed:", error);
        statusMessage.textContent = `Connection failed: ${error.message}`;
        statusMessage.className = 'error';
        resetUI();
    }
});

// Disconnect wallet handler
disconnectBtn.addEventListener('click', async () => {
    try {
        await provider.disconnect();
    } catch (error) {
        console.error("Disconnection failed:", error);
        statusMessage.textContent = `Disconnection failed: ${error.message}`;
        statusMessage.className = 'error';
    }
});

// Send transaction handler
sendForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!signer || !currentAddress) {
        statusMessage.textContent = 'Please connect your wallet first.';
        statusMessage.className = 'error';
        return;
    }

    const recipient = recipientInput.value;
    const amountEth = amountInput.value;

    try {
        statusMessage.textContent = 'Sending transaction... Confirm in your wallet.';
        statusMessage.className = '';

        // Create transaction object
        const tx = {
            to: recipient,
            value: ethers.utils.parseEther(amountEth)
        };

        // Sign and send the transaction
        const txResponse = await signer.sendTransaction(tx);
        statusMessage.textContent = `Transaction submitted. Hash: ${txResponse.hash}`;
        statusMessage.className = 'success';

        // Wait for transaction confirmation
        await txResponse.wait();
        statusMessage.textContent = `Transaction confirmed! Hash: ${txResponse.hash}`;
        updateUI(currentAddress); // Refresh balance
        recipientInput.value = '';
        amountInput.value = '';

    } catch (error) {
        console.error("Transaction failed:", error);
        statusMessage.textContent = `Transaction failed: ${error.message}`;
        statusMessage.className = 'error';
    }
});

// Initial state
resetUI();

