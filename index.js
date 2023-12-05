const axios = require('./lib/axios')
axios.defaults.adapter = require('./lib/adapter')
module.exports = axios
