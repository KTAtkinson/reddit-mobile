import createTest from 'platform/createTest';
import routes from 'app/router';
import persistent, { DEFAULT } from './index';
import * as xpromoActions from 'app/actions/xpromo';

createTest({ reducers: { persistent }, routes }, ({ getStore, expect }) => {
  describe('/xpromo/persistent', () => {

    describe('XPROMO_PERSIST_ACTIVE', () => {
      it('should change `active` to be true', () => {
        const { store } = getStore({ persistent: DEFAULT });
        store.dispatch(xpromoActions.promoPersistActivate());
        const { persistent } = store.getState();
        expect(persistent.active).to.eql(true);
      });
    });

    describe('XPROMO_PERSIST_DEACTIVE', () => {
      it('should change `active` to be false', () => {
        const { store } = getStore({ persistent: DEFAULT });
        store.dispatch(xpromoActions.promoPersistDeactivate());
        const { persistent } = store.getState();
        expect(persistent.active).to.eql(false);
      });
    });

    describe('XPROMO_DISMISS_CLICKED', () => {
      it('should change `dismissed` to be true', () => {
        const { store } = getStore({ persistent: DEFAULT });
        store.dispatch(xpromoActions.promoDismissed());
        const { persistent } = store.getState();
        expect(persistent.dismissed).to.eql(true);
      });
    });
  });
});
