// @flow
import * as PAGES from 'constants/pages';
import React from 'react';
import Nag from 'component/common/nag';
import { SETTINGS } from 'lbry-redux';
import { useHistory } from 'react-router';

type Props = {
  followingAcknowledged: boolean,
  firstRunStarted: boolean,
  setClientSetting: (string, boolean) => void,
  syncSetttings: () => void,
};

export default function NagContinueFirstRun(props: Props) {
  const { firstRunStarted, followingAcknowledged, setClientSetting, syncSetttings } = props;
  const {
    location: { pathname },
    push,
  } = useHistory();
  const isOnFirstRun = pathname.includes(PAGES.AUTH);

  function onClose() {
    setClientSetting(SETTINGS.FOLLOWING_ACKNOWLEDGED, true);
    syncSetttings();
  }

  function handleContinue() {
    push(`/$/${PAGES.AUTH}`);
  }

  if (isOnFirstRun || !firstRunStarted || followingAcknowledged) {
    return null;
  }

  return (
    <Nag
      type="helpful"
      message={__('Do you still want to find creators to follow?')}
      actionText={__('Continue')}
      onClick={handleContinue}
      onClose={onClose}
    />
  );
}
