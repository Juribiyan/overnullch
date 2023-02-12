function makeEscapeTagLiteralFn(fn = v => v) {
  return function(strings, ...values) {
    let result = ""
    for (let i = 0; i < strings.length; i++) {
      result += strings[i]
      if (i < values.length) {
        result += fn(''+values[i])
      }
    }
    return result
  }
}