import * as themeActions from '../../app/actions/theme';
import { COLOR_SCHEME } from '../../app/constants';
import { DEFAULT } from '../../app/reducers/theme';
import { permanentCookieOptions } from './permanentCookieOptions';

const { DAYMODE, NIGHTMODE } = COLOR_SCHEME;

export const dispatchInitialTheme = async (ctx, dispatch) => {
  const themeCookie = ctx.cookies.get('theme');
  const themeFromQuery = ctx.query.theme;
  let theme = themeFromQuery || themeCookie;

  if (!(theme === NIGHTMODE || theme === DAYMODE)) {
    theme = DEFAULT;
  }

  // NOTE: there was a bug were we set HTTP_ONLY cookies so the client' couldn't
  // override them. Set this cookie no matter what so httpOnly flag is removed
  // for those users affected
  ctx.cookies.set('theme', theme, permanentCookieOptions());

  dispatch(themeActions.setTheme(theme));
};
