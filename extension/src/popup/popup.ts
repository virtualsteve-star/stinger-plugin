/**
 * Popup UI for Stinger Guard Extension
 */

import { storageService } from '../shared/storage/StorageService';
import { stingerClient } from '../shared/api/StingerClient';

// DOM elements
let statusElement: HTMLElement;
let toggleButton: HTMLButtonElement;
let userIdInput: HTMLInputElement;
let userNameInput: HTMLInputElement;
let apiUrlInput: HTMLInputElement;
let saveButton: HTMLButtonElement;
let testButton: HTMLButtonElement;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Get DOM elements
  statusElement = document.getElementById('status')!;
  toggleButton = document.getElementById('toggle-protection') as HTMLButtonElement;
  userIdInput = document.getElementById('user-id') as HTMLInputElement;
  userNameInput = document.getElementById('user-name') as HTMLInputElement;
  apiUrlInput = document.getElementById('api-url') as HTMLInputElement;
  saveButton = document.getElementById('save-config') as HTMLButtonElement;
  testButton = document.getElementById('test-api') as HTMLButtonElement;

  // Load current configuration
  await loadConfig();

  // Set up event listeners
  toggleButton.addEventListener('click', toggleProtection);
  saveButton.addEventListener('click', saveConfig);
  testButton.addEventListener('click', testApiConnection);

  // Check API health
  await checkApiStatus();
});

/**
 * Load current configuration
 */
async function loadConfig() {
  const config = await storageService.getConfig();

  // Update UI with current values
  updateToggleButton(config.debugMode);
  userIdInput.value = config.userId || '';
  userNameInput.value = config.userName || '';
  apiUrlInput.value = config.apiUrl;

  // Update status
  updateStatus(
    config.debugMode ? 'Protection Active' : 'Protection Disabled',
    config.debugMode ? 'success' : 'warning',
  );
}

/**
 * Toggle protection on/off
 */
async function toggleProtection() {
  const config = await storageService.getConfig();
  const newState = !config.debugMode;

  await storageService.updateConfig({ debugMode: newState });
  updateToggleButton(newState);
  updateStatus(
    newState ? 'Protection Active' : 'Protection Disabled',
    newState ? 'success' : 'warning',
  );
}

/**
 * Save configuration
 */
async function saveConfig() {
  const userId = userIdInput.value.trim();
  const userName = userNameInput.value.trim();
  const apiUrl = apiUrlInput.value.trim();

  try {
    await storageService.updateConfig({
      userId: userId || undefined,
      userName: userName || undefined,
      apiUrl: apiUrl,
    });

    // Update API client
    stingerClient.updateConfig({ baseUrl: apiUrl });

    updateStatus('Configuration saved', 'success');

    // Test the new configuration
    await checkApiStatus();
  } catch {
    updateStatus('Failed to save configuration', 'error');
  }
}

/**
 * Test API connection
 */
async function testApiConnection() {
  updateStatus('Testing API connection...', 'info');
  testButton.disabled = true;

  try {
    const result = await stingerClient.health();

    if (result.success) {
      updateStatus('API connection successful', 'success');
    } else {
      updateStatus(`API error: ${result.error.message}`, 'error');
    }
  } catch {
    updateStatus('Failed to connect to API', 'error');
  } finally {
    testButton.disabled = false;
  }
}

/**
 * Check API status on load
 */
async function checkApiStatus() {
  const result = await stingerClient.health();

  if (result.success) {
    const healthInfo = document.getElementById('api-health');
    if (healthInfo) {
      healthInfo.textContent = `API: Connected (${result.data.guardrail_count} guardrails active)`;
      healthInfo.className = 'text-green-600 text-sm';
    }
  } else {
    const healthInfo = document.getElementById('api-health');
    if (healthInfo) {
      healthInfo.textContent = 'API: Disconnected';
      healthInfo.className = 'text-red-600 text-sm';
    }
  }
}

/**
 * Update toggle button appearance
 */
function updateToggleButton(isActive: boolean) {
  toggleButton.textContent = isActive ? 'Disable Protection' : 'Enable Protection';
  toggleButton.className = isActive
    ? 'bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors'
    : 'bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors';
}

/**
 * Update status message
 */
function updateStatus(message: string, type: 'success' | 'error' | 'warning' | 'info') {
  statusElement.textContent = message;
  statusElement.className = `status-message ${
    type === 'success'
      ? 'bg-green-100 text-green-800'
      : type === 'error'
        ? 'bg-red-100 text-red-800'
        : type === 'warning'
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-blue-100 text-blue-800'
  }`;
  statusElement.style.display = 'block';

  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusElement.style.display = 'none';
  }, 3000);
}
