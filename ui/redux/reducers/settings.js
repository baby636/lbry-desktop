import * as ACTIONS from 'constants/action_types';
import moment from 'moment';
import SUPPORTED_LANGUAGES from 'constants/supported_languages';
import { ACTIONS as LBRY_REDUX_ACTIONS, SETTINGS, SHARED_PREFERENCES } from 'lbry-redux';
import { getSubsetFromKeysArray } from 'util/sync-settings';
import { UNSYNCED_SETTINGS } from 'config';
const { CLIENT_SYNC_KEYS } = SHARED_PREFERENCES;
const settingsToIgnore = (UNSYNCED_SETTINGS && UNSYNCED_SETTINGS.trim().split(' ')) || [];
const clientSyncKeys = settingsToIgnore.length
  ? CLIENT_SYNC_KEYS.filter(k => !settingsToIgnore.includes(k))
  : CLIENT_SYNC_KEYS;

const reducers = {};
let settingLanguage = [];
try {
  let appLanguage = window.localStorage.getItem(SETTINGS.LANGUAGE);
  settingLanguage.push(appLanguage);
} catch (e) {}
settingLanguage.push(window.navigator.language.slice(0, 2));
settingLanguage.push('en');

const defaultState = {
  isNight: false,
  findingFFmpeg: false,
  loadedLanguages: [...Object.keys(window.i18n_messages), 'en'] || ['en'],
  customWalletServers: [],
  syncEnabledPref: undefined, // set this during sign in, copy it to clientSettings immediately after prefGet after signedin but before sync
  sharedPreferences: {},
  daemonSettings: {},
  daemonStatus: { ffmpeg_status: {} },
  clientSettings: {
    // UX
    [SETTINGS.EMAIL_COLLECTION_ACKNOWLEDGED]: false,
    [SETTINGS.FOLLOWING_ACKNOWLEDGED]: false,
    [SETTINGS.TAGS_ACKNOWLEDGED]: false,
    [SETTINGS.ENABLE_SYNC]: IS_WEB,

    // UI
    [SETTINGS.LANGUAGE]: settingLanguage.find(language => SUPPORTED_LANGUAGES[language]),
    [SETTINGS.THEME]: __('light'),
    [SETTINGS.THEMES]: [__('light'), __('dark')],
    [SETTINGS.HIDE_SPLASH_ANIMATION]: false,
    [SETTINGS.HIDE_BALANCE]: false,
    [SETTINGS.OS_NOTIFICATIONS_ENABLED]: true,
    [SETTINGS.AUTOMATIC_DARK_MODE_ENABLED]: false,
    [SETTINGS.TILE_LAYOUT]: true,

    [SETTINGS.DARK_MODE_TIMES]: {
      from: { hour: '21', min: '00', formattedTime: '21:00' },
      to: { hour: '8', min: '00', formattedTime: '8:00' },
    },

    // Purchasing
    [SETTINGS.INSTANT_PURCHASE_ENABLED]: false,
    [SETTINGS.INSTANT_PURCHASE_MAX]: {
      currency: 'LBC',
      amount: 0.1,
    },

    // Content
    [SETTINGS.SHOW_MATURE]: false,
    [SETTINGS.AUTOPLAY]: true,
    [SETTINGS.AUTOPLAY_NEXT]: true,
    [SETTINGS.FLOATING_PLAYER]: true,
    [SETTINGS.AUTO_DOWNLOAD]: true,
    [SETTINGS.HIDE_REPOSTS]: false,

    // OS
    [SETTINGS.AUTO_LAUNCH]: true,
    [SETTINGS.TO_TRAY_WHEN_CLOSED]: true,
  },
};

reducers[ACTIONS.REHYDRATE] = (state, action) => {
  const { clientSettings } = state;
  if (action && action.payload && action.payload.settings) {
    const persistedSettings = action.payload && action.payload.settings;
    const persistedClientSettings = persistedSettings.clientSettings;
    const newClientSettings = { ...clientSettings, ...persistedClientSettings };
    return Object.assign({}, state, { ...persistedSettings, clientSettings: newClientSettings });
  }
  return Object.assign({}, state, { clientSettings });
};

