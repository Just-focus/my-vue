import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";
import { isRef } from "./ref";

function traverse(source, depth, currentDepth = 0, seen = new Set()) {
  if(!isObject(source)) {
    return source;
  }
  if(depth) {
    if(currentDepth >= depth) {
      return source;
    }
    currentDepth ++;
  }

  if(seen.has(source)) {
    return source;
  }

  // 遍历触发每个属性的 get
  for(let key in source) {
    traverse(source[key], depth, currentDepth, seen);
  }
 
  return source;
}

function doWatch(source, cb, options) {
  const { deep, immediate } = options;
  const reactiveGetter = (source) => traverse(source, deep === false ? 1 : undefined);

  let getter
  if(isReactive(source)) {
    getter = () => reactiveGetter(source);
  }else if(isRef(source)) {
    getter = () => source.value;
  }else if(isFunction(source)) {
    getter = source;
  }

  let oldValue;
  let clean

  const onCleanup = (fn) => {
    clean = () => {
      fn();
      clean = undefined
    };
  }

  const job = () => {
    if(cb) {
      if(clean) {
        clean(); // 在执行回调前，先清理上一次的清理操作
      }

      const newValue = effect.run();
      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    }else {
      effect.run();
    }
  }

  const effect = new ReactiveEffect(getter, job)

  if(cb) {
    if(immediate) { // 立即先执行一次用户的回调
      job();
    }else {
      oldValue = effect.run();
    }
  }else {
    effect.run();
  }

  const unwatch = () => {
    effect.stop();
  }

  return unwatch;
}

export function watch(source, cb, options) {
  return doWatch(source, cb, options);
}

export function watchEffect(source, options) {
  return doWatch(source, null, options);
}