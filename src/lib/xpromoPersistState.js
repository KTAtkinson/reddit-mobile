import { LOCAL_STORAGE_KEYS } from 'app/constants';
import localStorageAvailable from './localStorageAvailable';
import TimeChecker from 'lib/timeChecker';

export const statusKey = {
  SHOW_SAME_SESSION: 'SHOW_BANNER_SAME_SESSION',
  SHOW_NEW_SESSION: 'SHOW_BANNER_NEW_SESSION',
  NEW_SESSION: 'NEW_ROUND_SESSION',
  JUST_DISMISSED: 'DISMISSED_BY_LINK',
  BLOCK_SHOW: 'BLOCK_SHOW_BANNER',
  HIDE: 'HIDE_BANNER',
};

const { BANNER_PERSIST_SHOWED } = LOCAL_STORAGE_KEYS;

const config = { 
  showTime  : 60*1000,    // 1 min
  hideTime  : 10*60*1000, // 10 min
};

/*
 * Timer and main persistent banner 
 */ 
const timer = new TimeChecker(1000);

const checkDisplayStatus = (callback, isInterstitialDismissed) => {
  const lsTime = getLocalStorage();
  const showTime = (lsTime + config.showTime);
  const hideTime = (lsTime + config.hideTime);

  const lessShowTime = (Date.now() <= showTime);
  const moreHideTime = (Date.now() > hideTime);
  const justDismiss = (isInterstitialDismissed && lessShowTime);

  if (justDismiss || !lsTime) {
    sendOnce(callback, statusKey.JUST_DISMISSED);
    if (!lsTime) {markPersistBannerShowed();}
    return true;
  } else if (moreHideTime) {
    markPersistBannerShowed();
    sendOnce(callback, statusKey.NEW_SESSION);
    return true;
  } else if (lessShowTime && isNewShowSession()) {
    sendOnce(callback, statusKey.SHOW_NEW_SESSION);
    return true;
  } else if (lessShowTime) {
    sendOnce(callback, statusKey.SHOW_SAME_SESSION);
    return true;
  }

  if (isBannerShown()) {
    sendOnce(callback, statusKey.HIDE);
  } else {
    sendOnce(callback, statusKey.BLOCK_SHOW);
  }
  return false;
};

export const runStatusCheck = (statusCallback, isInterstitialDismissed) => {
  timer.start(() => {
    return checkDisplayStatus(statusCallback, isInterstitialDismissed);
  });
};

/*
 * Utils for sending callback once
 */ 
const usedStatus = {};

const sendOnce = (callback, status) => {
  if (isStatusFirst(status)) {
    return callback(status);
  }
};
const isStatusFirst = (status) => {
  if (!isStatusExist(status)) {
    usedStatus[status] = true;
    return true;
  }
  return false;
};
const isStatusExist = status => !!usedStatus[status];

const isBannerShown = () => {
  return (
    isStatusExist(statusKey.SHOW_SAME_SESSION) ||
    isStatusExist(statusKey.SHOW_NEW_SESSION) ||
    isStatusExist(statusKey.JUST_DISMISSED)
  );
};
const isNewShowSession = () => {
  return isStatusExist(statusKey.NEW_SESSION);
};

/*
 * Utils for working with localStorage
 */ 
const getLocalStorage = () => {
  if (localStorageAvailable()) {
    const time = localStorage.getItem(BANNER_PERSIST_SHOWED);
    return time ? (new Date(time)).getTime() : false ;
  }
};
export const markPersistBannerShowed = () => {
  if (localStorageAvailable()) {
    return localStorage.setItem(BANNER_PERSIST_SHOWED, new Date());
  }
};
