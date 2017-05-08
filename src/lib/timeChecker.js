export default class TimeChecker {
  constructor(delay) {
    this.timer = undefined;
    this.delay = delay ? delay : 1000;
    /*
     * The main idea was to have some looper like this 
     * class and ability to setup any external logic 
     * function via checker() which can control the behavior 
     * (continue/stop) of current looper
     */
    this.checker = () => {
      console.error('forgot to add checker');
    };
  }

  stop() { 
    clearTimeout(this.timer);
  }

  start(checker) {
    this.stop();
    this.setChecker(checker);
    if (this.checker()) {
      this.timer = setTimeout(() => { this.start(); }, this.delay);
    }
  }

  setChecker(checker) {
    this.checker = (checker || this.checker);
  }
}
