import { activeEffect, trackEffect, triggerEffects } from "./effect";
import { toReactive } from "./reactive";
import { createDep } from "./reactiveEffect";

function createRef(value) {
  return new RefImpl(value);
}

// 依赖收集
export function trackRefValue(ref) {
  if(activeEffect) {
    trackEffect(activeEffect, (ref.dep = ref.dep || createDep(() => (ref.dep = undefined))));
  }
}

// 出发更新
export function triggerRefValue(ref) {
  const dep = ref.dep;
  if(dep) {
    triggerEffects(dep);
  }
}

class RefImpl {
  public __v_isRef = true;
  public _value; // 用于保存 ref 的值
  public dep; // 用于收集对应的 effect

  constructor(public rawValue) {
    this._value = toReactive(rawValue);
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    if(newValue !== this._value) {
      this.rawValue = newValue;
      this._value = newValue;
    }
    triggerRefValue(this);
  }
}

class ObjectRefImpl {
  public __v_isRef = true; // 增加 ref 标识

  constructor(public _object, public _key) {}

  get value() {
    return this._object[this._key];
  }
  set value(newValue) {
    this._object[this._key] = newValue;
  }
}

export function ref(value) {
  return createRef(value);
}

export function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}

export function toRefs(object) {
  const res = {};
  for (let key in object) {
    res[key] = toRef(object, key);
  }
  return res;
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key, receiver) {
      const r = Reflect.get(target, key, receiver);
      // 自动脱 Ref
      return r.__v_isRef ? r.value : r;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      // 如果老值是 Ref ，需要给 Ref 赋值
      if (oldValue.__v_isRef) {
        oldValue.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    },
  });
}

export function isRef(value) {
  return !!(value && value.__v_isRef);
}