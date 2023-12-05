const statuses = require('statuses')
const axios = require('./axios')

const { AxiosError, Cancel } = axios

module.exports = function weappAdapter(config) {
  return new Promise((resolve, reject) => {
    const { data, headers, method, timeout, cancelToken, validateStatus } =
      config
    const fullUrl = axios.getUri(config)
    const httpMethod =
      typeof method === 'string' ? method.toUpperCase() : method
    const subsCancelToken = cancelToken

    // 数据格式抓换使用 axios transform 进行处理，这里默认传输普通字符串
    let request = wx.request({
      url: fullUrl,
      data: data,
      dataType: '其他',
      header: headers,
      method: httpMethod,
      responseType: 'text',
      enableHttp2: true,
      enableQuic: true,
      timeout: timeout,
      success: function success(result) {
        const header = result.header,
          data = result.data,
          statusCode = result.statusCode
        const response = {
          data: data,
          status: statusCode,
          statusText: statuses.message[statusCode] || '',
          headers: header,
          config: config,
          request: request,
        }

        if (!validateStatus || (validateStatus && validateStatus(statusCode))) {
          resolve(response)
        }

        reject(
          new AxiosError(
            'Request failed with status code '.concat(statusCode),
            String(statusCode),
            config,
            request,
            response,
          ),
        )
      },
      fail: function fail(result) {
        var errMsg = result.errMsg
        reject(new AxiosError(errMsg, '0', config, request))
      },
      complete: function complete() {
        subsCancelToken &&
          subsCancelToken.unsubscribe &&
          subsCancelToken.unsubscribe(onCancel)
        request = null
      },
    })

    function onCancel(cancel) {
      if (!request) return
      reject(
        !cancel || !axios.isCancel(cancel) ? new Cancel('canceled') : cancel,
      )
      request.abort()
      request = null
    }
    subsCancelToken &&
      subsCancelToken.subscribe &&
      subsCancelToken.subscribe(onCancel)
  })
}
