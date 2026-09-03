const numProcInput = document.getElementById('numProc');
const decBtn = document.getElementById('decBtn');
const incBtn = document.getElementById('incBtn');
const buildBtn = document.getElementById('buildBtn');
const setupPanel = document.getElementById('setupPanel');
const inputPanel = document.getElementById('inputPanel');
const resultsPanel = document.getElementById('resultsPanel');
const inputTableBody = document.getElementById('inputTableBody');
const runBtn = document.getElementById('runBtn');
const backBtn = document.getElementById('backBtn');
const editBtn = document.getElementById('editBtn');
const resetBtn = document.getElementById('resetBtn');
const statusMsg = document.getElementById('statusMsg');
const algoFcfsBtn = document.getElementById('algoFcfsBtn');
const algoSjfBtn = document.getElementById('algoSjfBtn');
const algoChipInput = document.getElementById('algoChipInput');
const algoChipResults = document.getElementById('algoChipResults');

const MIN_P = 3, MAX_P = 10;
const palette = ['#ffb000', '#4fd1c5', '#ff8fa3', '#9d8cff', '#7bd88f', '#ffd166', '#5fb4ff', '#ff9f6b', '#c792ea', '#8be9c7'];

let selectedAlgo = 'FCFS';

/* ---------- Process count stepper ---------- */
function clampNum(){
  let v = parseInt(numProcInput.value, 10);
  if (isNaN(v)) v = MIN_P;
  v = Math.max(MIN_P, Math.min(MAX_P, v));
  numProcInput.value = v;
  decBtn.disabled = v <= MIN_P;
  incBtn.disabled = v >= MAX_P;
}
clampNum();

decBtn.addEventListener('click', () => { numProcInput.value = parseInt(numProcInput.value,10) - 1; clampNum(); });
incBtn.addEventListener('click', () => { numProcInput.value = parseInt(numProcInput.value,10) + 1; clampNum(); });
numProcInput.addEventListener('change', clampNum);

/* ---------- Algorithm selector ---------- */
function selectAlgo(algo){
  selectedAlgo = algo;
  algoFcfsBtn.classList.toggle('active', algo === 'FCFS');
  algoSjfBtn.classList.toggle('active', algo === 'SJF');
  algoChipInput.textContent = algo === 'FCFS' ? 'FCFS' : 'SJF';
  algoChipResults.textContent = algo === 'FCFS' ? 'FCFS' : 'SJF';
}
algoFcfsBtn.addEventListener('click', () => selectAlgo('FCFS'));
algoSjfBtn.addEventListener('click', () => selectAlgo('SJF'));

/* ---------- Panel navigation ---------- */
buildBtn.addEventListener('click', () => {
  clampNum();
  const n = parseInt(numProcInput.value, 10);
  buildInputTable(n);
  setupPanel.style.display = 'none';
  inputPanel.style.display = 'block';
  resultsPanel.style.display = 'none';
});

backBtn.addEventListener('click', () => {
  inputPanel.style.display = 'none';
  setupPanel.style.display = 'block';
});

editBtn.addEventListener('click', () => {
  resultsPanel.style.display = 'none';
  inputPanel.style.display = 'block';
});

resetBtn.addEventListener('click', () => {
  resultsPanel.style.display = 'none';
  setupPanel.style.display = 'block';
  inputTableBody.innerHTML = '';
});

