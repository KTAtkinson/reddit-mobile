import makeRequest from './makeRequest';
import config from 'config';
import ResponseError from 'apiClient/errors/ResponseError';
import logSafeJSONStringify from 'lib/logSafeJSONStringify';

// TODO fix configs so 'server' comes through on the server. process.env.ENV will
// be 'client' on the ... client
const ENV = (process.env.ENV || 'server').toUpperCase();

const isAPIFailure = details => details.error instanceof ResponseError;


export default function errorLog(details={}, errorEndpoints={}, options={ SHOULD_RETHROW: true}) {
  // parse the stack for location details if we're passed
  // an Error or PromiseRejectionEvent
  const { error, rejection } = details;
  const failure = error || rejection;
  if (!failure || failure._SEEN_BY_ERROR_LOG) {
    // we've already seen this error and rethrew it so chrome will do it's default logging
    return;
  }

  let parsedDetails = { ...details };
  if (error) {
    parsedDetails = { ...parsedDetails, ...parseError(error) };
  } else if (rejection) {
    parsedDetails = { ...parsedDetails, ...parseRejection(rejection) };
  }

  const logJSON = buildLogJSON(parsedDetails);
  // rethrow rejections and errors on the client so chrome gives us a fancy stack
  // trace, that will take advantage of the async stack traces option in
  // chrome dev-tools
  if (process.env.ENV === 'client') {
    if (options.SHOULD_RETHROW) { // this is an option so the top-level
      // event listeners in `src/Client` can prevent errors from being
      // logged in the chrome console twice.
      const rethrownThing = error || rejection;
      try {
        rethrownThing._SEEN_BY_ERROR_LOG = true;
        setTimeout(() => {
          throw rethrownThing;
        });
      } catch (e) {
        // We probably weren't able to assign `_SEEN_BY_ERROR_LOG`, which
        // we rely on to prevent logging errors forever in a loop.
        // Fallback to console.error (which has an expandable stack trace, but
        // it's not as good as the default ones)
        if (console.error) {
          console.error(parsedDetails.message);
        } else {
          // ultra-fallback
          console.log(parsedDetails.message, parsedDetails.stack);
        }
      }
    }
  } else {
    console.log(formatLogJSON(logJSON));
  }

  // send to local log
  if (errorEndpoints.log) {
    sendErrorLog(logJSON, errorEndpoints.log);
  }

  // send to statsd
  if (errorEndpoints.hivemind) {
    const ua = simpleUA(details.userAgent || '');
    hivemind(ua, errorEndpoints.hivemind, isAPIFailure(details));
  }
}

const parseError = error => {
  // error should be an instanceof Error
  const message = `Error: ${error.message}`;

  if (error.stack) {
    return {
      ...parseStackTrace(error.stack),
      message,
      stack: error.stack,
    };
  }

  return { message };
};

const parseRejection = rejection => {
  // rejection should be an instanceof PromiseRejectionEvent
  // sometimes the rejection reason is a POJO and calling to string isn't
  // helpful because its just "[object Object]" in that case, stringify the
  // whole object. It will be really verbose in some cases, but much more helpful
  let rejectionReason = `${rejection.reason}`; // convert to string, but linter friendly
  if (rejectionReason === ({}).toString()) {
    rejectionReason = logSafeJSONStringify(rejection.reason);
  }

  const message = `Rejection: ${rejectionReason}`;
  if (rejection.reason && rejection.reason.stack) {
    return {
      ...parseStackTrace(rejection.reason.stack),
      message,
      stack: rejection.reason.stack,
    };
  }

  return { message };
};

// When parsing stack traces, the lines with source information look like
// `${url}:${line}:${column}`
// When we split on ':' the line is the second to last item, and column is last
const LINE_OFFSET = 2;
const COLUMN_OFFSET = 1;

