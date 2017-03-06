import chai from 'chai';
import chaiPromised from "chai-as-promised";
import sinonChai from 'sinon-chai';
import webdriver from 'selenium-webdriver';


var PromiseDriver = function(driver) {
  this.driver = driver;
  this.last = null;
};

PromiseDriver.prototype._then = function(fn) {
  if (this.last === null) {
    this.last = fn()
  } else {
    this.last = this.last.then(fn);
  };
};

PromiseDriver.prototype.clickByCssSelector = function(selector) {
  var driver = this.driver;
  this.getElementBySelector(selector);
  return this._then(function(el) {
    return el.click();
  });
}

PromiseDriver.prototype.getElementBySelector = function(selector) {
  var driver = this.driver;
  return this._then(function() {
    return driver.findElement(webdriver.By.css(selector))
  });
}

PromiseDriver.prototype.get = function(url) {
  var driver = this.driver;
  return this._then(function() {
    return driver.get(url);
  });
}

PromiseDriver.prototype.quit = function() {
  var driver = this.driver;
  return this._then(function() {
    return driver.quit();
  });
}


chai.use(sinonChai);
chai.use(chaiPromised);
const expect = chai.expect;

describe('lib: frontpagelogin', function() {
  
  this.timeout(3000);
  var driver = null;
  
  beforeEach(function() {
    const d = new webdriver.Builder()
      .forBrowser('chrome')
      .build();

    driver = new PromiseDriver(d)
  });

  afterEach(function() {
    driver.quit();
  });

  it('login button is visible', function(done) {
      driver.get('localhost:4444');
      driver.clickByCssSelector('.TopNav-floaty#sitenav');
      driver.getElementBySelector('[href="/login"]');
      expect(driver.last)
        .to.eventually.not.be.null
        .notify(done);
  });
 
 it('regostaton button visible', function(done) {
      driver.get('localhost:4444');
      driver.clickByCssSelector('.TopNav-floaty#sitenav');
      driver.clickByCssSelector('[href="/login"]');
      driver.getElementBySelector('[href="/register"]');
      expect(driver.last)
        .to.eventually.not.be.null
        .notify(done);
  });
});
