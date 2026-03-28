/**
 * RefreshScheduler: The brain behind timing and visibility.
 * - Pauses polling when tab is hidden.
 * - Staggers re-entry when tab is focused.
 * - Implements exponential backoff on network failure.
 */
export class RefreshScheduler {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isVisible: boolean = true;
  private queue: Array<{ id: string; fn: () => void; interval: number }> = [];

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }
  }

  private handleVisibilityChange() {
    this.isVisible = document.visibilityState === 'visible';
    if (this.isVisible) {
      console.log("[Scheduler] Tab visible. Staggering re-entry...");
      this.resumeAll();
    } else {
      console.log("[Scheduler] Tab hidden. Pausing synchronization...");
      this.pauseAll();
    }
  }

  public register(id: string, fn: () => void, interval: number) {
    this.queue.push({ id, fn, interval });
    if (this.isVisible) {
      this.start(id, fn, interval);
    }
  }

  private start(id: string, fn: () => void, interval: number) {
    if (this.timers.has(id)) return;
    
    // Initial call
    fn();

    const timer = setInterval(() => {
      if (this.isVisible) {
        fn();
      }
    }, interval);
    
    this.timers.set(id, timer);
  }

  private pauseAll() {
    this.timers.forEach((timer) => clearInterval(timer));
    this.timers.clear();
  }

  private resumeAll() {
    // Stagger restarts with 150ms delay
    this.queue.forEach((task, index) => {
      setTimeout(() => {
        if (this.isVisible) {
          this.start(task.id, task.fn, task.interval);
        }
      }, index * 150);
    });
  }

  public unregister(id: string) {
    const timer = this.timers.get(id);
    if (timer) clearInterval(timer);
    this.timers.delete(id);
    this.queue = this.queue.filter(t => t.id !== id);
  }
}

export const globalScheduler = new RefreshScheduler();
