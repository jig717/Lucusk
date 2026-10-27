const display = document.querySelector('#display');
const expression = document.querySelector('#expression');
const keypad = document.querySelector('#keypad');
const operatorButtons = document.querySelectorAll('[data-operator]');
const operators = {
  add: ['+', (a, b) => a + b],
  subtract: ['−', (a, b) => a - b],
  multiply: ['×', (a, b) => a * b],
  divide: ['÷', (a, b) => b ? a / b : NaN]
};
let currentValue = '0';
let storedValue = null, pendingOperator = null, shouldReplace = false, hasError = false;

const format = (value) => {
  if (!Number.isFinite(value)) return 'Error';
  return String(Number(value.toPrecision(11)) || 0);
};

function render() {
  display.textContent = currentValue;
  operatorButtons.forEach(button => button.classList.toggle(
    'is-selected', button.dataset.operator === pendingOperator && !shouldReplace
  ));
}

function clear() {
  currentValue = '0'; storedValue = pendingOperator = null;
  shouldReplace = hasError = false;
  expression.textContent = '';
  render();
}

function digit(value) {
  if (hasError) clear();
  if (shouldReplace || currentValue === '0') currentValue = value;
  else if (currentValue.replace(/[-.]/g, '').length < 12) currentValue += value;
  shouldReplace = false;
  render();
}

function decimal() {
  if (hasError) clear();
  currentValue = shouldReplace ? '0.' : currentValue.includes('.') ? currentValue : `${currentValue}.`;
  shouldReplace = false;
  render();
}

function fail() {
  currentValue = 'Error'; storedValue = pendingOperator = null;
  shouldReplace = hasError = true;
  render();
}

function calculate(a, b, operator) {
  return operators[operator][1](a, b);
}

function chooseOperator(operator) {
  if (hasError) return;
  if (pendingOperator && !shouldReplace) {
    storedValue = calculate(storedValue, Number(currentValue), pendingOperator);
    currentValue = format(storedValue);
    if (currentValue === 'Error') return fail();
  } else storedValue = Number(currentValue);
  pendingOperator = operator;
  shouldReplace = true;
  expression.textContent = `${format(storedValue)} ${operators[operator][0]}`;
  render();
}

function equals() {
  if (hasError || pendingOperator === null || shouldReplace) return;
  const right = Number(currentValue);
  const operator = pendingOperator;
  const result = calculate(storedValue, right, operator);
  expression.textContent = `${format(storedValue)} ${operators[operator][0]} ${format(right)} =`;
  currentValue = format(result);
  storedValue = pendingOperator = null;
  shouldReplace = true;
  if (currentValue === 'Error') return fail();
  render();
}

function applyAction(action) {
  if (action === 'clear') return clear();
  if (action === 'equals') return equals();
  if (hasError) return;
  const value = Number(currentValue);
  if (action === 'decimal') return decimal();
  if (action === 'sign') currentValue = format(-value);
  if (action === 'percent') currentValue = format(value / 100);
  if (action === 'backspace' && !shouldReplace)
    currentValue = currentValue.length > 1 ? currentValue.slice(0, -1).replace(/^-$/, '0') : '0';
  render();
}

keypad.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.digit !== undefined) digit(button.dataset.digit);
  else if (button.dataset.operator) chooseOperator(button.dataset.operator);
  else if (button.dataset.action) applyAction(button.dataset.action);
});

const keyboardActions = { Enter: 'equals', '=': 'equals', Backspace: 'backspace', Escape: 'clear', '+': 'add', '-': 'subtract', '*': 'multiply', '/': 'divide' };
document.addEventListener('keydown', (event) => {
  if (/^\d$/.test(event.key)) digit(event.key);
  else if (event.key === '.') decimal();
  else if (keyboardActions[event.key]) {
    const action = keyboardActions[event.key];
    if (operators[action]) chooseOperator(action);
    else applyAction(action);
  } else return;
  event.preventDefault();
});
