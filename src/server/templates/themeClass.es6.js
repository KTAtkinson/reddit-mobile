import { COLOR_SCHEME } from '../../app/constants';

const { DAYMODE } = COLOR_SCHEME;

export const themeClass = (theme) => {
  return theme === DAYMODE ? 'dayMode' : 'nightMode';
};
