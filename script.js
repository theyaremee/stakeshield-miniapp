// Constants for calculations
const TON_PRICE_USD = 2.0; // approximate price of TON in USD
const DAILY_RATE_PERCENT = 0.01; // 1% daily reward

// DOM element references
const stakeRange = document.getElementById('stakeRange');
const selectedValue = document.getElementById('selectedValue');
const summaryStake = document.getElementById('summaryStake');
const summaryUSD = document.getElementById('summaryUSD');
const summaryDaily = document.getElementById('summaryDaily');
const summaryYearly = document.getElementById('summaryYearly');
const connectStakeBtn = document.getElementById('connectStake');
const walletModal = document.getElementById('walletModal');
const closeModalBtn = document.getElementById('closeModal');
const walletOptions = document.querySelectorAll('.wallet-option');

// Page navigation elements
const navHome = document.getElementById('navHome');
const navEarn = document.getElementById('navEarn');
const navProfile = document.getElementById('navProfile');
const navBoosters = document.getElementById('navBoosters');
const pages = {
  home: document.getElementById('homePage'),
  earn: document.getElementById('earnPage'),
  profile: document.getElementById('profilePage'),
  boosters: document.getElementById('boostersPage'),
};

// Handle slider changes
function updateSummary() {
  const value = parseFloat(stakeRange.value);
  // Update selected value display
  selectedValue.textContent = `${value.toFixed(1)} TON`;
  summaryStake.textContent = `${value.toFixed(1)} TON`;
  // Calculate USD
  const usdValue = value * TON_PRICE_USD;
  summaryUSD.textContent = `$${usdValue.toFixed(2)}`;
  // Calculate rewards
  const dailyReward = value * DAILY_RATE_PERCENT;
  const yearlyReward = dailyReward * 365;
  summaryDaily.textContent = `${dailyReward.toFixed(3)} TON`;
  summaryYearly.textContent = `${yearlyReward.toFixed(2)} TON`;
}

stakeRange.addEventListener('input', updateSummary);

// Initialize summary on page load
updateSummary();

// Navigation handler
function showPage(page) {
  Object.keys(pages).forEach((key) => {
  pages[key].classList.add('hidden');
  });
  pages[page].classList.remove('hidden');
  // Update active nav item
  navHome.classList.remove('active');
  navEarn.classList.remove('active');
  navProfile.classList.remove('active');
  navBoosters.classList.remove('active');
  if (page === 'home') navHome.classList.add('active');
  if (page === 'earn') navEarn.classList.add('active');
  if (page === 'boosters') navBoosters.classList.add('active');
  if (page === 'profile') navProfile.classList.add('active');
}

navHome.addEventListener('click', () => showPage('home'));
navEarn.addEventListener('click', () => showPage('earn'));
navProfile.addEventListener('click', () => showPage('profile'));
navBoosters.addEventListener('click', () => showPage('boosters'));

// Wallet modal openers
connectStakeBtn.addEventListener('click', () => {
  walletModal.classList.remove('hidden');
});
document.getElementById('connectProfile').addEventListener('click', () => {
  walletModal.classList.remove('hidden');
});

// Close modal handler
closeModalBtn.addEventListener('click', () => {
  walletModal.classList.add('hidden');
});

// When a wallet option is selected
walletOptions.forEach((btn) => {
  btn.addEventListener('click', () => {
    const walletName = btn.dataset.wallet;
    alert(`Connecting to ${walletName} (not implemented)`);
    walletModal.classList.add('hidden');
  });
});

// Optionally, close modal when clicking outside of content
walletModal.addEventListener('click', (e) => {
  if (e.target === walletModal) {
    walletModal.classList.add('hidden');
  }
});

// Display contract address on profile page
const contractAddrElem = document.getElementById('contractAddress');
const CONTRACT_ADDRESS = 'UQA6z8ooJnToTmuHzvtF9n9QFQPLotEuwelzMdbwo4I4GESC';
if (contractAddrElem) {
  contractAddrElem.textContent = CONTRACT_ADDRESS;
}

// Boosters data
const boosters = [
  { name: 'Starter', percent: 0.1, active: 1247, cost: 2, tag: null },
  { name: 'Bronze', percent: 0.5, active: 892, cost: 10, tag: null },
  { name: 'Silver', percent: 1.0, active: 614, cost: 25, tag: 'hot' },
  { name: 'Gold', percent: 2.0, active: 287, cost: 60, tag: 'best' },
  { name: 'Platinum', percent: 5.0, active: 96, cost: 175, tag: null },
  { name: 'Diamond', percent: 10.0, active: 41, cost: 450, tag: null },
];

// Render boosters list
const boostListElem = document.getElementById('boostList');
const boostBuyContainer = document.getElementById('boostBuyContainer');
const boostBuyButton = document.getElementById('boostBuyButton');
let selectedBoost = null;

function renderBoosters() {
  boostListElem.innerHTML = '';
  boosters.forEach((boost, index) => {
    const item = document.createElement('div');
    item.className = 'boost-item';
    item.dataset.index = index;
    if (selectedBoost === index) item.classList.add('selected');
    // Build inner HTML with optional tag label
    const tagLabel = boost.tag ? `<span class="boost-label ${boost.tag}">${boost.tag.toUpperCase()}</span>` : '';
    item.innerHTML = `
      <div class="boost-info">
        <div class="boost-title">
          <strong>${boost.name}</strong>
          ${tagLabel}
        </div>
        <span>+${boost.percent}% / day</span>
        <span>${boost.active} active</span>
      </div>
      <div class="boost-cost">
        <!-- Use Font Awesome coins icon instead of external image for TON logo -->
        <i class="fa-solid fa-coins ton-icon" aria-hidden="true"></i>
        ${boost.cost} TON
      </div>
    `;
    item.addEventListener('click', () => {
      selectedBoost = index;
      updateBoostSelection();
    });
    boostListElem.appendChild(item);
  });
  updateBoostSelection();
}

function updateBoostSelection() {
  const items = document.querySelectorAll('.boost-item');
  items.forEach((it, idx) => {
    it.classList.toggle('selected', idx === selectedBoost);
  });
  if (selectedBoost !== null) {
    const boost = boosters[selectedBoost];
    boostBuyContainer.classList.remove('hidden');
    boostBuyButton.textContent = `Buy ${boost.name} for ${boost.cost} TON`;
  } else {
    boostBuyContainer.classList.add('hidden');
  }
}

boostBuyButton.addEventListener('click', () => {
  if (selectedBoost !== null) {
    const boost = boosters[selectedBoost];
    alert(`Purchasing ${boost.name} booster for ${boost.cost} TON to contract ${CONTRACT_ADDRESS} (functionality not implemented).`);
  }
});

// Boost Program button opens boosters page
document.getElementById('boostButton').addEventListener('click', () => {
  showPage('boosters');
});

// Initialize boosters on page load
renderBoosters();