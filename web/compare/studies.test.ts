import {expect,it} from 'vitest'
import { defaultStudy, paneTypes, effectiveMagnet, applyModifierKey, barCloseCountdown, lastPriceBadgePlace, syncViewport, normalizeStudy } from './studies'
it('puts oscillators in their own lower panes and keeps price overlays on price',()=>{
  expect(paneTypes(['EMA','RSI','MACD','BOLL','ATR','STOCH','VWAP'])).toEqual(['RSI','MACD','ATR','STOCH'])
  expect(defaultStudy('RSI').placement).toBe('below')
  expect(defaultStudy('EMA').placement).toBe('price')
})
it('restores the persistent magnet after a modifier release',()=>{
  expect(effectiveMagnet('none',true)).toBe('weak')
  expect(effectiveMagnet('none',false)).toBe('none')
  expect(effectiveMagnet('strong',true)).toBe('strong')
  expect(effectiveMagnet('strong',false)).toBe('strong')
})
it('clears Cmd/Ctrl on the modifier keyup even when metaKey stays true',()=>{
  const down=applyModifierKey([],{type:'keydown',key:'Meta'})
  expect([...down]).toEqual(['Meta'])
  expect([...applyModifierKey(down,{type:'keyup',key:'Meta'})]).toEqual([])
  expect([...applyModifierKey(down,{type:'blur'})]).toEqual([])
})
it('formats remaining time until the current UTC bar closes',()=>{
  expect(barCloseCountdown(Date.UTC(2026,0,1,12,4,30),'5m')).toBe('0:30')
  expect(barCloseCountdown(Date.UTC(2026,0,1,12,0,0),'5m')).toBe('5:00')
  expect(barCloseCountdown(Date.UTC(2026,0,1,13,0,0),'1h')).toBe('1:00:00')
})
it('pins the last-price badge so the price row sits on the last-price line',()=>{
  expect(lastPriceBadgePlace(200,400,80)).toEqual({top:191,width:80})
  expect(lastPriceBadgePlace(390,400,80)).toEqual({top:368,width:80})
  expect(lastPriceBadgePlace(null,400,80)).toBeNull()
})
it('bounds settings and retains a valid above-price pane configuration',()=>{
  const settings=normalizeStudy('RSI',{period:0,height:9999,placement:'above',color:'#abcdef',width:2})
  expect(settings.period).toBe(1);expect(settings.height).toBe(400);expect(settings.placement).toBe('above')
  expect(settings.color).toBe('#abcdef')
})
it('synchronizes logical ranges without recursive feedback',()=>{
  let aCalls=0,bCalls=0
  const callbacks:((range:{from:number;to:number}|null)=>void)[]=[]
  const a={set:(range:{from:number;to:number})=>{aCalls++;callbacks[0](range)},subscribe:(fn:typeof callbacks[number])=>{callbacks[0]=fn;return()=>{}}}
  const b={set:(range:{from:number;to:number})=>{bCalls++;callbacks[1](range)},subscribe:(fn:typeof callbacks[number])=>{callbacks[1]=fn;return()=>{}}}
  const off=syncViewport([a,b]);callbacks[0]({from:20,to:80});expect(aCalls).toBe(0);expect(bCalls).toBe(1);off()
})
