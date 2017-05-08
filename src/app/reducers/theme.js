import * as themeActions from 'app/actions/theme';
import * as loginActions from 'app/actions/login';

import { COLOR_SCHEME } from 'app/constants';

export const DEFAULT = COLOR_SCHEME.DAYMODE;

export default (state=DEFAULT, action={}) => {
  switch (action.type) {
    case loginActions.LOGGED_IN:
    case loginActions.LOGGED_OUT: {
      return DEFAULT;
    }

    case themeActions.SET_THEME: {
      if (action.theme !== state) {
        return action.theme;
      }

      return state;
    }

    default: return state;
  }
};
