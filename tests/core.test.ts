import { describe,expect,it,vi } from "vitest";
import { APP_REGISTRY } from "@/core/app-registry";
import { commands, executeCommand } from "@/core/commands";
import { windowReducer } from "@/core/window-reducer";
describe("app registry",()=>{
  it("keeps stable unique app ids",()=>{expect(new Set(APP_REGISTRY.map(a=>a.id)).size).toBe(APP_REGISTRY.length)});
  it("keeps window constraints within default size",()=>{for(const app of APP_REGISTRY){expect(app.windowConstraints.minWidth).toBeLessThanOrEqual(app.defaultSize.width);expect(app.windowConstraints.minHeight).toBeLessThanOrEqual(app.defaultSize.height)}});
});
describe("command bus",()=>{
  it("opens registered apps",()=>{const openApp=vi.fn();expect(executeCommand("open projects",{openApp,setTheme:vi.fn()}).ok).toBe(true);expect(openApp).toHaveBeenCalledWith("projects")});
  it("rejects unknown apps",()=>{expect(executeCommand("open vault",{openApp:vi.fn(),setTheme:vi.fn()}).ok).toBe(false)});
  it("has no duplicate command ids",()=>{expect(new Set(commands.map(c=>c.id)).size).toBe(commands.length)});
});
describe("window manager",()=>{
  it("opens and focuses singleton windows",()=>{const viewport={width:1200,height:800};const one=windowReducer([],{type:"OPEN",appId:"projects",viewport});const two=windowReducer(one,{type:"OPEN",appId:"projects",viewport});expect(two).toHaveLength(1);expect(two[0].zIndex).toBeGreaterThan(one[0].zIndex)});
  it("restores maximized windows",()=>{const [w]=windowReducer([],{type:"OPEN",appId:"about",viewport:{width:1200,height:800}});const [max]=windowReducer([w],{type:"TOGGLE_MAXIMIZE",id:w.instanceId,viewport:{width:1200,height:800}});const [restored]=windowReducer([max],{type:"TOGGLE_MAXIMIZE",id:w.instanceId,viewport:{width:1200,height:800}});expect(restored.status).toBe("open");expect(restored.width).toBe(w.width)});
  it("clamps MOVE within viewport bounds",()=>{const viewport={width:1200,height:800};const [w]=windowReducer([],{type:"OPEN",appId:"about",viewport});const movedNegative=windowReducer([w],{type:"MOVE",id:w.instanceId,x:-500,y:-500,viewport})[0];expect(movedNegative.x).toBe(0);expect(movedNegative.y).toBe(44);const movedOver=windowReducer([w],{type:"MOVE",id:w.instanceId,x:9000,y:9000,viewport})[0];expect(movedOver.x).toBe(viewport.width-w.width);expect(movedOver.y).toBe(viewport.height-w.height)});
  it("clamps RESIZE to registry minimums and viewport space",()=>{const viewport={width:1200,height:800};const [w]=windowReducer([],{type:"OPEN",appId:"about",viewport});const tooSmall=windowReducer([w],{type:"RESIZE",id:w.instanceId,width:10,height:10,viewport})[0];expect(tooSmall.width).toBe(420);expect(tooSmall.height).toBe(300);const tooBig=windowReducer([w],{type:"RESIZE",id:w.instanceId,width:9000,height:9000,viewport})[0];expect(tooBig.width).toBe(viewport.width-w.x);expect(tooBig.height).toBe(viewport.height-w.y)});
  it("snaps a window to half the screen and restores previous geometry",()=>{const viewport={width:1200,height:800};const [w]=windowReducer([],{type:"OPEN",appId:"about",viewport});const snapped=windowReducer([w],{type:"SNAP",id:w.instanceId,edge:"left",viewport})[0];expect(snapped.x).toBe(0);expect(snapped.width).toBe(viewport.width/2);expect(snapped.snapped).toBe("left");const moved=windowReducer([snapped],{type:"MOVE",id:w.instanceId,x:200,y:200,viewport})[0];expect(moved.snapped).toBeUndefined()});
});
