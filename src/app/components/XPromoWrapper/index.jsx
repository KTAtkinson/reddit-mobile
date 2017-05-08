import React from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import * as xpromoActions from 'app/actions/xpromo';
import * as xpromoPersist from 'lib/xpromoPersistState';

import {
  XPROMO_SCROLLPAST,
  XPROMO_SCROLLUP,
  XPROMO_VIEW,
  XPROMO_DISMISS,
  XPROMO_INELIGIBLE,
} from 'lib/eventUtils';

import { 
  xpromoThemeIsUsual,
  dismissedState,
  scrollPastState,
  scrollStartState,
  isXPromoPersistent,
} from 'app/selectors/xpromo';

class XPromoWrapper extends React.Component {

  launchPersistentExperiment() {
    if (this.props.isXPromoPersistent) {
      this.displayPersistBannerByTimer();
    }
  }

  displayPersistBannerByTimer() {
    const { dispatch, isInterstitialDismissed } = this.props;

    xpromoPersist.runStatusCheck((status) => {
      switch (status) {
        case xpromoPersist.statusKey.JUST_DISMISSED: {
          dispatch(xpromoActions.trackXPromoEvent(
            XPROMO_VIEW, { process_note: 'just_dismissed_and_show' })
          );
          break;
        }

        case xpromoPersist.statusKey.SHOW_SAME_SESSION: {
          dispatch(xpromoActions.promoPersistActivate());
          dispatch(xpromoActions.trackXPromoEvent(
            XPROMO_VIEW, { process_note: 'show_same_session' })
          );
          break;
        }

        case xpromoPersist.statusKey.SHOW_NEW_SESSION: {
          dispatch(xpromoActions.promoPersistActivate());
          dispatch(xpromoActions.trackXPromoEvent(
            XPROMO_VIEW, { process_note: 'show_new_session' })
          );
          break;
        }

        case xpromoPersist.statusKey.HIDE: {
          dispatch(xpromoActions.promoPersistDeactivate());
          dispatch(xpromoActions.trackXPromoEvent(
            XPROMO_DISMISS, { ineligibility_reason: 'hide_by_timeout'})
          );
          break;
        }

        case xpromoPersist.statusKey.BLOCK_SHOW: {
          dispatch(xpromoActions.promoPersistDeactivate());
          dispatch(xpromoActions.trackXPromoEvent(
            XPROMO_INELIGIBLE, { ineligibility_reason: 'recent_session'})
          );
        }
      }
    }, isInterstitialDismissed);
  }

  onScroll = () => {
    // For now we will consider scrolling half the
    // viewport "scrolling past" the interstitial.
    // note the referencing of window
    const { 
      dispatch, 
      alreadyScrolledStart, 
      alreadyScrolledPast, 
      xpromoThemeIsUsual,
      isXPromoPersistent,
    } = this.props;

    // should appears only once on the start
    // of the scrolled down by the viewport
    if (!xpromoThemeIsUsual && !alreadyScrolledStart) {
      dispatch(xpromoActions.trackXPromoEvent(XPROMO_SCROLLPAST, { scroll_note: 'scroll_start' }));
      dispatch(xpromoActions.promoScrollStart());
    }
    // should appears only once on scroll down about the half viewport.
    // "scrollPast" state is also used for
    // toggling xpromo fade-in/fade-out actions
    if (this.isScrollPast() && !alreadyScrolledPast) {
      const additionalData = (xpromoThemeIsUsual ? {} : { scroll_note: 'unit_fade_out' });
      dispatch(xpromoActions.trackXPromoEvent(XPROMO_SCROLLPAST, additionalData));
      dispatch(xpromoActions.promoScrollPast());
    }
    // should appears only once on scroll up about the half viewport.
    // xpromo fade-in action, if user will scroll
    // window up (only for "minimal" xpromo theme)
    if (!this.isScrollPast() && alreadyScrolledPast) {
      const additionalData = (xpromoThemeIsUsual ? {} : { scroll_note: 'unit_fade_in' });
      dispatch(xpromoActions.trackXPromoEvent(XPROMO_SCROLLUP, additionalData));
      dispatch(xpromoActions.promoScrollUp());
    }
    // remove scroll events for usual xpromo theme 
    // (no needs to listen window up scrolling)
    if (xpromoThemeIsUsual && alreadyScrolledPast && !isXPromoPersistent) {
      this.toggleOnScroll(false);
    }
  }

  isScrollPast() {
    const { alreadyScrolledPast } = this.props;
    let isPastHalfViewport = (window.pageYOffset > window.innerHeight / 2);
    // Fixing an issue, when (height of content part + height of the second xpromo 
    // for bottom padding) is the same as window.pageYOffset. In this case:
    // 1. isPastHalfViewport - is false
    // 2. let's scroll a little bit more
    // 3.1. isPastHalfViewport - become true
    // 3.2. class 'fadeOut' will be deleted 
    // 3.3. second xpromo for bottom padding become hidden (after deleting the class 'fadeOut')
    // 4. window.pageYOffset will become lower again (because of removing height of second xpromo)
    // 5. isPastHalfViewport - will become false 
    // 6. and it will goes around forever...
    // Desynchronizing Up/Down heights, to avoid this issue.
    if (!alreadyScrolledPast) {
      isPastHalfViewport = ((window.pageYOffset - window.innerHeight) > 0);
    }
    return isPastHalfViewport;
  }

  toggleOnScroll(state) {
    if (state) {
      window.addEventListener('scroll', this.onScroll);
    } else {
      window.removeEventListener('scroll', this.onScroll);
    }
  }

  componentDidUpdate() {
    this.launchPersistentExperiment();
  }
  componentWillMount() {
    this.launchPersistentExperiment();
  }
  componentDidMount() {
    this.toggleOnScroll(true);
  }
  componentWillUnmount() {
    this.toggleOnScroll(false);
  }
  render() {
    return this.props.children;
  }
}

const selector = createStructuredSelector({
  currentUrl: state => state.platform.currentPage.url,
  alreadyScrolledStart: state => scrollStartState(state),
  alreadyScrolledPast: state => scrollPastState(state),
  xpromoThemeIsUsual: state => xpromoThemeIsUsual(state),
  isInterstitialDismissed: state => dismissedState(state),
  isXPromoPersistent: state => isXPromoPersistent(state),
});

export default connect(selector)(XPromoWrapper);
