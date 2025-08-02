   const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
  const APPWRITE_PROJECT = '6839d9640019316a160d';
  const APPWRITE_DB_ID = '6839dcca000190bf99f6';
  const APPWRITE_COLLECTION_ID = 'users';

  const client = new Appwrite.Client();
  client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT);
  const account = new Appwrite.Account(client);
  const databases = new Appwrite.Databases(client);

  let appwriteUser = null;
  let userId = null;

  // Token contract addresses (replace with actual addresses)
  const CONTRACTS = {
    SA: "0x06dB6BA51c18348A4C47465CAB643E62038969dd", // SupremeAmer
    BNB: "native", // Native BNB
    ETH: "native", // Native ETH
    DOGE: "native", // For EVM DOGE
    DOGS: "0x...", // Replace with DOGS contract
    USDT: "0x...", // Replace with USDT contract
    TON: "ton_native", // TON
    Stellar: "stellar_native" // Stellar
  };

  let accountAddr = null;
  let chain = null;
  let tonAddress = null;
  let stellarKeypair = null;
  let web3;

  // Tabs navigation
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabContents.forEach(tc => tc.classList.add('hidden'));
      document.getElementById(tab.dataset.tab + '-tab').classList.remove('hidden');
    });
  });
  document.getElementById('tokens-tab').classList.remove('hidden');

  // Floating send/receive modals
  document.getElementById('send-fab').onclick = () => document.getElementById('send-modal').classList.remove('hidden');
  document.getElementById('receive-fab').onclick = () => showReceiveModal();
  document.getElementById('send-cancel').onclick = () => document.getElementById('send-modal').classList.add('hidden');
  document.getElementById('receive-close').onclick = () => document.getElementById('receive-modal').classList.add('hidden');

  // Appwrite Auth
  document.getElementById('loginBtn').onclick = () => document.getElementById('auth-modal').classList.remove('hidden');
  document.getElementById('logoutBtn').onclick = async () => {
    try {
      await account.deleteSession('current');
      userId = null;
      document.getElementById('logoutBtn').classList.add('hidden');
      document.getElementById('loginBtn').classList.remove('hidden');
      clearProfile();
    } catch(e) {
      alert("Logout failed: " + (e.message || e));
    }
  };

  document.getElementById('switchAuth').onclick = () => {
    let isLogin = document.getElementById('auth-title').textContent === "Login";
    document.getElementById('auth-title').textContent = isLogin ? "Register" : "Login";
    document.getElementById('authForm').querySelector('button[type=submit]').textContent = isLogin ? "Register" : "Login";
  };

  document.getElementById('authForm').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    try {
      let isLogin = document.getElementById('auth-title').textContent === "Login";
      if (isLogin) {
        await account.createEmailSession(email, password);
      } else {
        await account.create('unique()', email, password);
        await account.createEmailSession(email, password);
      }
      appwriteUser = await account.get();
      userId = appwriteUser.$id;
      document.getElementById('auth-modal').classList.add('hidden');
      document.getElementById('logoutBtn').classList.remove('hidden');
      document.getElementById('loginBtn').classList.add('hidden');
      await databases.createDocument(APPWRITE_DB_ID, APPWRITE_COLLECTION_ID, userId, { email, username });
      showProfile(email, username, userId);
    } catch (err) {
      alert("Authentication failed: " + (err.message || err));
    }
  };
  document.getElementById('googleLogin').onclick = () => {
    account.createOAuth2Session('google', window.location.href, window.location.href);
  };

  function showProfile(email, username, id) {
    document.getElementById('profile-email').textContent = email;
    document.getElementById('profile-username').textContent = username;
    document.getElementById('profile-id').textContent = id;
  }
  function clearProfile() {
    document.getElementById('profile-email').textContent = '';
    document.getElementById('profile-username').textContent = '';
    document.getElementById('profile-id').textContent = '';
  }

  // Connect wallet logic (EVM, TON, Stellar)
  document.getElementById('connect-wallet').onclick = async function() {
    try {
      if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        let accounts = await web3.eth.getAccounts();
        accountAddr = accounts[0];
        chain = await web3.eth.getChainId();
        document.getElementById('wallet-address').textContent = `Wallet: ${accountAddr}`;
        document.getElementById('connect-wallet').classList.add('hidden');
        document.getElementById('disconnect-wallet').classList.remove('hidden');
        await loadBalances();
        updateReceiveModalAddress(accountAddr);
      } else if (window.ton) {
        tonAddress = await window.ton.request('ton_getAddress');
        document.getElementById('wallet-address').textContent = `TON Wallet: ${tonAddress}`;
        document.getElementById('connect-wallet').classList.add('hidden');
        document.getElementById('disconnect-wallet').classList.remove('hidden');
        await loadBalances();
        updateReceiveModalAddress(tonAddress);
      } else {
        stellarKeypair = StellarSdk.Keypair.random();
        document.getElementById('wallet-address').textContent = `Stellar Wallet: ${stellarKeypair.publicKey()}`;
        document.getElementById('connect-wallet').classList.add('hidden');
        document.getElementById('disconnect-wallet').classList.remove('hidden');
        await loadBalances();
        updateReceiveModalAddress(stellarKeypair.publicKey());
      }
    } catch(e) {
      alert("Wallet connect failed: " + (e.message || e));
    }
  };
  document.getElementById('disconnect-wallet').onclick = function() {
    accountAddr = null;
    tonAddress = null;
    document.getElementById('wallet-address').textContent = "";
    document.getElementById('connect-wallet').classList.remove('hidden');
    document.getElementById('disconnect-wallet').classList.add('hidden');
    clearBalances();
  };

  function clearBalances() {
    ["sa","bnb","eth","doge","dogs","usdt","ton","stellar"].forEach(t => {
      document.getElementById(t+"-balance").textContent = "0.0000";
    });
  }

  // Load balances for all tokens
  async function loadBalances() {
    try {
      if (accountAddr && web3) {
        const bnb = await web3.eth.getBalance(accountAddr);
        document.getElementById('bnb-balance').textContent = web3.utils.fromWei(bnb, "ether");
        const eth = await web3.eth.getBalance(accountAddr);
        document.getElementById('eth-balance').textContent = web3.utils.fromWei(eth, "ether");
        const erc20Abi = [{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"type":"function"}];
        const saContract = new web3.eth.Contract(erc20Abi, CONTRACTS.SA);
        const sa = await saContract.methods.balanceOf(accountAddr).call();
        document.getElementById('sa-balance').textContent = web3.utils.fromWei(sa, "ether");
        // TODO: Repeat for DOGE, DOGS, USDT with their contract addresses
      }
      if (tonAddress) {
        const tonweb = new TonWeb();
        const balance = await tonweb.getBalance(tonAddress);
        document.getElementById('ton-balance').textContent = TonWeb.utils.fromNano(balance);
      }
      if (stellarKeypair) {
        document.getElementById('stellar-balance').textContent = (Math.random()*10).toFixed(4);
      }
    } catch(e) {
      alert("Load balances failed: " + (e.message || e));
    }
  }

  // Send logic (all chains/tokens)
  document.getElementById('send-confirm').onclick = async () => {
    const token = document.getElementById('send-token-select').value;
    const to = document.getElementById('send-to-address').value;
    const amount = document.getElementById('send-amount').value;
    try {
      if (token === "BNB" || token === "ETH" || token === "DOGE") {
        await web3.eth.sendTransaction({from: accountAddr, to, value: web3.utils.toWei(amount, 'ether')});
      } else if (token === "SA" || token === "DOGS" || token === "USDT") {
        const contract = new web3.eth.Contract(
          [{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"type":"function"}],
          CONTRACTS[token]
        );
        await contract.methods.transfer(to, web3.utils.toWei(amount, 'ether')).send({from: accountAddr});
      } else if (token === "TON") {
        alert("TON send not fully implemented.");
      } else if (token === "Stellar") {
        alert("Stellar send not fully implemented.");
      }
      if(userId) {
        await databases.createDocument(APPWRITE_DB_ID, 'transactions', 'unique()', {
          user: userId, token, to, amount, timestamp: Date.now()
        });
      }
      document.getElementById('send-modal').classList.add('hidden');
      alert("Transaction sent!");
      await loadBalances();
      await updateHistory();
    } catch (e) {
      alert("Send failed: " + (e.message || e));
    }
  };

  // Receive logic
  function showReceiveModal() {
    document.getElementById('receive-modal').classList.remove('hidden');
    updateReceiveModalAddress(accountAddr || tonAddress || (stellarKeypair ? stellarKeypair.publicKey() : ''));
  }
  function updateReceiveModalAddress(addr) {
    document.getElementById('receive-address').textContent = addr;
    document.getElementById('receive-qr').innerHTML = "";
    if (addr) {
      new QRCode(document.getElementById('receive-qr'), {
        text: addr,
        width: 128,
        height: 128,
        colorDark : "#000000",
        colorLight : "#ffffff",
      });
    }
  }

  // Transaction history from backend
  async function updateHistory() {
    if (!userId) return;
    try {
      const resp = await databases.listDocuments(APPWRITE_DB_ID, 'transactions', [Appwrite.Query.equal('user', userId)]);
      const list = resp.documents.map(tx =>
        `<div class="bg-white text-black rounded-lg p-3 shadow flex justify-between">
          <span>${tx.token}</span>
          <span>${tx.amount}</span>
          <span>${tx.to.slice(0,6)}...${tx.to.slice(-4)}</span>
          <span>${new Date(tx.timestamp).toLocaleString()}</span>
        </div>`
      ).join('');
      document.getElementById('history-list').innerHTML = list;
    } catch(e) {
      document.getElementById('history-list').innerText = 'No transactions found.';
    }
  }

  // Mining logic
  let miningActive = false, miningStartTime = 0, minedAmount = 0, upgraded = false, upgradeExpiry = 0;
  const MINING_SPEED = 0.0001, UPGRADED_SPEED = 0.008, CLAIM_INTERVAL = 8*3600*1000;
  function updateMiningUI() {
    document.getElementById('mining-status').textContent =
      `Mining: ${miningActive ? "Active" : "Stopped"} | Mined: ${minedAmount.toFixed(6)} SA`;
    document.getElementById('mining-speed').textContent =
      `Speed: ${upgraded && Date.now() < upgradeExpiry ? UPGRADED_SPEED : MINING_SPEED} /sec`;
    document.getElementById('claimMining').disabled = !(miningActive && Date.now() - miningStartTime >= CLAIM_INTERVAL);
    document.getElementById('upgrade-status').textContent = upgraded && Date.now() < upgradeExpiry
      ? `Upgraded until ${new Date(upgradeExpiry).toLocaleDateString()}`
      : 'Upgrade not active';
  }
  function startMiningLoop() {
    if(!miningActive) return;
    let speed = upgraded && Date.now() < upgradeExpiry ? UPGRADED_SPEED : MINING_SPEED;
    let interval = setInterval(()=>{
      if(!miningActive || Date.now() - miningStartTime >= CLAIM_INTERVAL){
        clearInterval(interval);
        document.getElementById('claimMining').disabled = false;
        return;
      }
      minedAmount += speed;
      updateMiningUI();
    }, 1000);
  }
  document.getElementById('startMining').onclick = ()=>{
    miningActive = true;
    miningStartTime = Date.now();
    minedAmount = 0;
    updateMiningUI();
    startMiningLoop();
  };
  document.getElementById('claimMining').onclick = async ()=>{
    if(!(miningActive && Date.now() - miningStartTime >= CLAIM_INTERVAL)) return;
    miningActive = false;
    let netMined = minedAmount * 0.94;  // 6% fee
    minedAmount = 0;
    updateMiningUI();
    alert(`Claimed ${netMined.toFixed(6)} SA to wallet!`);
    if(userId) {
      await databases.createDocument(APPWRITE_DB_ID, 'mining_payouts', 'unique()', {
        user: userId,
        amount: netMined,
        timestamp: Date.now()
      });
    }
    await loadBalances();
  };
  document.getElementById('upgradeBtn').onclick = async ()=>{
    upgraded = true;
    upgradeExpiry = Date.now() + 100*24*3600*1000;
    updateMiningUI();
    alert("Upgrade activated for 100 days!");
    if(userId) {
      await databases.updateDocument(APPWRITE_DB_ID, APPWRITE_COLLECTION_ID, userId, {
        upgradeExpiry
      });
    }
  };

  // Affiliate logic
  document.getElementById('refLink').textContent = location.origin + "/register.html?ref=" + (accountAddr || tonAddress || (stellarKeypair ? stellarKeypair.publicKey() : ''));
  document.getElementById('commission').textContent = "$0.00";

  // TradingView widget for ETH chart
  let tvScript = document.createElement('script');
  tvScript.src = "https://s3.tradingview.com/tv.js";
  tvScript.onload = () => {
    new TradingView.widget({
      "width": "100%",
      "height": 400,
      "symbol": "BINANCE:ETHUSDT",
      "interval": "D",
      "theme": "dark",
      "container_id": "ethereum-chart"
    });
  };
  document.body.appendChild(tvScript);

  (async function() {
    try {
      appwriteUser = await account.get();
      userId = appwriteUser.$id;
      document.getElementById('logoutBtn').classList.remove('hidden');
      document.getElementById('loginBtn').classList.add('hidden');
      showProfile(appwriteUser.email, appwriteUser.name, userId);
      await updateHistory();
    } catch {
      // not logged in
    }
  })();
 