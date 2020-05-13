const twirpError = err => {
  const resp = err.response;
  let twirpError = {
      code: 'unknown',
      msg: 'unknown error',
      meta: {}
  };

  if (resp) {
      const headers = resp.headers;
      const data = resp.data;

      if (headers['content-type'] === 'application/json') {
          let s = data.toString();

          if (s === "[object ArrayBuffer]") {
              s = new TextDecoder("utf-8").decode(new Uint8Array(data));
          }

          try {
              twirpError = JSON.parse(s);
          } catch (e) {
              twirpError.msg = `JSON.parse() error: ${e.toString()}`
          }
      }
  }

  return twirpError;
};

export const newRPC = (axios, methodNameLookupFn) => {
  return (method, requestData, callback) => {
    axios({
      method: 'POST',
      url: methodNameLookupFn(method),
      headers: {
        'Content-Type': 'application/protobuf'
      },
      // required to get an arraybuffer of the actual size, not the 8192 buffer pool that protobuf.js uses
      // see: https://github.com/protobufjs/protobuf.js/issues/852
      data: requestData.slice(),
      responseType: 'arraybuffer'
    })
    .then(resp => {
      callback(null, new Uint8Array(resp.data));
    })
    .catch(err => {
      callback(twirpError(err), null);
    });
  };
}
