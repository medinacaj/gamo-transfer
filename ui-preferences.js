/* Preferencias visuales del panel Gamo Transfer; no contienen datos operativos. */
(function(root){
  "use strict";
  const KEY="gamo.ui.preferences.v1";
  const validTheme=new Set(["light","dark"]);
  const validDensity=new Set(["comfortable","compact"]);
  let state={theme:"light",density:"comfortable"};
  try{
    const stored=JSON.parse(root.localStorage?.getItem(KEY)||"null");
    if(stored && typeof stored==="object"){
      if(validTheme.has(stored.theme)) state.theme=stored.theme;
      if(validDensity.has(stored.density)) state.density=stored.density;
    }
  }catch{}
  function sync(){
    document.body.dataset.theme=state.theme;
    document.body.dataset.density=state.density;
    const themeButton=document.querySelector('[data-ui-preference="theme"]');
    if(themeButton){
      const dark=state.theme==="dark";
      themeButton.textContent=dark?"☀ Modo claro":"☾ Modo oscuro";
      themeButton.setAttribute("aria-label",dark?"Cambiar a modo claro":"Cambiar a modo oscuro");
      themeButton.setAttribute("aria-pressed",String(dark));
      themeButton.title=dark?"Activar modo claro":"Activar modo oscuro";
    }
    const densityButton=document.querySelector('[data-ui-preference="density"]');
    if(densityButton){
      const compact=state.density==="compact";
      densityButton.textContent=compact?"▤ Vista cómoda":"▦ Vista compacta";
      densityButton.setAttribute("aria-label",compact?"Activar vista cómoda":"Activar vista compacta");
      densityButton.setAttribute("aria-pressed",String(compact));
      densityButton.title=compact?"Activar vista cómoda":"Activar vista compacta";
    }
  }
  function save(){
    try{root.localStorage?.setItem(KEY,JSON.stringify(state));}catch{}
    sync();
  }
  function setTheme(value){
    if(!validTheme.has(value)) return false;
    state.theme=value;save();return true;
  }
  function setDensity(value){
    if(!validDensity.has(value)) return false;
    state.density=value;save();return true;
  }
  document.addEventListener("click",event=>{
    const control=event.target.closest?.("[data-ui-preference]");
    if(!control)return;
    const kind=control.dataset.uiPreference;
    if(kind==="theme")setTheme(state.theme==="light"?"dark":"light");
    if(kind==="density")setDensity(state.density==="comfortable"?"compact":"comfortable");
  });
  root.GamoUI={read:()=>({...state}),setTheme,setDensity};
  sync();
})(window);