const parseStackTrace = stack => {
  const lines = stack.split('\n');
  // the line with source info is the first line in the stack trace with a colon,
  // but isn't the first line, because the error message itself could contain a colon
  const errorLine = lines.find((line, index) => index > 0 && line.indexOf(':') > -1);
  if (!errorLine) {
    return {};
  }

  const parts = textInParens(errorLine).split(':');
  if (parts && parts.length >= LINE_OFFSET) {
    const numParts = parts.length;

    return {
      url: parts.slice(0, numParts - LINE_OFFSET).join(':'),
      line: parts[numParts - LINE_OFFSET],
      column: parts[numParts - COLUMN_OFFSET],
    };
  }

  return {};
};

const textInParens = string => {
  const match = string.match(/.*\((.*)\).*/);
  if (match) {
    return match[1];
  }

  return '';
};

const buildLogJSON = details => {
  if (!details) { return {}; }

  const {
    userAgent='UNKNOWN UA',
    message='NO MESSAGE',
    reduxInfo,
    url,
    line,
    column,
    requestUrl='NO REQUEST URL',
    stack,
    possibleDuplicate, // This is for cases when an error might have
    // already been logged. e.g. a promise chains can lead to the same
    // error getting passed to multiple .catch handlers or the
    // same error reaching the .catch handler twice.
  } = details;

  return {
    env: ENV,
    userAgent,
    isAPIFailure: isAPIFailure(details),
    message,
    requestUrl,
    reduxInfo,
    url,
    line,
    column,
    // We have a max limit of 4096 bytes per log line. To prevent log lines
    // from overflowing and becoming invalid JSON, we're truncating the error
    // stack or rejection response to the most relevant parts.
    stack: stack && stack.substring(0, 2048),
    possibleDuplicate,
  };
};

export const formatLogJSON = logJSON => {
  // Formats json blobs generated by `buildLogJSON` for printing on the server
  // In production mode, we just return the json string'ified. We do this
  // so stack traces have newlines escaped and the json blob takes up one line,
  // which makes it really easy to filter the log by way of grep. Having json
  // lines means its easy for scripts to parse and filter the logs too.
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(logJSON);
  }

  // Otherwise, JSON.stringify with indentation so its easy to grok logs in dev
  return JSON.stringify(logJSON, null, 2).replace(/\\n/g, '\n');
};

export const logServerError = (error, ctx) => {
  errorLog({
    error,
    requestUrl: ctx.request.url,
    userAgent: ctx.headers['user-agent'],
  }, {
    hivemind: config.statsURL,
  });
};

if (typeof window !== 'undefined') {
  window.ppError = errorJSON => {
    // pretty print error-json from production error log, chrome will pick up the
    // url+line&column info in the stack and let you click in to the source
    console.log(JSON.stringify(errorJSON, null, 2).replace(/\\n/g, '\n'));
  };
}

const simpleUA = agent => {
  if (/server/i.test(agent)) { return 'server'; }

  // Googlebot does silly things like tell us it's iPhone, check first
  // see https://googlewebmastercentral.blogspot.com/2014/01/a-new-googlebot-user-agent-for-crawling.html
  if (/Googlebot/i.test(agent)) { return 'googlebot-js-client'; }

  if (/iPhone/i.test(agent) || /iPad/i.test(agent) || /iPod/i.test(agent)) {
    if (/CriOS/i.test(agent)) {
      return 'ios-chrome';
    }

    return 'ios-safari';
  }

  // Windows Phone 10 adds android to the UA, put this test first
  if (/Windows Phone/i.test(agent) || /Trident/i.test(agent)) { return 'windows-phone'; }

  if (/android/i.test(agent)) {
    if (/Version/i.test(agent)) {
      return 'android-stock-browser';
    }

    return 'android-chrome';
  }

  return 'unknownClient';
};

const sendErrorLog = (error, endpoint) => {
  makeRequest
    .post(endpoint)
    .send({ error })
    .then()
    .catch(() => {}); // pass `.catch` a function to prevent logging errors in logging errors
};

const hivemind = (ua, endpoint, isAPIFailure) => {
  const segment = isAPIFailure ? 'mweb2XAPIError' : 'mweb2XError';
  const data = {
    [segment]: {},
  };

  data[segment][ua] = 1;

  makeRequest
    .post(endpoint)
    .type('json')
    .send(data)
    .timeout(3000)
    .then()
    .catch(() => {}); // pass `.catch` a function to prevent logging errors in logging errors
};
