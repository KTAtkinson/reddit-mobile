import { BaseHandler, METHODS } from 'platform/router';

export default class PlacePage extends BaseHandler {
  async [METHODS.GET](dispatch, getState) {
    const state = getState();
    if (state.platform.shell) { return; }
  }
}
