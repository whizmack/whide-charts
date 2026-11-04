import {describe,expect,it} from 'vitest'
import {clampFavoritePosition,favoritePickerPlacement,parseFavorites} from './Favorites'

describe('favorite drawing preferences',()=>{
 it('retains supported unique tools and rejects malformed stored data',()=>{
  expect(parseFavorites({tools:['trendline','invalid','trendline','rectangle'],position:{x:50,y:20},open:true})).toEqual({tools:['trendline','rectangle'],position:{x:50,y:20},open:true})
  expect(parseFavorites({tools:'bad',position:{x:Infinity,y:-1},open:'yes'})).toEqual({tools:[],position:null,open:false})
 })
 it('keeps the bar reachable when the workspace shrinks',()=>{
  expect(clampFavoritePosition({x:900,y:-4},{width:300,height:200},{width:180,height:40})).toEqual({x:120,y:0})
  expect(clampFavoritePosition({x:20,y:20},{width:100,height:20},{width:150,height:40})).toEqual({x:0,y:0})
 })
 it('keeps the picker inside the workspace at both edges and opens into the larger vertical space',()=>{
  expect(favoritePickerPlacement({x:0,y:20},{width:300,height:200},{width:96,height:36})).toEqual({left:0,width:220,maxHeight:140,opensUp:false})
  expect(favoritePickerPlacement({x:204,y:150},{width:300,height:200},{width:96,height:36})).toEqual({left:-124,width:220,maxHeight:146,opensUp:true})
  expect(favoritePickerPlacement({x:0,y:0},{width:120,height:80},{width:96,height:36})).toEqual({left:0,width:120,maxHeight:40,opensUp:false})
 })
})
