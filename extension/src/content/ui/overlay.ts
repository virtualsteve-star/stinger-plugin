/**
 * UI Overlay for Stinger warnings and blocks
 */

import { UI_CONFIG } from '../../shared/constants';

export class StingerOverlay {
  private overlayContainer: HTMLDivElement | null = null;

  /**
   * Show a warning dialog
   */
  showWarning(warnings: string[]): Promise<boolean> {
    return new Promise((resolve) => {
      this.createOverlay();

      const content = `
        <div style="
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          padding: 24px;
        ">
          <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <span style="font-size: 24px; margin-right: 12px;">⚠️</span>
            <h2 style="margin: 0; color: #92400E; font-size: 20px;">Stinger Security Warning</h2>
          </div>
          
          <div style="color: #1F2937; margin-bottom: 20px;">
            <p style="margin: 0 0 12px 0;">This prompt may violate security policies:</p>
            <ul style="margin: 0; padding-left: 20px;">
              ${warnings.map((w) => `<li style="margin: 4px 0;">${this.escapeHtml(w)}</li>`).join('')}
            </ul>
          </div>
          
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button id="stinger-cancel" style="
              background: #F3F4F6;
              border: 1px solid #D1D5DB;
              border-radius: 6px;
              color: #374151;
              cursor: pointer;
              font-size: 14px;
              padding: 8px 16px;
            ">Cancel</button>
            <button id="stinger-proceed" style="
              background: #F59E0B;
              border: none;
              border-radius: 6px;
              color: white;
              cursor: pointer;
              font-size: 14px;
              padding: 8px 16px;
            ">Proceed Anyway</button>
          </div>
        </div>
      `;

      if (this.overlayContainer) {
        this.overlayContainer.innerHTML = content;

        // Add event listeners
        const cancelBtn = this.overlayContainer.querySelector('#stinger-cancel');
        const proceedBtn = this.overlayContainer.querySelector('#stinger-proceed');

        cancelBtn?.addEventListener('click', () => {
          this.hideOverlay();
          resolve(false);
        });

        proceedBtn?.addEventListener('click', () => {
          this.hideOverlay();
          resolve(true);
        });
      }
    });
  }

  /**
   * Show a blocked notification (toast-style)
   */
  showBlockedNotification(reasons: string[]): void {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #DC2626;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: ${UI_CONFIG.OVERLAY_Z_INDEX + 1};
      max-width: 400px;
      font-family: -apple-system, system-ui, sans-serif;
      animation: slideIn 0.3s ease-out;
    `;

    toast.innerHTML = `
      <div style="display: flex; align-items: center;">
        <span style="font-size: 20px; margin-right: 12px;">🚫</span>
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">Content Blocked</div>
          <div style="font-size: 14px; opacity: 0.9;">${reasons.join(', ')}</div>
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  /**
   * Show a block message
   */
  showBlock(reasons: string[]): void {
    this.createOverlay();

    const content = `
      <div style="
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-width: 500px;
        padding: 24px;
      ">
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
          <span style="font-size: 24px; margin-right: 12px;">🚫</span>
          <h2 style="margin: 0; color: #991B1B; font-size: 20px;">Prompt Blocked by Stinger</h2>
        </div>
        
        <div style="color: #1F2937; margin-bottom: 20px;">
          <p style="margin: 0 0 12px 0;">This prompt violates security policies:</p>
          <ul style="margin: 0; padding-left: 20px;">
            ${reasons.map((r) => `<li style="margin: 4px 0;">${this.escapeHtml(r)}</li>`).join('')}
          </ul>
        </div>
        
        <div style="display: flex; justify-content: flex-end;">
          <button id="stinger-ok" style="
            background: #DC2626;
            border: none;
            border-radius: 6px;
            color: white;
            cursor: pointer;
            font-size: 14px;
            padding: 8px 24px;
          ">OK</button>
        </div>
      </div>
    `;

    if (this.overlayContainer) {
      this.overlayContainer.innerHTML = content;

      const okBtn = this.overlayContainer.querySelector('#stinger-ok');
      okBtn?.addEventListener('click', () => {
        this.hideOverlay();
      });
    }
  }

  /**
   * Show a response block message
   */
  showBlockedResponse(reasons: string[]): void {
    this.createOverlay();

    const content = `
      <div style="
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-width: 500px;
        padding: 24px;
      ">
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
          <span style="font-size: 24px; margin-right: 12px;">🛑</span>
          <h2 style="margin: 0; color: #991B1B; font-size: 20px;">Response Blocked by Stinger</h2>
        </div>
        
        <div style="color: #1F2937; margin-bottom: 20px;">
          <p style="margin: 0 0 12px 0;">This response contains content that violates security policies:</p>
          <ul style="margin: 0; padding-left: 20px;">
            ${reasons.map((r) => `<li style="margin: 4px 0;">${this.escapeHtml(r)}</li>`).join('')}
          </ul>
        </div>
        
        <div style="display: flex; justify-content: flex-end;">
          <button id="stinger-ok" style="
            background: #DC2626;
            border: none;
            border-radius: 6px;
            color: white;
            cursor: pointer;
            font-size: 14px;
            padding: 8px 24px;
          ">OK</button>
        </div>
      </div>
    `;

    if (this.overlayContainer) {
      this.overlayContainer.innerHTML = content;

      const okBtn = this.overlayContainer.querySelector('#stinger-ok');
      okBtn?.addEventListener('click', () => {
        this.hideOverlay();
      });
    }
  }

  /**
   * Create the overlay container
   */
  private createOverlay(): void {
    if (this.overlayContainer) return;

    this.overlayContainer = document.createElement('div');
    this.overlayContainer.id = 'stinger-overlay';
    this.overlayContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: ${UI_CONFIG.OVERLAY_Z_INDEX};
    `;

    document.body.appendChild(this.overlayContainer);
  }

  /**
   * Hide the overlay
   */
  private hideOverlay(): void {
    if (this.overlayContainer) {
      this.overlayContainer.remove();
      this.overlayContainer = null;
    }
  }

  /**
   * Escape HTML for safe insertion
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
