import createTest from 'platform/createTest';
import theme from './theme';
import { COLOR_SCHEME } from 'app/constants';
import * as themeActions from 'app/actions/theme';
import * as loginActions from 'app/actions/login';

const { DAYMODE, NIGHTMODE } = COLOR_SCHEME;

createTest({ reducers: { theme } }, ({ getStore, expect }) => {
  describe('theme', () => {
    describe('LOGGED_IN and LOGGED_OUT', () => {
      it('should return default on log in', () => {
        const { store } = getStore({ theme: NIGHTMODE });
        store.dispatch(loginActions.loggedIn());

        const { theme } = store.getState();
        expect(theme).to.eql(DAYMODE);
      });

      it('should return default on log out', () => {
        const { store } = getStore({ theme: NIGHTMODE });
        store.dispatch(loginActions.loggedOut());

        const { theme } = store.getState();
        expect(theme).to.eql(DAYMODE);
      });
    });

    describe('SET_THEME', () => {
      it('should update the theme', () => {
        const { store } = getStore({ theme: 'foo' });
        store.dispatch(themeActions.setTheme('bar'));

        const { theme } = store.getState();
        expect(theme).to.equal('bar');
      });
    });
  });
});