reducers[ACTIONS.FINDING_FFMPEG_STARTED] = state =>
  Object.assign({}, state, {
    findingFFmpeg: true,
  });

reducers[ACTIONS.FINDING_FFMPEG_COMPLETED] = state =>
  Object.assign({}, state, {
    findingFFmpeg: false,
  });

reducers[LBRY_REDUX_ACTIONS.DAEMON_SETTINGS_RECEIVED] = (state, action) =>
  Object.assign({}, state, {
    daemonSettings: action.data.settings,
  });

reducers[LBRY_REDUX_ACTIONS.DAEMON_STATUS_RECEIVED] = (state, action) =>
  Object.assign({}, state, {
    daemonStatus: action.data.status,
  });

reducers[ACTIONS.CLIENT_SETTING_CHANGED] = (state, action) => {
  const { key, value } = action.data;
  const clientSettings = Object.assign({}, state.clientSettings);

  clientSettings[key] = value;

  return Object.assign({}, state, {
    clientSettings,
  });
};

reducers[ACTIONS.UPDATE_IS_NIGHT] = state => {
  const { from, to } = state.clientSettings[SETTINGS.DARK_MODE_TIMES];
  const momentNow = moment();
  const startNightMoment = moment(from.formattedTime, 'HH:mm');
  const endNightMoment = moment(to.formattedTime, 'HH:mm');
  const isNight = !(momentNow.isAfter(endNightMoment) && momentNow.isBefore(startNightMoment));

  return Object.assign({}, state, {
    isNight,
  });
};

reducers[ACTIONS.DOWNLOAD_LANGUAGE_SUCCESS] = (state, action) => {
  const { loadedLanguages } = state;
  const { language } = action.data;

  if (language && loadedLanguages && !loadedLanguages.includes(language)) {
    return Object.assign({}, state, {
      loadedLanguages: [...loadedLanguages, language],
    });
  } else {
    return state;
  }
};

reducers[LBRY_REDUX_ACTIONS.SHARED_PREFERENCE_SET] = (state, action) => {
  const { key, value } = action.data;
  const sharedPreferences = Object.assign({}, state.sharedPreferences);
  sharedPreferences[key] = value;

  return Object.assign({}, state, {
    sharedPreferences,
  });
};

reducers[ACTIONS.SYNC_CLIENT_SETTINGS] = state => {
  const { clientSettings } = state;
  const sharedPreferences = Object.assign({}, state.sharedPreferences);
  const selectedClientSettings = getSubsetFromKeysArray(clientSettings, clientSyncKeys);
  const newSharedPreferences = { ...sharedPreferences, ...selectedClientSettings };
  return Object.assign({}, state, { sharedPreferences: newSharedPreferences });
};

reducers[ACTIONS.SYNC_PREFERENCE_CHANGED] = (state, action) => {
  return Object.assign({}, state, {
    syncEnabledPref: action.data,
  });
};

reducers[LBRY_REDUX_ACTIONS.USER_STATE_POPULATE] = (state, action) => {
  const { clientSettings: currentClientSettings, syncEnabledPref } = state;
  const { settings: sharedPreferences } = action.data;
  // we have to update the signin sync checkbox in here
  // where we can simulataneously set the checkbox temp value to undefined, and
  // update the sync setting before sync happens
  // temp box must be undefined to trigger the items in the syncSubscribe effect
  const syncSettingOrEmpty = syncEnabledPref !== undefined ? { enable_sync: syncEnabledPref } : {};

  const selectedSettings = sharedPreferences ? getSubsetFromKeysArray(sharedPreferences, clientSyncKeys) : {};
  const mergedClientSettings = { ...currentClientSettings, ...selectedSettings, ...syncSettingOrEmpty };
  const newSharedPreferences = sharedPreferences || {};
  return Object.assign({}, state, {
    sharedPreferences: newSharedPreferences,
    clientSettings: mergedClientSettings,
    syncEnabledPref: undefined,
  });
};

reducers[LBRY_REDUX_ACTIONS.SAVE_CUSTOM_WALLET_SERVERS] = (state, action) => {
  return Object.assign({}, state, { customWalletServers: action.data });
};

export default function reducer(state = defaultState, action) {
  const handler = reducers[action.type];
  if (handler) return handler(state, action);
  return state;
}