/* ---------- Build process input rows ---------- */
function buildInputTable(n){
  inputTableBody.innerHTML = '';
  for (let i = 0; i < n; i++){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="cell-idx">P${i+1}</td>
      <td>
        <div class="field">
          <input type="text" class="pidInput" placeholder="e.g. P${i+1}" data-idx="${i}">
          <div class="err-msg" data-err="pid-${i}"></div>
        </div>
      </td>
      <td>
        <div class="field">
          <input type="number" min="0" class="atInput" placeholder="0" data-idx="${i}">
          <div class="err-msg" data-err="at-${i}"></div>
        </div>
      </td>
      <td>
        <div class="field">
          <input type="number" min="0" class="btInput" placeholder="0" data-idx="${i}">
          <div class="err-msg" data-err="bt-${i}"></div>
        </div>
      </td>
    `;
    inputTableBody.appendChild(tr);
  }
  inputTableBody.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', validateAll);
  });
  validateAll();
}

/* ---------- Validation (unique PID, unique arrival time, non-negative) ---------- */
function validateAll(){
  const pidInputs = [...document.querySelectorAll('.pidInput')];
  const atInputs = [...document.querySelectorAll('.atInput')];
  const btInputs = [...document.querySelectorAll('.btInput')];

  const pidVals = pidInputs.map(i => i.value.trim());
  const atVals = atInputs.map(i => i.value.trim());

  let allValid = true;

  pidInputs.forEach((inp, i) => {
    const errEl = document.querySelector(`[data-err="pid-${i}"]`);
    const val = pidVals[i];
    let err = '';
    if (val === '') { err = 'Required'; }
    else {
      const dupCount = pidVals.filter(v => v !== '' && v === val).length;
      if (dupCount > 1) err = 'Duplicate ID';
    }
    inp.classList.toggle('error', !!err);
    errEl.textContent = err;
    if (err) allValid = false;
  });

  atInputs.forEach((inp, i) => {
    const errEl = document.querySelector(`[data-err="at-${i}"]`);
    const val = atVals[i];
    let err = '';
    if (val === '') { err = 'Required'; }
    else if (parseInt(val,10) < 0) { err = 'Must be \u2265 0'; }
    else {
      const dupCount = atVals.filter(v => v !== '' && v === val).length;
      if (dupCount > 1) err = 'Duplicate arrival time';
    }
    inp.classList.toggle('error', !!err);
    errEl.textContent = err;
    if (err) allValid = false;
  });

  btInputs.forEach((inp, i) => {
    const errEl = document.querySelector(`[data-err="bt-${i}"]`);
    const val = inp.value.trim();
    let err = '';
    if (val === '') { err = 'Required'; }
    else if (parseInt(val,10) < 0) { err = 'Must be \u2265 0'; }
    inp.classList.toggle('error', !!err);
    errEl.textContent = err;
    if (err) allValid = false;
  });

  runBtn.disabled = !allValid;
  statusMsg.textContent = allValid
    ? 'All entries valid \u2014 ready to run.'
    : 'Fill in every field \u2014 IDs and arrival times must be unique.';
  statusMsg.classList.toggle('ok', allValid);
  return allValid;
}

/* ---------- Scheduling algorithms ---------- */

// FCFS: execute strictly in arrival-time order
function scheduleFCFS(processes){
  const order = [...processes].sort((a, b) => a.at - b.at);
  return simulateInOrder(order);
}

// SJF (non-preemptive): among arrived, not-yet-run processes, always pick the
// shortest burst time; ties broken by earlier arrival time, then input order.
function scheduleSJF(processes){
  const pending = [...processes].map((p, i) => ({ ...p, origIndex: i }));
  const done = [];
  let currentTime = 0;
  const timeline = [];

  while (pending.length > 0){
    const available = pending.filter(p => p.at <= currentTime);

    if (available.length === 0){
      const nextArrival = Math.min(...pending.map(p => p.at));
      if (nextArrival > currentTime){
        timeline.push({ type: 'idle', start: currentTime, end: nextArrival });
      }
      currentTime = nextArrival;
      continue;
    }

    available.sort((a, b) => a.bt - b.bt || a.at - b.at || a.origIndex - b.origIndex);
    const next = available[0];

    next.start = currentTime;
    next.completion = next.start + next.bt;
    next.turnaround = next.completion - next.at;
    next.waiting = next.turnaround - next.bt;
    timeline.push({ type: 'proc', pid: next.pid, start: next.start, end: next.completion });

    currentTime = next.completion;
    done.push(next);
    const idx = pending.indexOf(next);
    pending.splice(idx, 1);
  }

  return { processes: done, timeline };
}

// Shared simulator for a fixed execution order (used by FCFS)
function simulateInOrder(orderedProcesses){
  let currentTime = 0;
  const timeline = [];
  const done = [];

  orderedProcesses.forEach(p => {
    if (currentTime < p.at){
      timeline.push({ type: 'idle', start: currentTime, end: p.at });
      currentTime = p.at;
    }
    p.start = currentTime;
    p.completion = p.start + p.bt;
    p.turnaround = p.completion - p.at;
    p.waiting = p.turnaround - p.bt;
    timeline.push({ type: 'proc', pid: p.pid, start: p.start, end: p.completion });
    currentTime = p.completion;
    done.push(p);
  });

  return { processes: done, timeline };
}

/* ---------- Run scheduler ---------- */
runBtn.addEventListener('click', () => {
  if (!validateAll()) return;
  const pidInputs = [...document.querySelectorAll('.pidInput')];
  const atInputs = [...document.querySelectorAll('.atInput')];
  const btInputs = [...document.querySelectorAll('.btInput')];

  const rawProcesses = pidInputs.map((inp, i) => ({
    pid: inp.value.trim(),
    at: parseInt(atInputs[i].value, 10),
    bt: parseInt(btInputs[i].value, 10)
  }));

  const result = selectedAlgo === 'SJF' ? scheduleSJF(rawProcesses) : scheduleFCFS(rawProcesses);
  const { processes, timeline } = result;

  renderGantt(timeline, processes);
  renderResultsTable(processes);

  const totalWait = processes.reduce((s, p) => s + p.waiting, 0);
  const totalTAT = processes.reduce((s, p) => s + p.turnaround, 0);
  document.getElementById('avgWait').innerHTML = (totalWait / processes.length).toFixed(2) + ' <span>units</span>';
  document.getElementById('avgTAT').innerHTML = (totalTAT / processes.length).toFixed(2) + ' <span>units</span>';

  inputPanel.style.display = 'none';
  resultsPanel.style.display = 'block';
});

/* ---------- Rendering ---------- */
function renderGantt(timeline, processes){
  const track = document.getElementById('ganttTrack');
  const ruler = document.getElementById('ganttRuler');
  track.innerHTML = '';
  ruler.innerHTML = '';

  const totalSpan = timeline.length ? timeline[timeline.length - 1].end : 1;
  const colorMap = {};
  processes.forEach((p, i) => { colorMap[p.pid] = palette[i % palette.length]; });

  timeline.forEach(seg => {
    const width = ((seg.end - seg.start) / totalSpan) * 100;
    const block = document.createElement('div');
    block.className = 'gantt-block' + (seg.type === 'idle' ? ' idle' : '');
    block.style.flex = `0 0 ${width}%`;
    if (seg.type === 'proc') {
      block.style.background = colorMap[seg.pid];
      block.innerHTML = `${seg.pid}<small>${seg.end - seg.start}u</small>`;
    } else {
      block.innerHTML = `<small>idle</small>`;
    }
    track.appendChild(block);

    const tick = document.createElement('div');
    tick.className = 'gantt-tick';
    tick.style.flex = `0 0 ${width}%`;
    tick.textContent = seg.start;
    ruler.appendChild(tick);
  });

  const lastTick = document.createElement('div');
  lastTick.className = 'gantt-tick';
  lastTick.style.flex = '0 0 0%';
  lastTick.textContent = totalSpan;
  ruler.appendChild(lastTick);
}

function renderResultsTable(processes){
  const body = document.getElementById('resultsTableBody');
  body.innerHTML = '';
  const sortedByArrival = [...processes].sort((a,b) => a.at - b.at);
  sortedByArrival.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="pid-chip">${p.pid}</span></td>
      <td>${p.at}</td>
      <td>${p.bt}</td>
      <td>${p.start}</td>
      <td>${p.completion}</td>
      <td>${p.turnaround}</td>
      <td>${p.waiting}</td>
    `;
    body.appendChild(tr);
  });
}
