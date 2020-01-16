import axios from 'axios';

window.axios = axios;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

axios.interceptors.request.use(config => config);

axios.interceptors.response.use(response => response, (error) => {
  removeRequest(error.config);
  return Promise.reject(error);
});
