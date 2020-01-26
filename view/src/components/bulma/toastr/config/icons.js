import {
  library,
} from '@fortawesome/fontawesome-svg-core';
import {
  faComment,
  faInfoCircle,
  faCheckCircle,
  faExclamationCircle,
  faTimes,
}
  from '@fortawesome/free-solid-svg-icons';

library.add([
  faComment, faInfoCircle, faCheckCircle, faExclamationCircle, faTimes,
]);

export default {
  message: faComment,
  primary: faComment,
  info: faInfoCircle,
  success: faCheckCircle,
  warning: faExclamationCircle,
  danger: faTimes,
};
