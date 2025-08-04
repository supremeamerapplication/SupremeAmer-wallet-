<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SupremeAmer Web3 Wallet</title>
  <script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/appwrite@13.0.1"></script>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-900 text-white min-h-screen p-4">
  <div class="max-w-md mx-auto space-y-6">
    <h1 class="text-2xl font-bold text-center">SupremeAmer Wallet</h1>

    <!-- Wallet Creation -->
    <div class="bg-gray-800 p-4 rounded">
      <button onclick="createWallet()" class="bg-blue-500 w-full p-2 rounded">Create New Wallet</button>
      <div id="walletInfo" class="mt-4 space-y-2 hidden">
        <p><strong>Address:</strong> <span id="walletAddress"></span></p>
        <p><strong>Private Key:</strong> <span id="walletPK"></span></p>
        <p><strong>Mnemonic:</strong> <span id="walletMnemonic"></span></p>
        <button onclick="downloadEncrypted()" class="bg-green-600 w-full p-2 rounded">Download Backup (Encrypted)</button>
      </div>
    </div>

    <!-- Wallet Restore -->
    <div class="bg-gray-800 p-4 rounded">
      <h2 class="text-lg font-semibold mb-2">Restore Wallet</h2>
      <textarea id="restoreInput" rows="4" class="w-full p-2 rounded text-black" placeholder="Enter mnemonic or upload encrypted JSON"></textarea>
      <input type="file" id="fileInput" onchange="loadEncrypted(event)" class="w-full mt-2" />
      <input type="password" id="restorePassword" class="w-full mt-2 p-2 rounded text-black" placeholder="Enter password for decryption" />
      <button onclick="restoreWallet()" class="bg-yellow-500 w-full mt-2 p-2 rounded">Restore</button>
    </div>

    <!-- Balance & Send -->
    <div class="bg-gray-800 p-4 rounded">
      <h2 class="text-lg font-semibold mb-2">Wallet Actions</h2>
      <p><strong>ETH Balance:</strong> <span id="ethBalance">-</span></p>
      <input type="text" id="sendTo" class="w-full p-2 rounded text-black mt-2" placeholder="Recipient Address" />
      <input type="number" id="sendAmount" class="w-full p-2 rounded text-black mt-2" placeholder="Amount in ETH" />
      <button onclick="sendETH()" class="bg-purple-600 w-full mt-2 p-2 rounded">Send ETH</button>
    </div>
  </div>

  <script>
    let wallet, encryptedJson;
    const provider = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth");

    async function createWallet() {
      wallet = ethers.Wallet.createRandom();
      document.getElementById('walletAddress').textContent = wallet.address;
      document.getElementById('walletPK').textContent = wallet.privateKey;
      document.getElementById('walletMnemonic').textContent = wallet.mnemonic.phrase;
      document.getElementById('walletInfo').classList.remove('hidden');

      encryptedJson = await wallet.encrypt(prompt("Set a password for backup encryption:"));
    }

    function downloadEncrypted() {
      const blob = new Blob([encryptedJson], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "wallet_backup.json";
      link.click();
    }

    async function restoreWallet() {
      const input = document.getElementById('restoreInput').value.trim();
      const password = document.getElementById('restorePassword').value.trim();
      try {
        if (input.split(" ").length === 12) {
          wallet = ethers.Wallet.fromMnemonic(input);
        } else {
          wallet = await ethers.Wallet.fromEncryptedJson(input, password);
        }
        wallet = wallet.connect(provider);
        alert("Wallet restored: " + wallet.address);
        updateBalance();
      } catch (err) {
        alert("Restore failed: " + err.message);
      }
    }

    async function loadEncrypted(event) {
      const file = event.target.files[0];
      const text = await file.text();
      document.getElementById('restoreInput').value = text;
    }

    async function updateBalance() {
      if (!wallet) return;
      const balance = await provider.getBalance(wallet.address);
      document.getElementById('ethBalance').textContent = ethers.utils.formatEther(balance) + " ETH";
    }

    async function sendETH() {
      if (!wallet) return alert("Wallet not loaded");
      const to = document.getElementById('sendTo').value.trim();
      const amount = document.getElementById('sendAmount').value.trim();
      try {
        const tx = await wallet.sendTransaction({
          to,
          value: ethers.utils.parseEther(amount)
        });
        alert("Transaction sent: " + tx.hash);
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  </script>
</body>
</html>
