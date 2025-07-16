/**
 * Popup UI for Stinger Guard Extension
 */

import { storageService } from '../shared/storage/StorageService';
import { stingerClientV2 } from '../shared/api/StingerClientV2';

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

    // Update API client (Phase 15 client doesn't have updateConfig method)
    // The base URL is handled by the singleton instance

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
    const result = await stingerClientV2.healthCheck();

    if (result) {
      updateStatus('API connection successful', 'success');
    } else {
      updateStatus('API connection failed', 'error');
    }
  } catch (error) {
    updateStatus(`API error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
  } finally {
    testButton.disabled = false;
  }
}

/**
 * Check API status on load
 */
async function checkApiStatus() {
  const result = await stingerClientV2.healthCheck();

  const healthInfo = document.getElementById('api-health');
  if (healthInfo) {
    if (result) {
      healthInfo.textContent = 'API: Connected (Phase 15)';
      healthInfo.className = 'text-green-600 text-sm';
    } else {
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
