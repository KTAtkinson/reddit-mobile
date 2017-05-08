import './styles.less';

import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import cx from 'lib/classNames';
import getXpromoTheme from 'lib/xpromoTheme';
import { getDevice } from 'lib/getDeviceFromState';
import XPromoWrapper from 'app/components/XPromoWrapper';
import DualPartInterstitialHeader from 'app/components/DualPartInterstitial/Header';
import DualPartInterstitialFooter from 'app/components/DualPartInterstitial/Footer';

import {
  logAppStoreNavigation,
  navigateToAppStore,
  promoClicked,
} from 'app/actions/xpromo';
import {
  xpromoTheme,
  scrollPastState,
  isXPromoPersistentActive,
} from 'app/selectors/xpromo';

export function DualPartInterstitial(props) {
  const { 
    mixin,
    scrollPast,
    xpromoTheme,
    isXPromoPersistentActive,
  } = props;

  const CLASS = 'DualPartInterstitial';
  const themeDisplayClass = getXpromoTheme(
    xpromoTheme,
    scrollPast,
    isXPromoPersistentActive
  ).displayClass;

  return (
    <XPromoWrapper>
      <div className={ cx(CLASS, themeDisplayClass, mixin) }>
        <div className={ `${CLASS}__content` }>
          <div className={ `${CLASS}__common` }>
            <DualPartInterstitialHeader { ...props } />
            <DualPartInterstitialFooter { ...props } />
          </div>
        </div>
      </div>
    </XPromoWrapper>
  );
}

export const selector = createSelector(
  getDevice,
  scrollPastState,
  xpromoTheme,
  isXPromoPersistentActive,
  (device, scrollPast, xpromoTheme, isXPromoPersistentActive) => ({
    device, scrollPast, xpromoTheme, isXPromoPersistentActive,
  }),
);

const mapDispatchToProps = dispatch => {
  let preventExtraClick = false;

  return {
    navigator: (visitTrigger, url, xpromoPersistState) => (async () => {
      // Prevention of additional click events
      // while the Promise dispatch is awaiting
      if (!preventExtraClick) {
        preventExtraClick = true;
        // We should not call `await` until the app-store navigation is in progress,
        // see actions/xpromo.navigateToAppStore for more info.
        const trackingPromise = dispatch(logAppStoreNavigation(visitTrigger));
        dispatch(promoClicked(xpromoPersistState));
        navigateToAppStore(url);
        await trackingPromise;
        preventExtraClick = false;
      }
    }),
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { xpromoTheme, xpromoPersistState } = stateProps;
  const { navigator: dispatchNavigator } = dispatchProps;
  const visitTrigger = getXpromoTheme(xpromoTheme).visitTrigger;

  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    navigator: url => dispatchNavigator(visitTrigger, url, xpromoPersistState),
  };
};

export default connect(selector, mapDispatchToProps, mergeProps)(DualPartInterstitial);
