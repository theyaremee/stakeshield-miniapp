// StakeShield Revamped Mini‑App
//
// This script powers a modern gamified dApp for earning and staking tokens.
// It manages navigation, tasks, referrals, state persistence, wallet
// connection via TonConnect and interactive features like mystery boxes.

document.addEventListener('DOMContentLoaded', () => {
  /* Adapt colours to Telegram theme if available */
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg && tg.themeParams) {
    const tp = tg.themeParams;
    // Helper to set CSS variable if defined
    const setVar = (varName, value) => {
      if (value) document.documentElement.style.setProperty(varName, value);
    };
    // Map Telegram theme params to CSS variables
    setVar('--bg', tp.bg_color);
    setVar('--card-bg', tp.secondary_bg_color);
    setVar('--secondary-bg', tp.bg_color); // fallback
    setVar('--text', tp.text_color);
    setVar('--muted', tp.hint_color);
    setVar('--accent', tp.button_color || tp.accent_text_color);
    setVar('--accent-light', tp.button_color || tp.accent_text_color);
  }
  // Signal to Telegram that the app is ready. This prevents white flashes on load.
  if (tg && typeof tg.ready === 'function') tg.ready();
  /* Helper selector */
  const $ = (sel) => document.querySelector(sel);

  /* Utility functions */
  function formatNumber(num) {
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  function generateReferralCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  function truncateAddress(addr) {
    if (!addr) return '';
    return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
  }

  /* Default tasks definition */
  const defaultTasks = [
    {
      id: 'followX',
      title: 'Follow us on X',
      desc: 'Social',
      reward: 50,
      type: 'link',
      url: 'https://x.com',
    },
    {
      id: 'joinTelegram',
      title: 'Join Telegram channel',
      desc: 'Community',
      reward: 300,
      type: 'link',
      url: 'https://t.me',
    },
    {
      id: 'inviteFriends',
      title: 'Invite 5 friends',
      desc: 'Referral',
      reward: 2500,
      type: 'progress',
      target: 5,
    },
    {
      id: 'shareReferral',
      title: 'Share referral link',
      desc: 'Referral',
      reward: 100,
      type: 'share',
    },
    {
      id: 'completeKYC',
      title: 'Complete KYC verification',
      desc: 'Onboarding',
      reward: 1500,
      type: 'link',
      url: 'https://example.com/kyc',
    },
    {
      id: 'firstSwap',
      title: 'First swap transaction',
      desc: 'DeFi',
      reward: 750,
      type: 'link',
      url: 'https://example.com/swap',
    },
  ];

  /* Vault assets definition. These are example assets displayed in the Vault
   * page. WAVE represents the points earned in this mini‑app. Other assets
   * showcase familiar cryptocurrencies and stablecoins. Prices are hardcoded
   * except for the fictional WAVE token. You can adjust amounts or fetch
   * live prices via an API if desired. */
  const vaultAssets = [
    { symbol: 'WAVE', name: 'Wave', amount: () => state.waveBalance, price: 0.02 },
    { symbol: 'TON', name: 'Toncoin', amount: 12.5, price: 2.4 },
    { symbol: 'USDC', name: 'USD Coin', amount: 150, price: 1 },
    { symbol: 'BTC', name: 'Bitcoin', amount: 0.0032, price: 50000 },
    { symbol: 'ETH', name: 'Ethereum', amount: 0.12, price: 3000 },
  ];

  /* Persistent state management */
  function loadState() {
    const stored = JSON.parse(localStorage.getItem('stakeshield') || '{}');
    const tasksState = stored.tasksState || {};
    const waveBalance = stored.waveBalance || 0;
    const keys = stored.keys || 0;
    const tickets = stored.tickets || 0;
    const nextTicketTime = stored.nextTicketTime || (Date.now() + 3600 * 1000);
    const referralCode = stored.referralCode || generateReferralCode();
    const friendsInvited = stored.friendsInvited || 0;
    const rank = stored.rank || null;
    return { tasksState, waveBalance, keys, tickets, nextTicketTime, referralCode, friendsInvited, rank };
  }

  let state = loadState();

  function saveState() {
    localStorage.setItem('stakeshield', JSON.stringify(state));
  }

  function getTaskState(id) {
    return state.tasksState[id] || {};
  }

  function setTaskState(id, updates) {
    state.tasksState[id] = Object.assign({}, getTaskState(id), updates);
  }

  function getCompletedCount() {
    return defaultTasks.filter((t) => getTaskState(t.id).completed).length;
  }

  function getTasksTotal() {
    return defaultTasks.length;
  }

  /* Navigation */
  const pages = document.querySelectorAll('.page');
  const navItems = document.querySelectorAll('.nav-item');

  function navigateTo(target) {
    pages.forEach((p) => p.classList.remove('active'));
    const page = document.getElementById(target);
    if (page) page.classList.add('active');
    navItems.forEach((item) => {
      const dest = item.getAttribute('data-target');
      if (dest === target) item.classList.add('active');
      else item.classList.remove('active');
    });
  }

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const target = item.getAttribute('data-target');
      navigateTo(target);
    });
  });

  // Additional elements with data-target (see all tasks button, profile menu)
  document.querySelectorAll('[data-target]').forEach((el) => {
    if (el.classList.contains('nav-item')) return;
    el.addEventListener('click', () => {
      const target = el.getAttribute('data-target');
      navigateTo(target);
    });
  });

  /* Render functions */
  function getTaskIcon(task) {
    switch (task.id) {
      case 'followX':
        return '★';
      case 'joinTelegram':
        return '✉️';
      case 'inviteFriends':
        return '👥';
      case 'shareReferral':
        return '🔗';
      case 'completeKYC':
        return '🪪';
      case 'firstSwap':
        return '🔄';
      default:
        return '⭐';
    }
  }

  function renderTasksList() {
    const container = $('#tasksList');
    container.innerHTML = '';
    defaultTasks.forEach((task) => {
      const stateData = getTaskState(task.id);
      const item = document.createElement('div');
      item.className = 'task-item';
      if (stateData.completed) item.classList.add('completed');
      item.dataset.taskId = task.id;

      const iconDiv = document.createElement('div');
      iconDiv.className = 'task-icon';
      iconDiv.innerHTML = getTaskIcon(task);
      item.appendChild(iconDiv);

      const infoDiv = document.createElement('div');
      infoDiv.className = 'task-info';
      const titleP = document.createElement('p');
      titleP.className = 'task-title';
      titleP.textContent = task.title;
      infoDiv.appendChild(titleP);
      const descP = document.createElement('p');
      descP.className = 'task-desc';
      descP.textContent = task.desc;
      infoDiv.appendChild(descP);
      item.appendChild(infoDiv);

      const rewardDiv = document.createElement('div');
      rewardDiv.className = 'task-reward';
      if (task.type === 'progress' && !stateData.completed) {
        const cur = stateData.current || 0;
        rewardDiv.textContent = `${cur}/${task.target}`;
      } else {
        rewardDiv.textContent = `+${task.reward}`;
      }
      item.appendChild(rewardDiv);

      const actionDiv = document.createElement('div');
      actionDiv.className = 'task-action';
      const btn = document.createElement('button');
      if (stateData.completed) {
        btn.textContent = '✓';
        btn.disabled = true;
      } else {
        if (task.type === 'progress') {
          btn.textContent = '+';
        } else {
          btn.textContent = '→';
        }
      }
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleTaskAction(task);
      });
      actionDiv.appendChild(btn);
      item.appendChild(actionDiv);

      container.appendChild(item);
    });
  }

  function renderTasksPreview() {
    const container = $('#tasksPreviewList');
    container.innerHTML = '';
    const previewTasks = defaultTasks.slice(0, 3);
    previewTasks.forEach((task) => {
      const stateData = getTaskState(task.id);
      const item = document.createElement('div');
      item.className = 'preview-item';

      const icon = document.createElement('div');
      icon.className = 'preview-icon';
      icon.innerHTML = getTaskIcon(task);
      item.appendChild(icon);

      const title = document.createElement('div');
      title.className = 'preview-title';
      title.textContent = task.title;
      item.appendChild(title);

      const reward = document.createElement('div');
      reward.className = 'preview-reward';
      if (task.type === 'progress' && !stateData.completed) {
        const cur = stateData.current || 0;
        reward.textContent = `${cur}/${task.target}`;
      } else {
        reward.textContent = `+${task.reward}`;
      }
      item.appendChild(reward);

      container.appendChild(item);
    });
  }

  function updateProgress() {
    const completed = getCompletedCount();
    const total = getTasksTotal();
    $('#tasksProgressText').textContent = `${completed}/${total}`;
    const percent = total > 0 ? (completed / total) * 100 : 0;
    $('#tasksProgressBar').style.width = `${percent}%`;
    // update season summary on home
    $('#homeSeason').textContent = `${completed}/${total}`;
    $('#profileTasksCompleted').textContent = completed;
  }

  function updateHome() {
    $('#homeWaveBalance').textContent = formatNumber(state.waveBalance);
    $('#homeKeys').textContent = state.keys;
    $('#homeTickets').textContent = state.tickets;
    $('#homeRank').textContent = state.rank || '—';
    $('#homeSeason').textContent = `${getCompletedCount()}/${getTasksTotal()}`;
  }

  function updateProfile() {
    $('#profileWaveBalance').textContent = formatNumber(state.waveBalance);
    $('#profileKeys').textContent = state.keys;
    $('#profileTickets').textContent = state.tickets;
    $('#profileFriends').textContent = state.friendsInvited;
    $('#profileTasksCompleted').textContent = getCompletedCount();
  }

  function updateReferral() {
    $('#referralCode').textContent = state.referralCode;
    $('#friendsInvitedCount').textContent = state.friendsInvited;
  }

  /* Render the vault list */
  function renderVault() {
    const container = $('#vaultList');
    container.innerHTML = '';
    vaultAssets.forEach((asset) => {
      const item = document.createElement('div');
      item.className = 'vault-item';
      // left side: icon and symbol
      const left = document.createElement('div');
      left.className = 'vault-left';
      const iconDiv = document.createElement('div');
      iconDiv.className = 'vault-icon';
      // Use first letter of symbol as placeholder icon
      iconDiv.textContent = asset.symbol.charAt(0);
      left.appendChild(iconDiv);
      const textDiv = document.createElement('div');
      const symSpan = document.createElement('div');
      symSpan.className = 'vault-symbol';
      symSpan.textContent = asset.symbol;
      const amountSpan = document.createElement('div');
      amountSpan.className = 'vault-amount';
      // Determine amount: if function, call with state; else use value
      const amountValue = typeof asset.amount === 'function' ? asset.amount() : asset.amount;
      amountSpan.textContent = formatNumber(amountValue);
      textDiv.appendChild(symSpan);
      textDiv.appendChild(amountSpan);
      left.appendChild(textDiv);
      item.appendChild(left);
      // right side: usd value
      const usdDiv = document.createElement('div');
      usdDiv.className = 'vault-usd';
      const usdVal = amountValue * asset.price;
      usdDiv.textContent = `$${formatNumber(usdVal)}`;
      item.appendChild(usdDiv);
      container.appendChild(item);
    });
  }

  /* Task action handling */
  function handleTaskAction(task) {
    const stateData = getTaskState(task.id);
    if (stateData.completed) return;
    if (task.type === 'link') {
      // open external link and mark complete
      window.open(task.url, '_blank');
      completeTask(task);
    } else if (task.type === 'share') {
      const link = `${window.location.origin}?ref=${state.referralCode}`;
      navigator.clipboard.writeText(link).then(() => {
        alert('Referral link copied to clipboard');
        completeTask(task);
      });
    } else if (task.type === 'progress') {
      const cur = stateData.current || 0;
      if (cur + 1 >= task.target) {
        completeTask(task);
      } else {
        setTaskState(task.id, { current: cur + 1 });
        // update friends invited count for progress tasks
        if (task.id === 'inviteFriends') {
          state.friendsInvited = cur + 1;
        }
        saveState();
        renderTasksList();
        renderTasksPreview();
        updateProgress();
        updateProfile();
        updateReferral();
      }
    } else {
      completeTask(task);
    }
  }

  function completeTask(task) {
    setTaskState(task.id, { completed: true, current: task.target || undefined });
    // accumulate reward to wave balance
    state.waveBalance = (state.waveBalance || 0) + task.reward;
    // if this is the invite friends task, ensure friendsInvited equals target
    if (task.id === 'inviteFriends') {
      state.friendsInvited = task.target;
    }
    saveState();
    renderTasksList();
    renderTasksPreview();
    updateProgress();
    updateHome();
    updateProfile();
    updateReferral();
    renderVault();
  }

  /* Mystery box */
  function openMysteryBox() {
    const cost = 5;
    if (state.keys < cost) {
      alert(`You need at least ${cost} keys to open a box.`);
      return;
    }
    state.keys -= cost;
    const reward = Math.floor(Math.random() * 401) + 100; // random 100–500
    state.waveBalance += reward;
    alert(`Congratulations! You won ${reward} WAVE tokens!`);
    saveState();
    updateHome();
    updateProfile();
    renderVault();
  }

  /* Tickets countdown */
  function updateCountdown() {
    const now = Date.now();
    let diff = state.nextTicketTime - now;
    if (diff <= 0) {
      state.tickets = (state.tickets || 0) + 1;
      state.nextTicketTime = now + 3600 * 1000;
      saveState();
      updateHome();
      updateProfile();
      diff = state.nextTicketTime - now;
    }
    const totalSeconds = Math.floor(diff / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    $('#nextTicketCountdown').textContent = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /* Referral copy button */
  $('#copyReferralBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(state.referralCode).then(() => {
      alert('Referral code copied!');
    });
  });

  /* Mystery box buttons */
  $('#openBoxButton').addEventListener('click', openMysteryBox);
  $('#profileOpenMysteryBox').addEventListener('click', openMysteryBox);

  /* Feature buttons (coming soon) */
  $('#featureSquad').addEventListener('click', () => alert('Squad feature coming soon!'));
  $('#featureSpin').addEventListener('click', () => alert('Spin feature coming soon!'));
  $('#featureLeaderboard').addEventListener('click', () => alert('Leaderboard feature coming soon!'));
  $('#featureDex').addEventListener('click', () => alert('DEX feature coming soon!'));

  /* Wallet connection via TonConnect */
  const tonConnect = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: `${window.location.origin}/tonconnect-manifest.json`,
    buttonRootId: 'tonConnectButtonContainer',
    uiOptions: {
      hideButton: true,
      language: 'en',
    },
  });

  async function openWalletModal() {
    try {
      await tonConnect.openModal();
    } catch (err) {
      console.error('TonConnect modal error', err);
    }
  }

  $('#connectWalletButton').addEventListener('click', openWalletModal);

  tonConnect.onStatusChange((wallet) => {
    if (wallet && wallet.account) {
      const addr = wallet.account.address;
      $('#profileAddress').textContent = truncateAddress(addr);
      $('#profileUsername').textContent = 'Connected';
      $('#connectWalletButton').textContent = 'Wallet connected';
      $('#connectWalletButton').disabled = true;
    } else {
      $('#profileAddress').textContent = 'Not connected';
      $('#profileUsername').textContent = 'Guest';
      $('#connectWalletButton').textContent = 'Connect wallet';
      $('#connectWalletButton').disabled = false;
    }
  });

  /* Initial render */
  renderTasksList();
  renderTasksPreview();
  updateProgress();
  updateHome();
  updateProfile();
  updateReferral();

  // start countdown timer
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // render vault list on initial load
  renderVault();
});