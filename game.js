// Example data
const levels = [
  { word: "coin", hint: "Currency used in blockchain" },
  { word: "wallet", hint: "Used to store cryptocurrencies" },
  { word: "blockchain", hint: "Technology behind crypto" },
  // Add more levels with increasing difficulty up to 35...
];

let currentLevel = 0;
let reward = 0;

// Ethereum wallet connection
let provider, signer;

async function connectWallet() {
  if (window.ethereum) {
    try {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = provider.getSigner();
      document.getElementById("wallet-status").textContent = "Wallet connected!";
    } catch (error) {
      document.getElementById("wallet-status").textContent = "Failed to connect wallet.";
    }
  } else {
    alert("Please install MetaMask to use this feature");
  }
}

function loadLevel() {
  const level = levels[currentLevel];
  document.getElementById("level").textContent = currentLevel + 1;
  document.getElementById("puzzle").textContent = `Hint: ${level.hint}`;
  document.getElementById("user-input").value = "";
  document.getElementById("message").textContent = "";
}

function submitAnswer() {
  const answer = document.getElementById("user-input").value.toLowerCase();
  if (answer === levels[currentLevel].word) {
    reward += 10;
    document.getElementById("reward").textContent = `${reward} SupremeAmer Coins`;
    currentLevel++;
    if (currentLevel < levels.length) {
      loadLevel();
    } else {
      document.getElementById("message").textContent = "Congratulations! You've completed all levels.";
    }
  } else {
    document.getElementById("message").textContent = "Wrong answer. Try again!";
  }
}

async function useBoost() {
  if (!signer) {
    alert("Connect your wallet to use this feature.");
    return;
  }

  const level = levels[currentLevel];
  const transaction = {
    to: "0xYourEthereumAddressHere", // Replace with your ETH address
    value: ethers.utils.parseEther("0.00007"),
  };

  try {
    await signer.sendTransaction(transaction);
    document.getElementById("message").textContent = `Boost used! The answer is: ${level.word}`;
    currentLevel++;
    if (currentLevel < levels.length) {
      loadLevel();
    } else {
      document.getElementById("message").textContent = "Congratulations! You've completed all levels.";
    }
  } catch (error) {
    alert("Transaction failed.");
  }
}

// Event listeners
document.getElementById("submit-button").addEventListener("click", submitAnswer);
document.getElementById("boost-button").addEventListener("click", useBoost);

// Initial setup
connectWallet();
loadLevel();
