import { afterEach, expect, it, vi } from 'vitest'
import { subscribeLive } from './livePool'
import type { LiveState } from '../live'

class Socket {
  onopen:(()=>void)|null=null
  onmessage:((event:{data:string})=>void)|null=null
  onerror:(()=>void)|null=null
  onclose:(()=>void)|null=null
  close(){this.onclose?.()}
}

afterEach(()=>vi.unstubAllGlobals())

it('reuses the last Live candle window immediately after a chart unsubscribes and returns',async()=>{
  const width=4*60*60*1000,time=Math.floor(Date.now()/width)*width
  const history=[[time-2*width,'99','102','98','100','5'],[time-width,'100','103','99','101','6']]
  vi.stubGlobal('WebSocket',Socket)
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>history})))

  const firstStates:LiveState[]=[]
  const unsubscribe=subscribeLive('SOLUSDT','4h',state=>firstStates.push(state))
  await vi.waitFor(()=>expect(firstStates.at(-1)?.bars).toHaveLength(2))
  const cachedBars=firstStates.at(-1)!.bars
  unsubscribe()

  const resumedStates:LiveState[]=[]
  const unsubscribeAgain=subscribeLive('SOLUSDT','4h',state=>resumedStates.push(state))
  expect(resumedStates[0]?.bars).toEqual(cachedBars)
  expect(resumedStates[0]?.status).toBe('syncing')
  unsubscribeAgain()
})
