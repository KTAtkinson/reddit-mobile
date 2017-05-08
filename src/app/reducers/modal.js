/**
 * Reducer handling the type of modal currently being displayed. When `type`
 * is null, no modal is showing.
 *
 * `props` is a special unstructured field that allows you to pass properties
 * from an initiator, such as hitting the report button, to the modal. Since
 * modals in mweb are top level components, this is acting as a transport
 * mechanism from lower in the React hierarchy to the top.
*/
import merge from 'platform/merge';
import * as modalActions from 'app/actions/modal';
import * as reportingActions from 'app/actions/reporting';
import * as rulesModalActions from 'app/actions/rulesModal';


export const DEFAULT = {
  type: null,
  props: {},
};

export default (state=DEFAULT, action={}) => {
  switch (action.type) {
    case reportingActions.REPORT:
    case rulesModalActions.RULES_MODAL_DISPLAYED:
      return merge(state, { type: action.modalType, props: action.modalProps });

    case modalActions.CLOSE:
      return merge(state, { type: null, props: {} });

    default:
      return state;
  }
};
