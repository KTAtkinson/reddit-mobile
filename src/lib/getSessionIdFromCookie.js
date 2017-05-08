import cookies from 'js-cookie';

export default () => {
  const cookieStr = cookies.get('session_tracker');

  if (cookieStr) {
    const [sessionId] = cookieStr.split('.');
    return sessionId;
  }

  return null;
};
