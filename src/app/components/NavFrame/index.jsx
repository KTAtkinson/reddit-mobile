import './styles.less';
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import DualPartInterstitial from 'app/components/DualPartInterstitial';
import EUCookieNotice from 'app/components/EUCookieNotice';
import TopNav from 'app/components/TopNav';
import { 
  XPromoIsActive,
  loginRequiredEnabled as loginRequiredXPromoVariant,
} from 'app/selectors/xpromo';

const renderXPromoBanner = (children, isDisplay=false, mixin=false) => {
  return isDisplay ? <DualPartInterstitial mixin={ mixin }>{ children }</DualPartInterstitial> : null;
};

const NavFrame = props => {
  const { children, requireLogin, showXPromo } = props;
  const xPromoBanner = renderXPromoBanner(children, showXPromo);
  const xPromoForContentPadding = renderXPromoBanner(children, showXPromo, 'm-invisible');
  const otherContent = requireLogin ? null : (
    <div>
      <TopNav />
      <div className='NavFrame__below-top-nav'>
        <EUCookieNotice />
        { children }
      </div>
      { xPromoForContentPadding }
    </div>
  );

  return (
    <div className='NavFrame'>
      { xPromoBanner }
      { otherContent }
    </div>
  );
};

const xPromoSelector = createSelector(
  XPromoIsActive,
  loginRequiredXPromoVariant,
  (showXPromo, requireLogin) => {
    return { showXPromo, requireLogin};
  },
);

export default connect(xPromoSelector)(NavFrame);
