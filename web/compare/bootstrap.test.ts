import {afterEach,expect,it,vi} from 'vitest'
import {loadOpenChartsBootstrap} from './bootstrap'

afterEach(()=>vi.restoreAllMocks())

it('initializes the OpenCharts dataset version from markets without reading a Vela session',async()=>{
 const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(JSON.stringify({markets:[],datasetVersion:'dataset-v1'}),{status:200,headers:{'Content-Type':'application/json'}}))
 const result=await loadOpenChartsBootstrap()
 expect(fetch).toHaveBeenCalledOnce()
 expect(fetch).toHaveBeenCalledWith('/api/markets',undefined)
 expect(result).toEqual({markets:{markets:[],datasetVersion:'dataset-v1'},version:'dataset-v1'})
})
