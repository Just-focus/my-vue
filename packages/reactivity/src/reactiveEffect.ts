import { activeEffect, trackEffect, triggerEffects } from './effect';

const targetMap = new WeakMap(); // 记录依赖关系

export function createDep(cleanUp) {
  const dep: any = new Map();
  dep.cleanUp = cleanUp;
  return dep;
}

export function track(target, key) {
  if(activeEffect) {
    let depsMap = targetMap.get(target);
    if(!depsMap) {
      targetMap.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key);
    if(!dep) {
      // {对象：{ 属性 :{ effect, effect }}}
			depsMap.set(key, (dep = createDep(() => depsMap.delete(key))));
    }
    trackEffect(activeEffect, dep);
  }
}

export function trigger(target, key?, newValue?, oldValue?) {
	// 通过对象找到属性对应的映射表
	const depsMap = targetMap.get(target);
	if (!depsMap) {
		return;
	}
	// 通过属性找到 effectMap
	const dep = depsMap.get(key);
	if (dep) {
		triggerEffects(dep);
	}
}