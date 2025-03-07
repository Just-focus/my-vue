import { isObject } from "@vue/shared";

export function reactive(target) {
  return createReactiveObject(target)
}

function createReactiveObject(target) {
  // 统一做判断，响应式对象必须是对象才可以
  if(!isObject(target)) {
    return
  }
}