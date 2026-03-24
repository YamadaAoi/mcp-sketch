/**
 * 判断是否为数字
 * @param val - 输入值
 * @returns 是否为数字
 */
export function isNumber(val: unknown) {
  if (typeof val === 'number') {
    return !Number.isNaN(val)
  }
  return typeof val === 'string' && val && !Number.isNaN(Number(val.trim()))
}

/**
 * 若数字小数位数大于 n 位，则四舍五入保留 n 位；否则原样返回。
 * @param num - 输入数字
 * @param n - 需要保留的小数位数 (非负整数)
 * @returns 处理后的数字
 */
export function roundIfExceeds(num?: string | number, n = 2) {
  if (!isNumber(num)) {
    return num
  }
  if (Number.isInteger(num)) {
    return num
  }
  if (`${num}`.includes('.')) {
    const arr = `${num}`.split('.')
    if (arr.length === 2 && arr[1].length > n) {
      return Number(Number(num).toFixed(n))
    } else {
      return num
    }
  } else {
    return num
  }
}
