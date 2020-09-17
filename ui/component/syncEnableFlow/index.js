import { SETTINGS } from 'lbry-redux';
import { connect } from 'react-redux';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import {
  selectGetSyncErrorMessage,
  selectHasSyncedWallet,
  selectGetSyncIsPending,
  selectHashChanged,
  doCheckSync,
  doGetSync,
} from 'lbryinc';
import { makeSelectClientSetting, selectWalletSyncPreference } from 'redux/selectors/settings';
import { doSetWalletSyncPreference } from 'redux/actions/settings';
import SyncToggle from './view';

const select = state => ({
  syncEnabled: selectWalletSyncPreference(state),
  hasSyncedWallet: selectHasSyncedWallet(state),
  hasSyncChanged: selectHashChanged(state),
  verifiedEmail: selectUserVerifiedEmail(state),
  getSyncError: selectGetSyncErrorMessage(state),
  getSyncPending: selectGetSyncIsPending(state),
  language: makeSelectClientSetting(SETTINGS.LANGUAGE)(state),
});

const perform = dispatch => ({
  setSyncEnabled: value => dispatch(doSetWalletSyncPreference(value)),
  checkSync: () => dispatch(doCheckSync()),
  getSync: (pw, cb) => dispatch(doGetSync(pw, cb)),
});

export default connect(select, perform)(SyncToggle);
