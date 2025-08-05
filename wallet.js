<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SupremeAmer Web3 Wallet</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/ethers@6.6.2/dist/ethers.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@0xsequence/waas@1.2.0/dist/waas.js"></script>
</head>
<body class="bg-gray-100 text-gray-800">

  <!-- Mnemonic Modal -->
  <div id="mnemonic-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-sm">
      <h3 class="text-lg font-bold mb-2">Import Wallet</h3>
      <input type="text" id="mnemonic-input" class="w-full border px-3 py-2 rounded mb-2" placeholder="Enter mnemonic phrase"/>
      <button id="import-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg w-full mb-2">Import</button>
      <button onclick="closeMnemonicModal()" class="text-red-600 underline w-full">Cancel</button>
    </div>
  </div>

  <div class="min-h-screen flex flex-col items-center justify-center p-4">
    <div id="wallet-section" class="w-full max-w-md bg-white p-6 rounded-xl shadow-xl">
      <h2 class="text-2xl font-bold mb-4 text-center">SupremeAmer Wallet</h2>
      <div id="connect-wallet" class="flex flex-col gap-4">
        <button id="create-wallet-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg">Create Wallet</button>
        <button id="import-wallet-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg">Import Wallet</button>
      </div>
      <div id="main-dashboard" class="hidden">
        <p class="text-center mb-4 font-semibold">Connected Address: <span id="wallet-address" class="break-all"></span></p>
        <div class="mb-4">
          <h3 class="text-lg font-semibold mb-2">Balances</h3>
          <div id="balances" class="space-y-2">
            <p>BNB: <span id="bnb-balance">Loading...</span></p>
            <p>ETH: <span id="eth-balance">Loading...</span></p>
            <p>SupremeAmer: <span id="supremeamer-balance">Loading...</span></p>
          </div>
        </div>
        <div class="mb-4">
          <h3 class="text-lg font-semibold mb-2">Send Tokens</h3>
          <input type="text" id="send-to" placeholder="Recipient Address" class="w-full border px-3 py-2 rounded mb-2" />
          <input type="number" id="send-amount" placeholder="Amount" class="w-full border px-3 py-2 rounded mb-2" min="0" step="any" />
          <select id="token-type" class="w-full border px-3 py-2 rounded mb-2">
            <option value="bnb">BNB</option>
            <option value="eth">ETH</option>
            <option value="supremeamer">SupremeAmer</option>
          </select>
          <button id="send-btn" class="bg-purple-600 text-white px-4 py-2 rounded-lg w-full">Send</button>
        </div>
        <div class="text-center">
          <button onclick="disconnectWallet()" class="text-sm text-red-600 underline">Disconnect</button>
        </div>
      </div>
      <div id="feedback" class="text-center text-sm mt-4 text-red-600"></div>
    </div>
  </div>
  <script>
    let provider, signer, walletAddress;
    let supremeAmerContract;

    // SupremeAmer token contract details (add missing ERC20 ABI)
    const supremeAmerAddress = "0x06dB6BA51c18348A4C47465CAB643E62038969dd";
    const supremeAmerABI = [
      // ERC20 balanceOf
      { "constant": true, "inputs": [{ "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function", "stateMutability": "view" },
      // ERC20 transfer
      { "constant": false, "inputs": [{ "name": "to", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "type": "function" },
      // Owner & events (as in your original ABI)
      {"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},
      {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},
      {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},
      {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}
    ];

    // UI Elements
    const feedback = document.getElementById("feedback");
    const sendBtn = document.getElementById("send-btn");
    const createWalletBtn = document.getElementById("create-wallet-btn");
    const importWalletBtn = document.getElementById("import-wallet-btn");
    const importBtn = document.getElementById("import-btn");

    // Show/hide mnemonic modal
    importWalletBtn.onclick = () => {
      document.getElementById('mnemonic-modal').classList.remove('hidden');
    };
    function closeMnemonicModal() {
      document.getElementById('mnemonic-modal').classList.add('hidden');
      document.getElementById("mnemonic-input").value = '';
      feedback.textContent = '';
    }

    // Create Wallet
    createWalletBtn.onclick = async () => {
      feedback.textContent = '';
      try {
        const wallet = ethers.Wallet.createRandom();
        if (!window.ethereum) throw new Error("MetaMask or Web3 provider not found.");
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = wallet.connect(provider);
        walletAddress = wallet.address;
        setupUI(walletAddress);
      } catch (err) {
        feedback.textContent = `Error: ${err.message}`;
      }
    };

    // Import Wallet
    importBtn.onclick = async () => {
      feedback.textContent = '';
      const mnemonic = document.getElementById("mnemonic-input").value.trim();
      if (!mnemonic) return feedback.textContent = "Please enter a mnemonic phrase.";
      try {
        const wallet = ethers.Wallet.fromPhrase(mnemonic);
        if (!window.ethereum) throw new Error("MetaMask or Web3 provider not found.");
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = wallet.connect(provider);
        walletAddress = wallet.address;
        closeMnemonicModal();
        setupUI(walletAddress);
      } catch (err) {
        feedback.textContent = `Error: ${err.message}`;
      }
    };

    // Setup UI after connection
    async function setupUI(address) {
      document.getElementById("connect-wallet").classList.add("hidden");
      document.getElementById("main-dashboard").classList.remove("hidden");
      document.getElementById("wallet-address").textContent = address;
      await updateBalances(address);
    }

    // Update token balances
    async function updateBalances(address) {
      feedback.textContent = '';
      document.getElementById("bnb-balance").textContent = "Loading...";
      document.getElementById("eth-balance").textContent = "Loading...";
      document.getElementById("supremeamer-balance").textContent = "Loading...";
      try {
        // BNB (assume BSC mainnet)
        const bnb = await provider.getBalance(address);
        document.getElementById("bnb-balance").textContent = ethers.formatEther(bnb);

        // ETH
        const ethProvider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/YOUR_INFURA_ID");
        const ethBalance = await ethProvider.getBalance(address);
        document.getElementById("eth-balance").textContent = ethers.formatEther(ethBalance);

        // SupremeAmer (ERC20)
        supremeAmerContract = new ethers.Contract(supremeAmerAddress, supremeAmerABI, provider);
        let tokenBalance = "0";
        try {
          tokenBalance = await supremeAmerContract.balanceOf(address);
        } catch { /* skip */ }
        document.getElementById("supremeamer-balance").textContent = ethers.formatUnits(tokenBalance, 18);
      } catch (err) {
        feedback.textContent = "Error fetching balances: " + err.message;
      }
    }

    // Validate Ethereum address
    function isValidAddress(addr) {
      try { return ethers.isAddress(addr); }
      catch { return false; }
    }

    // Send tokens
    sendBtn.onclick = async () => {
      feedback.textContent = '';
      sendBtn.disabled = true;
      sendBtn.textContent = "Sending...";
      const to = document.getElementById("send-to").value.trim();
      const amount = document.getElementById("send-amount").value.trim();
      const token = document.getElementById("token-type").value;

      if (!isValidAddress(to)) {
        feedback.textContent = "Invalid recipient address.";
        sendBtn.disabled = false; sendBtn.textContent = "Send";
        return;
      }
      if (!amount || isNaN(amount) || Number(amount) <= 0) {
        feedback.textContent = "Enter a valid amount.";
        sendBtn.disabled = false; sendBtn.textContent = "Send";
        return;
      }

      try {
        let tx;
        if (token === "bnb") {
          tx = await signer.sendTransaction({ to, value: ethers.parseEther(amount) });
        } else if (token === "eth") {
          const ethProvider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/YOUR_INFURA_ID");
          const ethSigner = signer.connect(ethProvider);
          tx = await ethSigner.sendTransaction({ to, value: ethers.parseEther(amount) });
        } else {
          supremeAmerContract = supremeAmerContract.connect(signer);
          tx = await supremeAmerContract.transfer(to, ethers.parseUnits(amount, 18));
        }
        await tx.wait();
        feedback.textContent = "Transaction sent!";
        await updateBalances(walletAddress);
      } catch (err) {
        feedback.textContent = "Transaction failed: " + err.message;
      }
      sendBtn.disabled = false;
      sendBtn.textContent = "Send";
    };

    // Disconnect
    function disconnectWallet() {
      location.reload();
    }
  </script>
</body>
</html>