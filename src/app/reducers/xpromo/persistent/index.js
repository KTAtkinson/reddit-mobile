/**
 * @module {function} persistent
 * @memberof app/reducers/xpromo
 *
 * This reducer manages all of the xpromo persistent state.
 */
import merge from 'platform/merge';
import * as xpromoActions from 'app/actions/xpromo';

export const DEFAULT = {
  // Apply fade animation to toggle
  // display of persistent banner
  active: false,
  // Dismiss xpromo by click (currently needs
  // only for the persistent banner experiment)
  dismissed: false,
};

export default function(state=DEFAULT, action={}) {
  switch (action.type) {
    case xpromoActions.XPROMO_DISMISS_CLICKED: {
      return merge(state, {
        dismissed: true,
      });
    }
    case xpromoActions.XPROMO_PERSIST_ACTIVE: {
      return merge(state, {
        active: true,
      });
    }
    case xpromoActions.XPROMO_PERSIST_DEACTIVE: {
      return merge(state, {
        active: false,
      });
    }
    default: return state;
  }
}
