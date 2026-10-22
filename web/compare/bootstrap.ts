import {api,type Markets} from '../api'

export type OpenChartsBootstrap={markets:Markets;version:string}

export async function loadOpenChartsBootstrap():Promise<OpenChartsBootstrap>{
 const markets=await api<Markets>('/markets')
 return {markets,version:markets.datasetVersion}
}
